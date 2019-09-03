'use strict';

let loopback = require('loopback');
let boot = require('loopback-boot');
let bcrypt;
let app = module.exports = loopback();
let path = require('path');
let https = require('https');
let cors = require('cors');
let http = require('http');
let sslConfig = require('./ssl-config');
let bodyParser = require('body-parser');
const Sentry = require('@sentry/node');
let OAuthServer = require('express-oauth-server');
const oAuthModel = require('./middleware/authorisation/accessTokenModel')(app);

try {
    // Try the native module first
    bcrypt = require('bcrypt');
    // Browserify returns an empty object
    if (bcrypt && typeof bcrypt.compare !== 'function') {
        bcrypt = require('bcryptjs');
    }
} catch (err) {
    // Fall back to pure JS impl
    bcrypt = require('bcryptjs');
}

// Middleware to enable cors on the server
let originsWhitelist = [
    'null',
    'localhost:9090',      // frontend url for development
    'localhost:8080',      // frontend url for development
    'https://one0x.com',
    'https://theblockchainu.com',
];
let corsOptions = {
    origin: function(origin, callback) {
        let isWhitelisted = originsWhitelist.indexOf(origin) !== -1;
        callback(null, isWhitelisted);
    },
    allowedHeaders: 'Content-Type, Authorization',
    credentials: false,
};

Sentry.init({dsn: 'https://f07f7574011f4dfda64bc4bd7d7042d9@sentry.io/1367265'});

app.oauth = new OAuthServer({
    model: oAuthModel,
    allowBearerTokensInQueryString: true,
});

// The request handler must be the first middleware on the app
app.middleware('initial', Sentry.Handlers.requestHandler());

app.middleware('initial:before', cors(corsOptions));

app.middleware('auth', ['/v1'], app.oauth.authenticate());

app.middleware('parse', bodyParser.json({limit: '50mb'}));
// to support URL-encoded bodies
app.middleware('parse', bodyParser.urlencoded({limit: '50mb', extended: true}));

/* // The error handler must be before any other error middleware
app.middleware('final', Sentry.Handlers.errorHandler());

// Optional fallthrough error handler
app.middleware('final', function onError(err, req, res, next) {
    // The error id is attached to `res.sentry` to be returned
    // and optionally displayed to the user for support.
    res.statusCode = 500;
    res.end(res.sentry + '\n');
}); */

// Setup the view engine (jade)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

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

app.post('/login', (req, res, next) => {
    if (!isString(req.body.username) || !isString(req.body.password)) {
        return sendResponse(res, 'Invalid Credentials', true);
    }

    function hasPassword(plain, hash) {
        if (hash && plain) {
            return bcrypt.compare(plain, hash, function(err, isMatch) {
                if (err) return Promise.reject(err);
                return Promise.resolve(isMatch);
            });
        } else {
            return Promise.reject(new Error('Invalid parameters'));
        }
    }

    let user;
    app.models.protocol_peer.findOne({where: {email: req.body.username}})
        .then(peerInstance => {
            console.log(peerInstance);
            if (peerInstance !== null) {
                user = peerInstance;
                return hasPassword(req.body.password, user.password);
            } else {
                return Promise.reject(new Error('Invalid user credentials'));
            }
        })
        .then(() => {
            return sendResponse(res, user);
        })
        .catch(error => sendResponse(res, error.message, true));
});

app.post('/register', (req, res, next) => {
    if (!isString(req.body.email) || !isString(req.body.password)) {
        return sendResponse(res, 'Invalid Credentials', true);
    }

    const data = req.body;

    app.models.peer.create(data, (err, result) => {
        if (err) {
            return sendResponse(res, err.message, true);
        } else {
            return sendResponse(res, result);
        }
    });
});

app.post('/oauth/auth', app.oauth.authorize());

app.post('/oauth/token', app.oauth.token());

app.get('/client/:id', (req, res, next) => {
    app.models.application.findById(req.params.id)
        .then(client => {
            console.log(client);
            if (client !== null) {
                sendResponse(res, client);
            } else {
                sendResponse(res, 'Invalid client ID', true);
            }
        })
        .catch(err => {
            sendResponse(res, err.message, true);
        });
});

/**
 *
 * sends a response created out of the specified parameters to the client.
 *
 * @param res - response to respond to client
 * @param message - message to send to the client
 * @param error - error to send to the client
 */
function sendResponse(res, message, error) {
    /* Here we create the status code to send to the client depending on whether
    or not the error being passed in is null. Then, we create and send
    the json object response to the client */
    res
        .status(error !== null ? error != null ? 400 : 200 : 400)
        .json({
            'message': message,
            'error': error,
        });
}

/**
 *
 * Returns true the specified parameters is a string else it returns false
 *
 * @param parameter - the variable we're checking is a String
 * @return {boolean}
 */
function isString(parameter) {
    return parameter != null && (typeof parameter === 'string' || parameter instanceof String);
}

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
