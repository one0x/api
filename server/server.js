'use strict';

let loopback = require('loopback');
let boot = require('loopback-boot');

let app = module.exports = loopback();
let path = require('path');
let https = require('https');
let http = require('http');
let sslConfig = require('./ssl-config');
let bodyParser = require('body-parser');
let oauth2 = require('loopback-component-oauth2');
const Sentry = require('@sentry/node');

Sentry.init({dsn: 'https://f07f7574011f4dfda64bc4bd7d7042d9@sentry.io/1367265'});

// The request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());

// The error handler must be before any other error middleware
app.use(Sentry.Handlers.errorHandler());

let options = {
    dataSource: app.dataSources.neo4j, // Data source for oAuth2 metadata persistence
    loginPage: '/login', // The login page url
    loginPath: '/login', // The login form processing url
};

/*oauth2.oAuth2Provider(
    app, // The app instance
    options // The options
);*/

// Optional fallthrough error handler
app.use(function onError(err, req, res, next) {
    // The error id is attached to `res.sentry` to be returned
    // and optionally displayed to the user for support.
    res.statusCode = 500;
    res.end(res.sentry + '\n');
});

app.middleware('parse', bodyParser.json({limit: '50mb'}));
// to support URL-encoded bodies
app.middleware('parse', bodyParser.urlencoded({limit: '50mb', extended: true}));

// Setup the view engine (jade)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.post('/contact', function(req, res, next) {
    if (req.body.name && req.body.email) {
        console.log('Email received from : ' + req.body.email);
        // Send welcome email to user
        let message = {
            name: req.body.name,
            email: req.body.email,
            message: req.body.message,
        };
        let renderer = loopback.template(path.resolve(__dirname, 'views/contactEmail.ejs'));
        let htmlBody = renderer(message);
        loopback.Email.send({
            to: app.get('adminEmail'),
            from: 'one0x <noreply@mx.one0x.com>',
            subject: 'New contact from: ' + req.body.name,
            html: htmlBody,
        })
            .then(function(response) {
                console.log('email sent! - ' + response);
            })
            .catch(function(err) {
                console.log('email error! - ' + err);
            });
        res.json({
            result: 'Success',
        });
    } else {
        res.json(500, {
            result: 'No email received',
        });
    }
});

app.start = function(httpOnly) {
    if (httpOnly === undefined) {
        httpOnly = process.env.HTTP;
    }
    let server = null;
    if (!httpOnly) {
        let options = {
            key: sslConfig.privateKey,
            cert: sslConfig.certificate,
        };
        server = https.createServer(options, app);
    } else {
        server = http.createServer(app);
    }
    // start the web server
    server.listen(app.get('port'), function() {
        let baseUrl = (httpOnly ? 'http://' : 'https://') + app.get('host') + ':' + app.get('port');
        app.emit('started', baseUrl);
        console.log('Web server listening at: %s', baseUrl);

        if (app.get('loopback-component-explorer')) {
            let explorerPath = app.get('loopback-component-explorer').mountPath;
            console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
        }
    });
    return server;
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
    if (err) throw err;

    // start the server if `$ node server.js`
    if (require.main === module) {
        app.start();
        app.contractService = require('./contractControl')(app);
    }
});
