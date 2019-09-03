let app = require('../server');
let moment = require('moment');
let _ = require('lodash');
module.exports = function(options) {
    let getTokenFromRequest = function(request) {
        const headerToken = request.headers['authorization'];

        if (headerToken) {
            return getTokenFromRequestHeader(request);
        }

        throw new Error('Unauthorized request: no authentication given');
    };

    /**
     * Get the token from the request header.
     *
     * @see http://tools.ietf.org/html/rfc6750#section-2.1
     */

    let getTokenFromRequestHeader = function(request) {
        const token = request.headers['authorization'];
        const matches = token.match(/Bearer\s(\S+)/);

        if (!matches) {
            throw new Error('Invalid request: malformed authorization header');
        }

        return matches[1];
    };

    let getAccessToken = function (bearerToken) {
        // try and get the userID from the db using the bearerToken
        // console.log('Trying to find token with ID: ' + bearerToken);
        return app.models.accessToken.findById(bearerToken)
            .then(function(token) {
                return Promise.all([
                    token,
                    app.models.application.findById(token.clientId),
                    app.models.protocol_peer.findById(token.userId),
                ]);
            })
            .spread(function(token, client, user) {
                return {
                    accessToken: token.id,
                    accessTokenExpiresAt: moment().add(token.ttl, 'seconds').toDate(),
                    scope: token.scopes,
                    client: client, // with 'id' property
                    user: user,
                };
            });
    };

    return function authenticationHandler(req, res, next) {
        const token = getTokenFromRequest(req);
        getAccessToken(token)
            .then(token => {
                req.user = token.user;
                req.client = token.client;
                // console.log(token);
                next();
            })
            .catch(err => {
                console.log(err);
                next(err);
            });
    };
};
