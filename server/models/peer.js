'use strict';
const InputDataDecoder = require('ethereum-input-data-decoder');
let request = require('request');
let app = require('../../server/server');
const apiUrl = app.get('apiUrl');

module.exports = function(Peer) {
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
        Peer.app.models.protocol_peer.findById(id, filter, function(err, protoPeerInstance) {
            if (err || protoPeerInstance === null) {
                cb(err);
            } else {
                cb(null, protoPeerInstance.transactions());
            }
        });
    };

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

    Peer.create = function(data, cb) {
        cb(null, {result: 'success'});
        Peer.app.web3.eth.personal.newAccount(data.password)
            .then(newEthAddress => {
                if (newEthAddress && newEthAddress.substring(0, 2) === '0x') {
                    console.log('NEW WALLET ACCOUNT: ' + newEthAddress);
                    // Hit the remote API server hook with response
                    const protocolPeer = {
                        id: newEthAddress,
                    };
                    // Create a new ethereum peer node in DB and add a new transaction for him
                    Peer.app.models.protocol_peer.create(protocolPeer, function(err, protoPeerInstance) {
                        if (err) {
                            console.error(err);
                            Peer.saveWalletHook(newEthAddress, data.userId, err);
                        } else {
                            // Transfer 100 Karma from advisory pool to the new account.
                            Peer.app.getKarmaContractInstanceFor(Peer.app.get('advisoryPoolAddress'), Peer.app.get('advisoryPoolPassword'))
                                .then(karmaContractInstance => {
                                    return karmaContractInstance.transfer(newEthAddress, 100);
                                })
                                .then(function(karmaTransferResult) {
                                    // Save this transaction result and link it to its peer
                                    const transaction = {
                                        result: JSON.stringify(karmaTransferResult),
                                    };
                                    Peer.app.models.transactions.create(transaction, function(err, transactionInstance) {
                                        if (err) {
                                            console.error(err);
                                            Peer.saveWalletHook(newEthAddress, data.userId, err);
                                        } else {
                                            transactionInstance.peer.add(protoPeerInstance, function(err, peerTansactionRelationInstance) {
                                                if (err) {
                                                    console.error(err);
                                                    Peer.saveWalletHook(newEthAddress, data.userId, err);
                                                } else {
                                                    console.log('Sent 100 Karma to new user account: ');
                                                    console.log(karmaTransferResult);
                                                    Peer.saveWalletHook(newEthAddress, data.userId, null);
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
                    Peer.saveWalletHook(null, data.userId, new Error('Response from blockchain is not valid Wallet address'));
                }
            })
            .catch(err => {
                console.error(err);
                Peer.saveWalletHook(null, data.userId, err);
            });
    };

    Peer.saveWalletHook = function(ethAddress, userId, err) {
        // Remote hook to notify API server
        let body = {
            ethAddress: ethAddress,
            userId: userId,
            error: err,
            result: ethAddress,
        };
        // Trigger the result hook for this transaction
        request
            .post({
                url: apiUrl + '/api/peers/save-wallet',
                body: body,
                json: true,
            }, (err, response, data) => {
                if (err) {
                    console.error(err);
                } else if (data) {
                    console.log('UPDATED WALLET ON API SERVER');
                    console.log(data);
                } else {
                    console.log('transaction Id not found');
                    console.log(data);
                }
            });
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
};
