'use strict';
const InputDataDecoder = require('ethereum-input-data-decoder');

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
        Peer.app.web3.eth.personal.newAccount(data.password)
            .then(result => {
                console.log(result);
                const protocolPeer = {
                    id: result,
                };
                Peer.app.models.protocol_peer.create(protocolPeer, function(err, protoPeerInstance) {
                    if (err) {
                        cb(err);
                    } else {
                        this.app.getKarmaContractInstanceFor(this.app.get('advisoryPoolAddress'), this.app.get('advisoryPoolPassword'))
                            .then(karmaContractInstance => {
                                return karmaContractInstance.transfer(result, 100);
                            })
                            .then(function(result1) {
                                // index this transaction result and link it to its peer
                                const transaction = {
                                    result: JSON.stringify(result1),
                                };
                                Peer.app.models.transactions.create(transaction, function(err, transactionInstance) {
                                    if (err) {
                                        cb(err);
                                    } else {
                                        transactionInstance.peer.add(result, function(err, peerInstance) {
                                            if (err) {
                                                cb(err);
                                            } else {
                                                console.log('Send 100 Karma to new user account: ');
                                                console.log(result1);
                                                cb(null, result);
                                            }
                                        });
                                    }
                                });
                            })
                            .catch(err => {
                                console.error(err);
                                cb(err);
                            });
                    }
                });
            })
            .catch(err => {
                console.error(err);
                cb(err);
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
