'use strict';
let request = require('request');
let app = require('../../server/server');
const apiUrl = app.get('apiUrl');

module.exports = function(Collection) {
    const globalFunctions = require('../globalFunctions')(Collection);

    Collection.create = function(data, cb) {
        this.app.getCollectionContractInstance()
            .then(collectionContractInstance => {
                return collectionContractInstance.create(data.uniqueId.replace(/-/g, ''), data.teacherAddress, data.type, data.learningHours, data.academicGyan, data.nonAcademicGyan, data.assessmentRuleKeys, data.assessmentRuleValues, data.nonAcademicRules, data.topics);
            })
            .then(function(result) {
                // index this transaction result and link it to its peer
                const transaction = {
                    result: JSON.stringify(result),
                };
                Collection.app.models.transactions.create(transaction, function(err, transactionInstance) {
                    if (err) {
                        cb(err);
                    } else {
                        transactionInstance.peer.add(data.teacherAddress, function(err, peerInstance) {
                            if (err) {
                                cb(err);
                            } else {
                                console.log('Add collection to blockchain: ');
                                console.log(result);
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
    };

    Collection.join = function(id, fk, data, cb) {
        let scholarshipId = 'NA';
        if (data.scholarshipId && data.scholarshipId.length > 0) {
            scholarshipId = data.scholarshipId;
        }
        this.app.getCollectionContractInstance()
            .then(collectionContractInstance => {
                return collectionContractInstance.join(id.replace(/-/g, ''), fk, scholarshipId.replace(/-/g, ''));
            })
            .then(function(result) {
                // index this transaction result and link it to its peer
                const transaction = {
                    result: JSON.stringify(result),
                };
                Collection.app.models.transactions.create(transaction, function(err, transactionInstance) {
                    if (err) {
                        cb(err);
                    } else {
                        transactionInstance.peer.add(fk, function(err, peerInstance) {
                            if (err) {
                                cb(err);
                            } else {
                                console.log('Recorded participation on blockchain: ');
                                console.log(result);
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
    };

    Collection.assess = function(id, fk, data, cb) {
        this.app.getCollectionContractInstance()
            .then(collectionContractInstance => {
                console.log('Received student assessment request for collection: ' + id + ', participant: ' + fk);
                console.log(data);
                cb(null, {result: 'success'});
                return collectionContractInstance.assess(id.replace(/-/g, ''), fk, data.assessmentResult, data.engagementResult, data.commitmentResult, data.hash);
            })
            .then(function(result) {
                // index this transaction result and link it to its peer
                const transaction = {
                    result: JSON.stringify(result),
                };
                let body = {};
                Collection.app.models.transactions.create(transaction, function(err, transactionInstance) {
                    if (err) {
                        body = {
                            certificateId: data.certificateId,
                            collectionId: id,
                            hash: data.hash,
                            error: err,
                        };
                        // Trigger the result hook for this transaction
                        request
                            .post({
                                url: apiUrl + '/api/assessment_results/sign-certificate',
                                body: body,
                                json: true,
                            }, (err, response, data) => {
                                if (err) {
                                    console.error(err);
                                } else if (data) {
                                    console.log('BLOCKCHAIN TRANSACTION IN PROGRESS...');
                                    console.log(data);
                                } else {
                                    console.log('transaction Id not found');
                                    console.log(data);
                                }
                            });
                    } else {
                        transactionInstance.peer.add(fk, function(err, peerInstance) {
                            if (err) {
                                body = {
                                    certificateId: data.certificateId,
                                    collectionId: id,
                                    hash: data.hash,
                                    error: err,
                                };
                            } else {
                                console.log('Recorded assessment on blockchain: ');
                                console.log(result);
                                body = {
                                    certificateId: data.certificateId,
                                    collectionId: id,
                                    hash: data.hash,
                                    result: result,
                                };
                            }
                            // Trigger the result hook for this transaction
                            request
                                .post({
                                    url: apiUrl + '/api/assessment_results/sign-certificate',
                                    body: body,
                                    json: true,
                                }, (err, response, data) => {
                                    if (err) {
                                        console.error(err);
                                    } else if (data) {
                                        console.log('BLOCKCHAIN TRANSACTION IN PROGRESS...');
                                        console.log(data);
                                    } else {
                                        console.log('transaction Id not found');
                                        console.log(data);
                                    }
                                });
                        });
                    }
                });
            })
            .catch(err => {
                console.error(err);
            });
    };

    Collection.fetch = function(id, cb) {
        this.app.getCollectionContractInstance()
            .then(collectionContractInstance => {
                return collectionContractInstance.getData(id.replace(/-/g, ''));
            })
            .then(function(result) {
                console.log('Blockchain data for collection' + id + ' is: ' + result);
                cb(null, Collection.toAsciiResult(result));
            })
            .catch(err => {
                console.error(err);
                cb(err);
            });
    };

    Collection.fetchPeerHash = function(id, fk, cb) {
        this.app.getCollectionContractInstance()
            .then(collectionContractInstance => {
                return collectionContractInstance.getHashOf(id.replace(/-/g, ''), fk);
            })
            .then(function(result) {
                console.log('Got hash from blockchain: ' + result);
                cb(null, Collection.app.web3.utils.toAscii(result).split('\u0000')[0]);
            })
            .catch(err => {
                console.error(err);
                cb(err);
            });
    };

    Collection.fetchPeers = function(id, cb) {
        this.app.getCollectionContractInstance()
            .then(collectionContractInstance => {
                return collectionContractInstance.getParticipants(id.replace(/-/g, ''));
            })
            .then(function(result) {
                console.log('Got peers of collection: ' + result);
                cb(null, Collection.toAsciiResult(result));
            })
            .catch(err => {
                console.error(err);
                cb(err);
            });
    };

    Collection.fetchPeer = function(id, fk, cb) {
        this.app.getCollectionContractInstance()
            .then(collectionContractInstance => {
                return collectionContractInstance.getParticipant(id.replace(/-/g, ''), fk);
            })
            .then(function(result) {
                console.log('Got peer of collection: ' + result);
                cb(null, Collection.toAsciiResult(result));
            })
            .catch(err => {
                console.error(err);
                cb(err);
            });
    };

    Collection.fetchPeerResult = function(id, fk, cb) {
        this.app.getCollectionContractInstance()
            .then(collectionContractInstance => {
                return collectionContractInstance.getResultOf(id.replace(/-/g, ''), fk);
            })
            .then(function(result) {
                console.log('Got peers of collection: ' + result);
                cb(null, result);
            })
            .catch(err => {
                console.error(err);
                cb(err);
            });
    };

    Collection.dropPeer = function(id, fk, cb) {
        this.app.getCollectionContractInstance()
            .then(collectionContractInstance => {
                return collectionContractInstance.drop(id.replace(/-/g, ''), fk);
            })
            .then(function(result) {
                // index this transaction result and link it to its peer
                const transaction = {
                    result: JSON.stringify(result),
                };
                Collection.app.models.transactions.create(transaction, function(err, transactionInstance) {
                    if (err) {
                        cb(err);
                    } else {
                        transactionInstance.peer.add(fk, function(err, peerInstance) {
                            if (err) {
                                cb(err);
                            } else {
                                console.log('Removed peer from collection: ');
                                console.log(result);
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
    };

    Collection.remoteMethod(
        'fetch',
        {
            description: 'Get details of a collection by ID',
            accepts: [
                {arg: 'id', type: 'string', required: true},
            ],
            returns: {arg: 'result', type: ['object'], root: true},
            http: {verb: 'get', path: '/:id'},
        }
    );

    Collection.remoteMethod(
        'fetchPeers',
        {
            description: 'Get all participants of a collection',
            accepts: [
                {arg: 'id', type: 'string', required: true},
            ],
            returns: {arg: 'result', type: ['object'], root: true},
            http: {verb: 'get', path: '/:id/peers'},
        }
    );

    Collection.remoteMethod(
        'fetchPeer',
        {
            description: 'Get a particular participant of a collection',
            accepts: [
                {arg: 'id', type: 'string', required: true},
                {arg: 'fk', type: 'string', required: true},
            ],
            returns: {arg: 'result', type: ['object'], root: true},
            http: {verb: 'get', path: '/:id/peers/:fk'},
        }
    );

    Collection.remoteMethod(
        'fetchPeerResult',
        {
            description: 'Get result of a peer in this collection',
            accepts: [
                {arg: 'id', type: 'string', required: true},
                {arg: 'fk', type: 'string', required: true},
            ],
            returns: {arg: 'result', type: ['object'], root: true},
            http: {verb: 'get', path: '/:id/peers/:fk'},
        }
    );

    Collection.remoteMethod(
        'fetchPeerHash',
        {
            description: 'Get hash of a peer in this collection',
            accepts: [
                {arg: 'id', type: 'string', required: true},
                {arg: 'fk', type: 'string', required: true},
            ],
            returns: {arg: 'result', type: ['object'], root: true},
            http: {verb: 'get', path: '/:id/peers/:fk/hash'},
        }
    );

    Collection.remoteMethod(
        'create',
        {
            description: 'Create a new entry in collection smart contract',
            accepts: [
                {arg: 'data', type: 'object', http: {source: 'body'}, required: true},
            ],
            returns: {arg: 'result', type: 'object', root: true},
            http: {verb: 'post', path: '/'},
        }
    );

    Collection.remoteMethod(
        'join',
        {
            description: 'Add a peer as participant to a collection',
            accepts: [
                {arg: 'id', type: 'string', required: true, description: 'Unique ID of the collection recorded on blockchain'},
                {arg: 'fk', type: 'string', required: true, description: 'Ethereum address of the peer who is joining'},
                {arg: 'data', type: 'object', http: {source: 'body'}},
            ],
            returns: {arg: 'result', type: 'object', root: true},
            http: {verb: 'put', path: '/:id/peers/rel/:fk'},
        }
    );

    Collection.remoteMethod(
        'assess',
        {
            description: 'Make an assessment for a participant of a collection',
            accepts: [
                {arg: 'id', type: 'string', required: true, description: 'Unique ID of the collection recorded on blockchain'},
                {arg: 'fk', type: 'string', required: true, description: 'Ethereum address of the peer who is being assessed'},
                {arg: 'data', type: 'object', http: {source: 'body'}, required: true},
            ],
            returns: {arg: 'result', type: 'object', root: true},
            http: {verb: 'put', path: '/:id/peers/:fk'},
        }
    );

    Collection.remoteMethod(
        'dropPeer',
        {
            description: 'Remove a peer as participant from a collection',
            accepts: [
                {arg: 'id', type: 'string', required: true, description: 'Unique ID of the collection recorded on blockchain'},
                {arg: 'fk', type: 'string', required: true, description: 'Ethereum address of the peer to be dropped'},
            ],
            returns: {arg: 'result', type: 'object', root: true},
            http: {verb: 'delete', path: '/:id/peers/rel/:fk'},
        }
    );
};
