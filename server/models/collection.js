'use strict';

module.exports = function(Collection) {
    const globalFunctions = require('../globalFunctions')(Collection);

    Collection.create = function(data, cb) {
        this.app.getCollectionContractInstance()
            .then(collectionContractInstance => {
                return collectionContractInstance.create(data.uniqueId.replace(/-/g, ''), data.teacherAddress, data.type, data.activityHash, data.academicGyan, data.nonAcademicGyan, data.assessmentRuleKeys, data.assessmentRuleValues, data.topics);
            })
            .then(function(result) {
                console.log('Add collection to blockchain: ' + result);
                cb(null, result);
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
                console.log('Recorded participation on blockchain ' + result);
                cb(null, result);
            })
            .catch(err => {
                console.error(err);
                cb(err);
            });
    };

    Collection.assess = function(id, fk, data, cb) {
        this.app.getCollectionContractInstance()
            .then(collectionContractInstance => {
                return collectionContractInstance.assess(id.replace(/-/g, ''), fk, data.assessmentResult);
            })
            .then(function(result) {
                console.log('Recorded assessment on blockchain: ' + result);
                cb(null, result);
            })
            .catch(err => {
                console.error(err);
                cb(err);
            });
    };

    Collection.fetch = function(id, cb) {
        this.app.getCollectionContractInstance()
            .then(collectionContractInstance => {
                return collectionContractInstance.getData(id.replace(/-/g, ''));
            })
            .then(function(result) {
                console.log('Got collection from blockchain: ' + result);
                cb(null, Collection.toAsciiResult(result));
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
                console.log('Removed peer from collection: ' + result);
                cb(null, result);
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
