'use strict';
let request = require('request');
let app = require('../../server/server');
const apiUrl = app.get('apiUrl');

module.exports = function(Karma) {
    Karma.getBalance = function(id, cb) {
        this.app.getKarmaContractInstance(false)
            .then(karmaContractInstance => {
                return karmaContractInstance.balanceOf(id);
            })
            .then(function(result) {
                console.log('Got karma balance: ' + result);
                cb(null, Karma.app.web3.utils.toDecimal(result));
            })
            .catch(err => {
                console.error(err);
                cb(err);
            });
    };

    Karma.getTotalSupply = function(cb) {
        this.app.getKarmaContractInstance(false)
            .then(karmaContractInstance => {
                return karmaContractInstance.totalSupply();
            })
            .then(function(result) {
                console.log('Got karma supply: ' + result);
                cb(null, Karma.app.web3.utils.toDecimal(result));
            })
            .catch(err => {
                console.error(err);
                cb(err);
            });
    };

    Karma.getDailyMint = function(cb) {
        this.app.getGyanContractInstance(false)
            .then(gyanContractInstance => {
                return gyanContractInstance.dailyKarmaMint();
            })
            .then(function(result) {
                console.log('Got karma mint rate: ' + result);
                cb(null, Karma.app.web3.utils.toDecimal(result));
            })
            .catch(err => {
                console.error(err);
                cb(err);
            });
    };

    Karma.getPotentialRewards = function(id, cb) {
        this.app.getGyanContractInstance(false)
            .then(gyanContractInstance => {
                return gyanContractInstance.potentialKarmaReward(id);
            })
            .then(function(result) {
                console.log('Got potential karma rewards: ' + result);
                cb(null, Karma.app.web3.utils.toDecimal(result));
            })
            .catch(err => {
                console.error(err);
                cb(err);
            });
    };

    Karma.mintRewards = function(data, cb) {
        let callbackBody = {};
        this.app.getGyanContractInstance(true)
            .then(gyanContractInstance => {
                cb(null, {result: 'success'});
                return gyanContractInstance.mintRewards();
            })
            .then(function(result) {
                const transaction = {
                    result: JSON.stringify(result),
                    type: 'reward',
                };
                Karma.app.models.transactions.create(transaction, function(err, transactionInstance) {
                    if (!err && transactionInstance) {
                        console.log('Tried minting karma rewards: ');
                        console.log(result);
                        successCallback(transactionInstance.id, result, data);
                    } else {
                        console.log('mintRewards: Failed to create transaction entry.');
                        failureCallback(err, data);
                    }
                });
            }, err => {
                console.error('Could not execute Karma rewards');
                console.log(err.message);
                failureCallback(err, data);
            })
            .catch(err => {
                console.error('Could not execute Karma rewards');
                failureCallback(err, data);
            });

        let successCallback = (transactionId, blockchainResult, requestBody) => {
            if (requestBody.successCallback) {
                // Trigger the result hook for this transaction
                callbackBody = {
                    transactionId: transactionId,
                    result: blockchainResult,
                    userParam1: requestBody.userParam1,
                    userParam2: requestBody.userParam2,
                    userParam3: requestBody.userParam3,
                };
                request
                    .post({
                        url: requestBody.successCallback,
                        body: callbackBody,
                        json: true,
                    }, (err, response, data) => {
                        if (err) {
                            console.error(err);
                        } else if (data) {
                            console.log('mintRewards: Remote hook notified');
                            console.log(data);
                        } else {
                            console.log('Remote hook notify failure');
                        }
                    });
            }
        };

        let failureCallback = (error, requestBody) => {
            if (requestBody.failureCallback) {
                // Trigger the result hook for this transaction
                callbackBody = {
                    error: error.message,
                    errorName: error.name,
                };
                request
                    .post({
                        url: requestBody.failureCallback,
                        body: callbackBody,
                        json: true,
                    }, (err, response, data) => {
                        if (err) {
                            console.error(err);
                        } else if (data) {
                            console.log('mintRewards: Remote hook notified');
                            console.log(data);
                        } else {
                            console.log('Remote hook notify failure');
                        }
                    });
            }
        };
    };

    Karma.remoteMethod(
        'getBalance',
        {
            description: 'Get Karma balance of a peer',
            accepts: [
                {arg: 'id', type: 'string', required: true, description: 'Ethereum address of the peer'},
            ],
            returns: {arg: 'result', type: ['object'], root: true},
            http: {verb: 'get', path: '/:id'},
        }
    );

    Karma.remoteMethod(
        'getTotalSupply',
        {
            description: 'Get total Karma supply',
            returns: {arg: 'result', type: ['object'], root: true},
            http: {verb: 'get', path: '/'},
        }
    );

    Karma.remoteMethod(
        'getDailyMint',
        {
            description: 'Get the current mint rate of Karma every 24 hours. Depends on the total Karma tokens in circulation.',
            returns: {arg: 'result', type: ['object'], root: true},
            http: {verb: 'get', path: '/mintRate'},
        }
    );

    Karma.remoteMethod(
        'getPotentialRewards',
        {
            description: 'Get potential karma rewards for a user based on his current floating Gyan.',
            accepts: [
                {arg: 'id', type: 'string', required: true, description: 'Ethereum address of the peer'},
            ],
            returns: {arg: 'result', type: ['object'], root: true},
            http: {verb: 'get', path: '/:id/potentialRewards'},
        }
    );

    Karma.remoteMethod(
        'mintRewards',
        {
            description: 'Execute daily karma rewards minting and distribution',
            accepts: [
                { arg: 'body', type: 'object', required: true, http: { source: 'body' } },
            ],
            returns: {arg: 'result', type: ['object'], root: true},
            http: {verb: 'post', path: '/mintRewards'},
        }
    );
};
