'use strict';

module.exports = function(Karma) {
    Karma.getBalance = function(id, cb) {
        this.app.getKarmaContractInstance()
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
        this.app.getKarmaContractInstance()
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
};
