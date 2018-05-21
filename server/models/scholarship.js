'use strict';

module.exports = function(Scholarship) {
    const globalFunctions = require('../globalFunctions')(Scholarship);

    Scholarship.create = function(data, cb) {
        this.app.getScholarshipContractInstance()
            .then(schContractInst => {
                return schContractInst.create(data.uniqueId.replace(/-/g, ''), data.ownerAddress, data.type, data.title, data.description, data.preRequisite, data.transactionLimit, data.walletAddress, data.allowedCollections);
            })
            .then(function(result) {
                console.log('Add scholarship to blockchain:');
                console.log(result);
                cb(null, result);
            })
            .catch(err => {
                console.error(err);
                cb(err);
            });
    };

    Scholarship.join = function(id, fk, data, cb) {
        this.app.getScholarshipContractInstance()
            .then(schContractInst => {
                return schContractInst.join(id.replace(/-/g, ''), fk);
            })
            .then(function(result) {
                console.log('Recorded scholarship participation on blockchain ');
                console.log(result);
                cb(null, result);
            })
            .catch(err => {
                console.error(err);
                cb(err);
            });
    };

    Scholarship.fetch = function(id, cb) {
        this.app.getScholarshipContractInstance()
            .then(schContractInst => {
                return schContractInst.getScholarshipData(id.replace(/-/g, ''));
            })
            .then(function(result) {
                console.log('Got scholarship from blockchain: ');
                console.log(result);
                cb(null, Scholarship.toAsciiResult(result));
            })
            .catch(err => {
                console.error(err);
                cb(err);
            });
    };

    Scholarship.fetchPeer = function(id, fk, cb) {
        this.app.getScholarshipContractInstance()
            .then(schContractInst => {
                return schContractInst.getParticipant(id.replace(/-/g, ''), fk);
            })
            .then(function(result) {
                console.log('Got peer of scholarship: ');
                console.log(result);
                cb(null, Scholarship.toAsciiResult(result));
            })
            .catch(err => {
                console.error(err);
                cb(err);
            });
    };

    Scholarship.fetchCollection = function(id, fk, cb) {
        this.app.getScholarshipContractInstance()
            .then(schContractInst => {
                return schContractInst.getAllowedCollection(id.replace(/-/g, ''), fk);
            })
            .then(function(result) {
                console.log('Got allowed collection of scholarship: ');
                console.log(result);
                cb(null, result);
            })
            .catch(err => {
                console.error(err);
                cb(err);
            });
    };

    Scholarship.addCollection = function(id, fk, data, cb) {
        this.app.getScholarshipContractInstance()
            .then(schContractInst => {
                return schContractInst.addCollection(id.replace(/-/g, ''), fk);
            })
            .then(function(result) {
                console.log('Added allowed collection to scholarship: ');
                console.log(result);
                cb(null, result);
            })
            .catch(err => {
                console.error(err);
                cb(err);
            });
    };

    Scholarship.fetchBalance = function(id, cb) {
        this.app.getScholarshipContractInstance()
            .then(schContractInst => {
                return schContractInst.balanceOf(id.replace(/-/g, ''));
            })
            .then(function(result) {
                console.log('Got Karma balance of scholarship: ');
                console.log(result);
                cb(null, Scholarship.app.web3.utils.toDecimal(result));
            })
            .catch(err => {
                console.error(err);
                cb(err);
            });
    };

    Scholarship.dropPeer = function(id, fk, cb) {
        this.app.getScholarshipContractInstance()
            .then(schContractInst => {
                return schContractInst.drop(id.replace(/-/g, ''), fk);
            })
            .then(function(result) {
                console.log('Dropped peer from scholarship: ');
                console.log(result);
                cb(null, result);
            })
            .catch(err => {
                console.error(err);
                cb(err);
            });
    };

    Scholarship.remoteMethod(
        'fetch',
        {
            description: 'Get details of a scholarship by ID',
            accepts: [
                {arg: 'id', type: 'string', required: true},
            ],
            returns: {arg: 'result', type: ['object'], root: true},
            http: {verb: 'get', path: '/:id'},
        }
    );

    Scholarship.remoteMethod(
        'fetchPeer',
        {
            description: 'Get participant of a scholarship',
            accepts: [
                {arg: 'id', type: 'string', required: true},
                {arg: 'fk', type: 'string', required: true},
            ],
            returns: {arg: 'result', type: ['object'], root: true},
            http: {verb: 'get', path: '/:id/peers/:fk'},
        }
    );

    Scholarship.remoteMethod(
        'create',
        {
            description: 'Create a new entry in scholarship smart contract',
            accepts: [
                {arg: 'data', type: 'object', http: {source: 'body'}, required: true},
            ],
            returns: {arg: 'result', type: 'object', root: true},
            http: {verb: 'post', path: '/'},
        }
    );

    Scholarship.remoteMethod(
        'join',
        {
            description: 'Add a peer as participant to a scholarship',
            accepts: [
                {arg: 'id', type: 'string', required: true, description: 'Unique ID of the scholarship recorded on blockchain'},
                {arg: 'fk', type: 'string', required: true, description: 'Ethereum address of the peer who is joining'},
                {arg: 'data', type: 'object', http: {source: 'body'}},
            ],
            returns: {arg: 'result', type: 'object', root: true},
            http: {verb: 'put', path: '/:id/peers/rel/:fk'},
        }
    );

    Scholarship.remoteMethod(
        'addCollection',
        {
            description: 'Add an allowed Collection to a scholarship',
            accepts: [
                {arg: 'id', type: 'string', required: true, description: 'Unique ID of the scholarship recorded on blockchain'},
                {arg: 'fk', type: 'string', required: true, description: 'Unique ID of the collection to be added'},
                {arg: 'data', type: 'object', http: {source: 'body'}},
            ],
            returns: {arg: 'result', type: 'object', root: true},
            http: {verb: 'put', path: '/:id/collections/rel/:fk'},
        }
    );

    Scholarship.remoteMethod(
        'fetchCollection',
        {
            description: 'Get details of an allowed collection within a scholarship',
            accepts: [
                {arg: 'id', type: 'string', required: true, description: 'Unique ID of the scholarship recorded on blockchain'},
                {arg: 'fk', type: 'string', required: true, description: 'Unique ID of the collection'},
            ],
            returns: {arg: 'result', type: 'object', root: true},
            http: {verb: 'get', path: '/:id/collections/:fk'},
        }
    );

    Scholarship.remoteMethod(
        'fetchBalance',
        {
            description: 'Get Karma balance of a scholarship',
            accepts: [
                {arg: 'id', type: 'string', required: true, description: 'Unique ID of the scholarship recorded on blockchain'},
            ],
            returns: {arg: 'result', type: 'object', root: true},
            http: {verb: 'get', path: '/:id/karma'},
        }
    );

    Scholarship.remoteMethod(
        'dropPeer',
        {
            description: 'Remove a peer from a scholarship',
            accepts: [
                {arg: 'id', type: 'string', required: true, description: 'Unique ID of the scholarship recorded on blockchain'},
                {arg: 'fk', type: 'string', required: true, description: 'Ethereum address of the peer to be dropped'},
            ],
            returns: {arg: 'result', type: 'object', root: true},
            http: {verb: 'delete', path: '/:id/peers/rel/:fk'},
        }
    );
};
