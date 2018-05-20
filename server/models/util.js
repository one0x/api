'use strict';
const uuid = require('uuid');

module.exports = function(Util) {
    Util.getId = function(cb) {
        cb(null, uuid.v4());
    };

    Util.remoteMethod(
        'getId',
        {
            description: 'Get a unique ID for any node to be saved on the blockchain',
            returns: {arg: 'result', type: 'object', root: true},
            http: {verb: 'get', path: '/uniqueId'},
        }
    );
};
