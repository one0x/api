let metrics = require('metrics');

/* jshint unused:vars */
module.exports = function(options) {
    options = options || {};

    let timers = {};
    let report = new metrics.Report();

    return function metrics(req, res, next) {
        // Handle settings via /metrics (DEMO only as it is not protected)
        if (req.path === (options.path || '/metrics')) {
            return res.json(report.summary());
        }

        let timer;
        let key = (options.getKey || getKey)(req);
        if (key) {
            timer = timers[key];
            if (!timer) {
                timer = new metrics.Timer();
                report.addMetric(key, timer);
                timers[key] = timer;
            }
            let start = process.hrtime();
            res.once('finish', function() {
                let diff = process.hrtime(start);
                let ms = diff[0] * 1e3 + diff[1] * 1e-6;
                timer.update(ms);
            });
        }
        next();
    };
};

/**
 * Build the key for rate limiting from the request
 * @param {Request} req The request object
 * @returns {string} The rate limiting key
 */
function getKey(req) {
    let clientId = '';
    let clientApp = req.authInfo && req.authInfo.app;
    if (clientApp) {
        clientId = clientApp.id;
    }
    return clientId;
}
