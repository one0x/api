/* eslint-disable camelcase */
let loopbackApp, bcrypt;
let utils = require('utils');
let Promise = require('bluebird');
let moment = require('moment');
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

// list of valid scopes
const VALID_SCOPES = ['email', 'name', 'gyan:read', 'karma:read', 'gyan:write', 'karma:write'];

module.exports =  (app) => {
    loopbackApp = app;

    return  {

        getClient: getClient,

        grantTypeAllowed: grantTypeAllowed,

        getUser: getUser,

        saveToken: saveToken,

        getAccessToken: getAccessToken,

        saveAuthorizationCode: saveAuthorizationCode,

        getAuthorizationCode: getAuthorizationCode,

        revokeAuthorizationCode: revokeAuthorizationCode,

    };
};

/**
 *
 * @param clientId
 * @param clientSecret - used to validate the client
 *
 */
function getClient(clientId, clientSecret) {
    // console.log('Getting client with ID: ' + clientId);
    let params = {where: {id: clientId}};
    if (clientSecret) {
        params = {where: {and: [{id: clientId}, {clientKey: clientSecret}]}};
    }
    return loopbackApp.models.application.find(params)
        .then((client) => {
            return {
                id: client[0].id,
                redirectUris: client[0].callbackUrls,
                grants: client[0].permissions,
            };
        })
        .catch(err => {
            console.error(err);
        });
}

/**
 *
 * This method determines whether or not the client which has to the specified clientID
 * is permitted to use the specified grantType.
 *
 * @param clientID
 * @param grantType
 *
 */
function grantTypeAllowed(clientID, grantType) {
    return Promise.resolve(true);
}

/**
 * The method attempts to find a user with the specified username and password.
 *
 * @param username
 * @param password
 *
 */
function getUser(username, password) {
    // try and get the user using the user's credentials
    let user;
    return loopbackApp.models.protocol_peer.findOne({where: {email: username}})
        .then(peerInstance => {
            // console.log(peerInstance);
            if (peerInstance !== null) {
                user = peerInstance;
                return hasPassword(password, user.password);
            } else {
                return Promise.reject(new Error('Invalid user credentials'));
            }
        })
        .then(() => {
            return Promise.resolve(user);
        })
        .catch(error => Promise.reject(error));
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

/**
 * saves the accessToken along with the userID retrieved from the given user
 *
 * @param token
 * @param client
 * @param user
 */
function saveToken(token, client, user) {
    // save the accessToken along with the user.id
    let fns = [
        loopbackApp.models.accessToken.create({
            id: token.accessToken,
            ttl: moment(token.accessTokenExpiresAt).diff(moment(), 'seconds'),
            scopes: token.scope,
            clientId: client.id,
            userId: user.id,
        }),
        loopbackApp.models.refreshToken.create({
            id: token.refreshToken,
            ttl: moment(token.refreshTokenExpiresAt).diff(moment(), 'seconds'),
            scopes: token.scope,
            clientId: client.id,
            userId: user.id,
        }),
    ];
    return Promise.all(fns)
        .spread(function(accessToken, refreshToken) {
            return {
                accessToken: accessToken.id,
                accessTokenExpiresAt: moment().add(accessToken.ttl, 'seconds').toDate(),
                refreshToken: refreshToken.id,
                refreshTokenExpiresAt: moment().add(refreshToken.ttl, 'seconds').toDate(),
                scope: accessToken.scopes,
                client: {id: accessToken.clientId},
                user: {id: accessToken.userId},
            };
        });
}

/**
 * This method is called to validate a user when they're calling APIs
 * that have been authenticated. The user is validated by verifying the
 * bearerToken which must be supplied when calling an endpoint that requires
 * you to have been authenticated.
 *
 * @param bearerToken
 *
 */
function getAccessToken(bearerToken) {
    // try and get the userID from the db using the bearerToken
    // console.log('Trying to find token with ID: ' + bearerToken);
    return loopbackApp.models.accessToken.findById(bearerToken)
        .then(function(token) {
            return Promise.all([
                token,
                loopbackApp.models.application.findById(token.clientId),
                loopbackApp.models.protocol_peer.findById(token.userId),
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
}

function getAuthorizationCode(authorizationCode) {
    return loopbackApp.models.authorizationCode.findById(authorizationCode)
        .then(function(code) {
            if (code) {
                return Promise.all([
                    code,
                    loopbackApp.models.application.findById(code.clientId),
                    loopbackApp.models.protocol_peer.findById(code.userId),
                ]);
            } else {
                return Promise.all([null, null, null]);
            }
        })
        .spread(function(code, client, user) {
            if (code) {
                return {
                    code: code.id,
                    expiresAt: moment().add(code.ttl, 'seconds').toDate(),
                    redirectUri: code.redirectUri,
                    scope: code.scopes,
                    client: client, // with 'id' property
                    user: user,
                };
            } else {
                return null;
            }
        });
}

function saveAuthorizationCode(code, client, user) {
    let authCode = {
        id: code.authorizationCode,
        ttl: moment(code.expiresAt).diff(moment(), 'seconds'),
        redirectUri: code.redirectUri,
        scopes: code.scope,
        clientId: client.id,
        userId: user.id,
    };
    return loopbackApp.models.authorizationCode.create(authCode)
        .then(function(authorizationCode) {
            return {
                authorizationCode: authorizationCode.id,
                expiresAt: moment().add(authorizationCode.ttl, 'seconds').toDate(),
                redirectUri: authorizationCode.redirectUri,
                scope: authorizationCode.scopes,
                client: {id: authorizationCode.clientId},
                user: {id: authorizationCode.userId},
            };
        });
}

function revokeAuthorizationCode(code) {
    return loopbackApp.models.authorizationCode.destroyById(code.code)
        .then(function(authorizationCode) {
            return !!authorizationCode;
        });
}

