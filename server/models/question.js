'use strict';

module.exports = function(Question) {

    const globalFunctions = require('../globalFunctions')(Question);

    Question.create = function(data, cb) {
        this.app.getQuestionContractInstance(true)
            .then(questionContractInstance => {
                return questionContractInstance.create(data.uniqueId.replace(/-/g, ''), data.communityId.replace(/-/g, ''), data.peerAddress, data.scholarshipId.replace(/-/g, ''), data.hash, data.gyan, data.topics);
            })
            .then(function(result) {
                // index this transaction result and link it to its peer
                const transaction = {
                    result: JSON.stringify(result),
                };
                Question.app.models.transactions.create(transaction, function(err, transactionInstance) {
                    if (err) {
                        cb(err);
                    } else {
                        transactionInstance.peer.add(data.peerAddress, function(err, peerInstance) {
                            if (err) {
                                cb(err);
                            } else {
                                console.log('Add question to blockchain: ');
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

    Question.close = function(id, data, cb) {
        this.app.getQuestionContractInstance(true)
            .then(questionContractInstance => {
                return questionContractInstance.close(id.replace(/-/g, ''));
            })
            .then(function(result) {
                // index this transaction result and link it to its peer
                const transaction = {
                    result: JSON.stringify(result),
                };
                Question.app.models.transactions.create(transaction, function(err, transactionInstance) {
                    if (err) {
                        cb(err);
                    } else {
                        transactionInstance.peer.add(data.peerAddress, function(err, peerInstance) {
                            if (err) {
                                cb(err);
                            } else {
                                console.log('Closed question on blockchain: ');
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

    Question.addAnswer = function(id, fk, data, cb) {
        this.app.getQuestionContractInstance(true)
            .then(questionContractInstance => {
                return questionContractInstance.addAnswer(fk.replace(/-/g, ''), id.replace(/-/g, ''), data.peerAddress, data.hash);
            })
            .then(function(result) {
                // index this transaction result and link it to its peer
                const transaction = {
                    result: JSON.stringify(result),
                };
                Question.app.models.transactions.create(transaction, function(err, transactionInstance) {
                    if (err) {
                        cb(err);
                    } else {
                        transactionInstance.peer.add(data.peerAddress, function(err, peerInstance) {
                            if (err) {
                                cb(err);
                            } else {
                                console.log('Add answer to blockchain: ');
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

    Question.acceptAnswer = function(id, fk, data, cb) {
        this.app.getQuestionContractInstance(true)
            .then(questionContractInstance => {
                return questionContractInstance.acceptAnswer(fk.replace(/-/g, ''), id.replace(/-/g, ''));
            })
            .then(function(result) {
                // index this transaction result and link it to its peer
                const transaction = {
                    result: JSON.stringify(result),
                };
                Question.app.models.transactions.create(transaction, function(err, transactionInstance) {
                    if (err) {
                        cb(err);
                    } else {
                        transactionInstance.peer.add(data.peerAddress, function(err, peerInstance) {
                            if (err) {
                                cb(err);
                            } else {
                                console.log('Accepted an answer on blockchain: ');
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

    Question.addFlag = function(id, fk, data, cb) {
        this.app.getQuestionContractInstance(true)
            .then(questionContractInstance => {
                return questionContractInstance.flagAnswer(fk.replace(/-/g, ''), id.replace(/-/g, ''));
            })
            .then(function(result) {
                // index this transaction result and link it to its peer
                const transaction = {
                    result: JSON.stringify(result),
                };
                Question.app.models.transactions.create(transaction, function(err, transactionInstance) {
                    if (err) {
                        cb(err);
                    } else {
                        transactionInstance.peer.add(data.peerAddress, function(err, peerInstance) {
                            if (err) {
                                cb(err);
                            } else {
                                console.log('Flagged an answer on blockchain: ');
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

    Question.removeFlag = function(id, fk, data, cb) {
        this.app.getQuestionContractInstance(true)
            .then(questionContractInstance => {
                return questionContractInstance.unFlagAnswer(fk.replace(/-/g, ''), id.replace(/-/g, ''));
            })
            .then(function(result) {
                // index this transaction result and link it to its peer
                const transaction = {
                    result: JSON.stringify(result),
                };
                Question.app.models.transactions.create(transaction, function(err, transactionInstance) {
                    if (err) {
                        cb(err);
                    } else {
                        transactionInstance.peer.add(data.peerAddress, function(err, peerInstance) {
                            if (err) {
                                cb(err);
                            } else {
                                console.log('Unflagged an answer on blockchain: ');
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

    Question.remoteMethod(
        'create',
        {
            description: 'Create a new entry in question smart contract',
            accepts: [
                {arg: 'data', type: 'object', http: {source: 'body'}, required: true},
            ],
            returns: {arg: 'result', type: 'object', root: true},
            http: {verb: 'post', path: '/'},
        }
    );

    Question.remoteMethod(
        'addAnswer',
        {
            description: 'Add an answer to this question',
            accepts: [
                {arg: 'id', type: 'string', required: true, description: 'Unique ID of the question recorded on blockchain'},
                {arg: 'fk', type: 'string', required: true, description: 'Unique ID of the answer to be recorded'},
                {arg: 'data', type: 'object', http: {source: 'body'}},
            ],
            returns: {arg: 'result', type: 'object', root: true},
            http: {verb: 'put', path: '/:id/answers/rel/:fk'},
        }
    );

    Question.remoteMethod(
        'addFlag',
        {
            description: 'Add a flag to this answer',
            accepts: [
                {arg: 'id', type: 'string', required: true, description: 'Unique ID of the question recorded on blockchain'},
                {arg: 'fk', type: 'string', required: true, description: 'Unique ID of the answer to be flagged'},
                {arg: 'data', type: 'object', http: {source: 'body'}},
            ],
            returns: {arg: 'result', type: 'object', root: true},
            http: {verb: 'post', path: '/:id/answers/:fk/flag'},
        }
    );

    Question.remoteMethod(
        'removeFlag',
        {
            description: 'Remove a flag to this question',
            accepts: [
                {arg: 'id', type: 'string', required: true, description: 'Unique ID of the question recorded on blockchain'},
                {arg: 'fk', type: 'string', required: true, description: 'Unique ID of the answer to be unflagged'},
                {arg: 'data', type: 'object', http: {source: 'body'}},
            ],
            returns: {arg: 'result', type: 'object', root: true},
            http: {verb: 'post', path: '/:id/answers/:fk/unflag'},
        }
    );

    Question.remoteMethod(
        'acceptAnswer',
        {
            description: 'Accept an answer to this question',
            accepts: [
                {arg: 'id', type: 'string', required: true, description: 'Unique ID of the question recorded on blockchain'},
                {arg: 'fk', type: 'string', required: true, description: 'Unique ID of the answer to be recorded'},
                {arg: 'data', type: 'object', http: {source: 'body'}},
            ],
            returns: {arg: 'result', type: 'object', root: true},
            http: {verb: 'put', path: '/:id/answers/:fk'},
        }
    );

    Question.remoteMethod(
        'close',
        {
            description: 'Close a question on the blockchain',
            accepts: [
                {arg: 'id', type: 'string', required: true, description: 'Unique ID of the question recorded on blockchain'},
                {arg: 'data', type: 'object', http: {source: 'body'}},
            ],
            returns: {arg: 'result', type: 'object', root: true},
            http: {verb: 'post', path: '/:id/close'},
        }
    );
};

