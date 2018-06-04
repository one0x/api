'use strict';

module.exports = function(Gyan) {
    Gyan.getBalance = function(id, cb) {
        this.app.getGyanContractInstance()
            .then(gyanContractInstance => {
                return gyanContractInstance.balanceOf(id);
            })
            .then(function(result) {
                console.log('Got gyan balance: ' + result);
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
        'getBalance',
        {
            description: 'Get Gyan balance of a peer',
            accepts: [
                {arg: 'id', type: 'string', required: true, description: 'Ethereum address of the peer'},
            ],
            returns: {arg: 'result', type: ['object'], root: true},
            http: {verb: 'get', path: '/:id'},
        }
    );
};
