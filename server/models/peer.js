'use strict';
const InputDataDecoder = require('ethereum-input-data-decoder');
let request = require('request');
let app = require('../../server/server');
const apiUrl = app.get('apiUrl');
let bcrypt;
let MAX_PASSWORD_LENGTH = 72;
let SALT_WORK_FACTOR = 10;

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

module.exports = function(Peer) {
    /**
     * Fetch all blockchain transactions of a user
     * @param id Blockchain address of the user
     * @param cb Callback function
     */
    Peer.fetchTransactions = function(id, cb) {
        const filter = {
            'include': [
                {
                    'relation': 'transactions',
                    'scope': {
                        'order': 'updatedAt DESC',
                    },
                },
            ],
        };
        Peer.app.models.protocol_peer.findById(id.toLowerCase(), filter, function(err, protoPeerInstance) {
            if (err || protoPeerInstance === null) {
                cb(err);
            } else {
                cb(null, protoPeerInstance.transactions());
            }
        });
    };

    /**
     * Fetch all blockchain events of a user
     * @param id Blockchain address of the user
     * @param cb Callback function
     */
    Peer.fetchEvents = function(id, cb) {
        const filter = {
            'include': [
                {
                    'relation': 'events',
                    'scope': {
                        'include': ['peer'],
                        'order': 'updatedAt DESC',
                    },
                },
            ],
        };
        Peer.app.models.protocol_peer.findById(id.toLowerCase(), filter, function(err, protoPeerInstance) {
            if (err || protoPeerInstance === null) {
                cb(err);
            } else {
                cb(null, protoPeerInstance.events());
            }
        });
    };

    /**
     * Fetch details of a particular blockchain transaction
     * @param id Blockchain address of the user
     * @param fk Hash of the concerned transaction
     * @param cb Callback function
     */
    Peer.fetchTransactionDetails = function(id, fk, cb) {
        Peer.app.web3.eth.getTransaction(fk)
            .then(result => {
                console.log(result);
                const decoder = new InputDataDecoder(`${__dirname}/../contracts/BaseCollection.json`);
                const input = decoder.decodeData(result.input);
                cb(null, input);
            })
            .catch(err => {
                console.log(err);
                cb(err);
            });
    };

    /*!
	 * Hash the plain password
	 */
    let hashPassword = function(plain) {
        try {
            validatePassword(plain);
        } catch (err) {
            return err;
        }
        let salt = bcrypt.genSaltSync(SALT_WORK_FACTOR);
        return bcrypt.hashSync(plain, salt);
    };

    let validatePassword = function(plain) {
        let err;
        if (plain && typeof plain === 'string' && plain.length <= MAX_PASSWORD_LENGTH) {
            return true;
        }
        if (plain.length > MAX_PASSWORD_LENGTH) {
            err = new Error(g.f('Password too long: %s', plain));
            err.code = 'PASSWORD_TOO_LONG';
        } else {
            err = new Error(g.f('Invalid password: %s', plain));
            err.code = 'INVALID_PASSWORD';
        }
        err.statusCode = 422;
        throw err;
    };

    let setPassword = function(plain) {
        if (typeof plain !== 'string') {
            return;
        }
        if (plain.indexOf('$2a$') === 0 && plain.length === 60) {
            // The password is already hashed. It can be the case
            // when the instance is loaded from DB
            return plain;
        } else {
            return hashPassword(plain);
        }
    };

    /**
     * 1. Create a new blockchain account for user.
     * 2. Update details in local DB.
     * 3. Send 100 Karma bonus to user
     * 4. Save transaction details in local DB
     * 5. Send success or failure callback
     * @param data JSON body of new user account
     * @param cb Callback function
     */
    Peer.create = function(data, cb) {
        let query = {
            where: {
                or: [
                    {email: data.email},
                    {userId: data.userId},
                ],
            },
        };
        let callbackBody = {};

        Peer.app.models.protocol_peer.findOne(query)
            .then(peerInstance => {
                if (peerInstance !== null) {
                    // Peer already exists.
                    console.error('Peer already exists');
                    cb(new Error('User already exists'));
                } else {
                    cb(null, {result: 'success'});
                    Peer.app.web3.eth.personal.newAccount(data.password)
                        .then(newEthAddress => {
                            if (newEthAddress && newEthAddress.substring(0, 2) === '0x') {
                                console.log('NEW WALLET ACCOUNT: ' + newEthAddress.toLowerCase());
                                // Hit the remote API server hook with response
                                const protocolPeer = {
                                    id: newEthAddress.toLowerCase(),
                                    email: data.email,
                                    fName: data.fName,
                                    lName: data.lName,
                                    password: setPassword(data.password),
                                    userId: data.userId,
                                };
                                // Create a new ethereum peer node in DB and add a new transaction for him
                                Peer.app.models.protocol_peer.create(protocolPeer, function(err, protoPeerInstance) {
                                    if (err) {
                                        console.error(err);
                                        failureCallback(newEthAddress, data.userId, err, data);
                                    } else {
                                        console.log('New Protocol Peer Saved to DB: ');
                                        console.log(protoPeerInstance);
                                        // Transfer 100 Karma from advisory pool to the new account.
                                        Peer.app.getKarmaContractInstanceFor(Peer.app.get('advisoryPoolAddress'), Peer.app.get('advisoryPoolPassword'))
                                            .then(karmaContractInstance => {
                                                return karmaContractInstance.transferFor(Peer.app.get('advisoryPoolAddress'), newEthAddress, 100);
                                            })
                                            .then(function(karmaTransferResult) {
                                                // Save this transaction result and link it to its peer
                                                const transaction = {
                                                    result: JSON.stringify(karmaTransferResult),
                                                };
                                                Peer.app.models.transactions.create(transaction, function(err, transactionInstance) {
                                                    if (err) {
                                                        console.error(err);
                                                        failureCallback(newEthAddress, data.userId, err, data);
                                                    } else {
                                                        transactionInstance.peer.add(protoPeerInstance, function(err, peerTansactionRelationInstance) {
                                                            if (err) {
                                                                console.error(err);
                                                                failureCallback(newEthAddress, data.userId, err, data);
                                                            } else {
                                                                console.log('Sent 100 Karma to new user account: ');
                                                                console.log(karmaTransferResult);
                                                                successCallback(newEthAddress, data.userId, newEthAddress, data);
                                                            }
                                                        });
                                                    }
                                                });
                                            })
                                            .catch(err => {
                                                console.error(err);
                                            });
                                    }
                                });
                            } else {
                                failureCallback(null, data.userId, new Error('Response from blockchain is not valid Wallet address'), data);
                            }
                        })
                        .catch(err => {
                            console.error(err);
                            failureCallback(null, data.userId, err, data);
                        });
                }
            })
            .catch(err => {
                console.error(err);
                cb(new Error('Invalid data. Internal server error: ' + err));
            });

        let successCallback = (ethAddress, userId, blockchainResult, requestBody) => {
            if (requestBody.successCallback) {
                // Trigger the result hook for this transaction
                callbackBody = {
                    ethAddress: ethAddress,
                    userId: userId,
                    result: blockchainResult,
                    userParam1: requestBody.userParam1,
                    userParam2: requestBody.userParam2,
                    userParam3: requestBody.userParam3,
                    userParam4: requestBody.userParam4,
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
                            console.log('newWallet Success: Remote hook notified');
                            console.log(data);
                        } else {
                            console.log('newWallet Success: Remote hook failed');
                        }
                    });
            }
        };

        let failureCallback = (ethAddress, userId, error, requestBody) => {
            if (requestBody.failureCallback) {
                // Trigger the result hook for this transaction
                callbackBody = {
                    ethAddress: ethAddress,
                    userId: userId,
                    error: error,
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
                            console.log('newWallet Failed: Remote hook notified');
                            console.log(data);
                        } else {
                            console.log('newWallet Failed: Remote hook failed');
                        }
                    });
            }
        };
    };

    Peer.getCookie = function(req, cb) {
        if (req.user) {
            cb(null, req.user);
        } else {
            cb(new Error('User not logged in.'));
        }
    };

    Peer.remoteMethod(
        'create',
        {
            description: 'Create a new peer wallet on the blockchain',
            accepts: [
                {arg: 'data', type: 'object', http: {source: 'body'}, required: true},
            ],
            returns: {arg: 'result', type: 'object', root: true},
            http: {verb: 'post', path: '/'},
        }
    );

    Peer.remoteMethod(
        'fetchTransactions',
        {
            description: 'Fetch all transactions of this peer',
            accepts: [
                {arg: 'id', type: 'string', required: true, description: 'Ethereum address of the peer'},
            ],
            returns: {arg: 'result', type: 'object', root: true},
            http: {verb: 'get', path: '/:id/transactions'},
        }
    );

    Peer.remoteMethod(
        'fetchEvents',
        {
            description: 'Fetch all events of this peer',
            accepts: [
                {arg: 'id', type: 'string', required: true, description: 'Ethereum address of the peer'},
            ],
            returns: {arg: 'result', type: 'object', root: true},
            http: {verb: 'get', path: '/:id/events'},
        }
    );

    Peer.remoteMethod(
        'fetchTransactionDetails',
        {
            description: 'Fetch details of transaction of this peer',
            accepts: [
                {arg: 'id', type: 'string', required: true, description: 'Ethereum address of the peer'},
                {arg: 'fk', type: 'string', required: true, description: 'Transaction hash'},
            ],
            returns: {arg: 'result', type: 'object', root: true},
            http: {verb: 'get', path: '/:id/transactions/:fk'},
        }
    );

    Peer.remoteMethod(
        'getCookie',
        {
            description: 'Fetch user ID of logged in user',
            accepts: [
                {arg: 'req', type: 'object', http: {source: 'req'}},
            ],
            returns: {arg: 'result', type: 'object', root: true},
            http: {verb: 'get', path: '/cookie'},
        }
    );
};
