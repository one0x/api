'use strict';

module.exports = function(Gyan) {
    Gyan.getFloatingBalance = function(id, cb) {
        this.app.getGyanContractInstance()
            .then(gyanContractInstance => {
                return gyanContractInstance.floatingBalanceOf(id);
            })
            .then(function(result) {
                console.log('Got floating gyan balance: ' + result);
                cb(null, Gyan.app.web3.utils.toDecimal(result));
            })
            .catch(err => {
                console.error(err);
                cb(err);
            });
    };

    Gyan.getFixedBalance = function(id, cb) {
        this.app.getGyanContractInstance()
            .then(gyanContractInstance => {
                return gyanContractInstance.fixedBalanceOf(id);
            })
            .then(function(result) {
                console.log('Got fixed gyan balance: ' + result);
                cb(null, Gyan.app.web3.utils.toDecimal(result));
            })
            .catch(err => {
                console.error(err);
                cb(err);
            });
    };

    Gyan.karmaToBurn = function(amount, cb) {
        this.app.getCollectionContractInstance()
            .then(collectionContractInstance => {
                return collectionContractInstance.getKarmaToBurn(amount);
            })
            .then(function(result) {
                console.log('Got amount of Karma to burn: ' + result);
                cb(null, Gyan.app.web3.utils.toDecimal(result));
            })
            .catch(err => {
                console.error(err);
                cb(err);
            });
    };

    Gyan.getYesterdayMint = function(cb) {
        this.app.getGyanContractInstance()
            .then(gyanContractInstance => {
                return gyanContractInstance.yesterdayMint();
            })
            .then(function(result) {
                console.log('Got earn rate of gyan: ' + result);
                cb(null, Gyan.app.web3.utils.toDecimal(result));
            })
            .catch(err => {
                console.error(err);
                cb(err);
            });
    };

    Gyan.getTotalSupply = function(cb) {
        this.app.getGyanContractInstance()
            .then(gyanContractInstance => {
                return gyanContractInstance.totalSupply();
            })
            .then(function(result) {
                console.log('Got gyan supply: ' + result);
                cb(null, Gyan.app.web3.utils.toDecimal(result));
            })
            .catch(err => {
                console.error(err);
                cb(err);
            });
    };

    Gyan.remoteMethod(
        'karmaToBurn',
        {
            description: 'Get the Karma to burn for the amount of Gyan',
            accepts: [
                {arg: 'amount', type: 'number', required: true, description: 'Amount of Gyan'},
            ],
            returns: {arg: 'result', type: 'object', root: true},
            http: {verb: 'get', path: '/:amount/karma'},
        }
    );

    Gyan.remoteMethod(
        'getFloatingBalance',
        {
            description: 'Get Floating Gyan balance of a peer',
            accepts: [
                {arg: 'id', type: 'string', required: true, description: 'Ethereum address of the peer'},
            ],
            returns: {arg: 'result', type: ['object'], root: true},
            http: {verb: 'get', path: '/:id/floating'},
        }
    );

    Gyan.remoteMethod(
        'getFixedBalance',
        {
            description: 'Get Fixed Gyan balance of a peer',
            accepts: [
                {arg: 'id', type: 'string', required: true, description: 'Ethereum address of the peer'},
            ],
            returns: {arg: 'result', type: ['object'], root: true},
            http: {verb: 'get', path: '/:id/fixed'},
        }
    );

    Gyan.remoteMethod(
        'getYesterdayMint',
        {
            description: 'Get the amount of Gyan minted in last 24 hours. Gives the estimation of rate at which Gyan is being earned by peers.',
            returns: {arg: 'result', type: ['object'], root: true},
            http: {verb: 'get', path: '/earnRate'},
        }
    );

    Gyan.remoteMethod(
        'getTotalSupply',
        {
            description: 'Get total Gyan supply',
            returns: {arg: 'result', type: ['object'], root: true},
            http: {verb: 'get', path: '/'},
        }
    );
};
