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
