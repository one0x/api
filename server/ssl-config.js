/* eslint-disable max-len */
'use strict';
let path = require('path');
let fs = require('fs');

exports.privateKey = fs.readFileSync(path.join(__dirname, './private/custom.key')).toString();
exports.certificate = fs.readFileSync(path.join(__dirname, './private/pb-cert.crt')).toString();
