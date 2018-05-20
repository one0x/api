'use strict';

module.exports = function(Peer) {
    Peer.create = function(data, cb) {
        Peer.app.web3.eth.personal.newAccount(data.password)
            .then(result => {
                console.log(result);
                cb(null, result);
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
};
