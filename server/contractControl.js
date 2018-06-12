'use strict';
var web3 = require('web3');
var contract = require('truffle-contract');
var net = require('net');

exports = module.exports = function(app) {
    if (process.env.NODE_ENV === 'development') {
        web3 = new web3(new web3.providers.HttpProvider('http://127.0.0.1:7545'));
    } else {
        web3 = new web3(new web3.providers.IpcProvider('/geth/geth.ipc', net));
    }

    app.web3 = web3;

    let collectionContractInstance, karmaContractInstance, gyanContractInstance, scholarshipContractInstance, questionContractInstance;

    loadContracts();

    function unlockAccount() {
        console.log('Unlocking account: ' + app.get('blockProducerAddress'));
        web3.eth.personal.unlockAccount(app.get('blockProducerAddress'), app.get('blockProducerPassword'))
            .then(res => {
                console.log(res);
            })
            .catch(err => {
                console.error(err);
            });
    }

    function unlockAndReturn(cb) {
        return new Promise(function(resolve, reject) {
            console.log('Unlocking account: ' + app.get('blockProducerAddress'));
            web3.eth.personal.unlockAccount(app.get('blockProducerAddress'), app.get('blockProducerPassword'))
                .then(res => {
                    console.log(res);
                    resolve(cb);
                })
                .catch(err => {
                    console.error(err);
                    reject(err);
                });
        });
    }

    function loadContracts() {
        unlockAccount();
        // Collection Contract
        const CollectionContractArtifact = require('./contracts/CollectionContract.json');
        const CollectionContract = contract(CollectionContractArtifact);
        CollectionContract.setProvider(web3.currentProvider);
        if (typeof CollectionContract.currentProvider.sendAsync !== 'function') {
            CollectionContract.currentProvider.sendAsync = function() {
                return CollectionContract.currentProvider.send.apply(
                    CollectionContract.currentProvider, arguments
                );
            };
        }
        CollectionContract.defaults({from: app.get('blockProducerAddress'), gas: 3000000});
        CollectionContract.deployed()
            .then(function(instance) {
                console.log('got contract instance of collection');
                collectionContractInstance = instance;
                return instance;
            })
            .catch(err => {
                console.error(err);
            });

        // Karma Contract
        const KarmaContractArtifact = require('./contracts/KarmaCoin.json');
        const KarmaContract = contract(KarmaContractArtifact);
        KarmaContract.setProvider(web3.currentProvider);
        if (typeof KarmaContract.currentProvider.sendAsync !== 'function') {
            KarmaContract.currentProvider.sendAsync = function() {
                return KarmaContract.currentProvider.send.apply(
                    KarmaContract.currentProvider, arguments
                );
            };
        }
        KarmaContract.defaults({from: app.get('blockProducerAddress'), gas: 3000000});
        KarmaContract.deployed()
            .then(function(instance) {
                console.log('got contract instance of karma');
                karmaContractInstance = instance;
                return instance;
            })
            .catch(err => {
                console.error(err);
            });

        // Gyan Contract
        const GyanContractArtifact = require('./contracts/GyanCoin.json');
        const GyanContract = contract(GyanContractArtifact);
        GyanContract.setProvider(web3.currentProvider);
        if (typeof GyanContract.currentProvider.sendAsync !== 'function') {
            GyanContract.currentProvider.sendAsync = function() {
                return GyanContract.currentProvider.send.apply(
                    GyanContract.currentProvider, arguments
                );
            };
        }
        GyanContract.defaults({from: app.get('blockProducerAddress'), gas: 3000000});
        GyanContract.deployed()
            .then(function(instance) {
                console.log('got contract instance of gyan');
                gyanContractInstance = instance;
                return instance;
            })
            .catch(err => {
                console.error(err);
            });

        // Scholarship Contract
        const ScholarshipContractArtifact = require('./contracts/ScholarshipContract.json');
        const ScholarshipContract = contract(ScholarshipContractArtifact);
        ScholarshipContract.setProvider(web3.currentProvider);
        if (typeof ScholarshipContract.currentProvider.sendAsync !== 'function') {
            ScholarshipContract.currentProvider.sendAsync = function() {
                return ScholarshipContract.currentProvider.send.apply(
                    ScholarshipContract.currentProvider, arguments
                );
            };
        }
        ScholarshipContract.defaults({from: app.get('blockProducerAddress'), gas: 3000000});
        ScholarshipContract.deployed()
            .then(function(instance) {
                console.log('got contract instance of scholarship');
                scholarshipContractInstance = instance;
                return instance;
            })
            .catch(err => {
                console.error(err);
            });

        // Question Contract
        const QuestionContractArtifact = require('./contracts/QuestionContract.json');
        const QuestionContract = contract(QuestionContractArtifact);
        QuestionContract.setProvider(web3.currentProvider);
        if (typeof QuestionContract.currentProvider.sendAsync !== 'function') {
            QuestionContract.currentProvider.sendAsync = function() {
                return QuestionContract.currentProvider.send.apply(
                    QuestionContract.currentProvider, arguments
                );
            };
        }
        QuestionContract.defaults({from: app.get('blockProducerAddress'), gas: 3000000});
        QuestionContract.deployed()
            .then(function(instance) {
                console.log('got contract instance of question');
                questionContractInstance = instance;
                return instance;
            })
            .catch(err => {
                console.error(err);
            });
    }

    app.getCollectionContractInstance = function() {
        return unlockAndReturn(collectionContractInstance);
    };

    app.getKarmaContractInstance = function() {
        return unlockAndReturn(karmaContractInstance);
    };

    app.getGyanContractInstance = function() {
        return unlockAndReturn(gyanContractInstance);
    };

    app.getScholarshipContractInstance = function() {
        return unlockAndReturn(scholarshipContractInstance);
    };

    app.getQuestionContractInstance = function() {
        return unlockAndReturn(questionContractInstance);
    };
};
