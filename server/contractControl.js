'use strict';
let web3 = require('web3');
let contract = require('truffle-contract');
let net = require('net');
let loopback = require('loopback');
let path = require('path');

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

    function unlockSpecificAndReturn(unlockAccount, accountPassword) {
        return new Promise(function(resolve, reject) {
            // Karma Contract with a different from address
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
            KarmaContract.defaults({from: unlockAccount, gas: 4500000, gasPrice: 5500000000});
            KarmaContract.deployed()
                .then(function(instance) {
                    console.log('got contract instance of karma with FROM address set to Advisory pool');
                    console.log('Unlocking account: ' + unlockAccount);
                    web3.eth.personal.unlockAccount(unlockAccount, accountPassword)
                        .then(res => {
                            console.log(res);
                            resolve(instance);
                        })
                        .catch(err => {
                            console.error(err);
                            reject(err);
                        });
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
        CollectionContract.defaults({from: app.get('blockProducerAddress'), gas: 4500000, gasPrice: 5500000000});
        CollectionContract.deployed()
            .then(function(instance) {
                console.log('got contract instance of collection');
                collectionContractInstance = instance;
                watchAllEvents(collectionContractInstance);
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
        KarmaContract.defaults({from: app.get('blockProducerAddress'), gas: 4500000, gasPrice: 5500000000});
        KarmaContract.deployed()
            .then(function(instance) {
                console.log('got contract instance of karma');
                karmaContractInstance = instance;
                watchAllEvents(karmaContractInstance);
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
        GyanContract.defaults({from: app.get('blockProducerAddress'), gas: 4500000, gasPrice: 5500000000});
        GyanContract.deployed()
            .then(function(instance) {
                console.log('got contract instance of gyan');
                gyanContractInstance = instance;
                watchAllEvents(gyanContractInstance);
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
        ScholarshipContract.defaults({from: app.get('blockProducerAddress'), gas: 4500000, gasPrice: 5500000000});
        ScholarshipContract.deployed()
            .then(function(instance) {
                console.log('got contract instance of scholarship');
                scholarshipContractInstance = instance;
                watchAllEvents(scholarshipContractInstance);
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
        QuestionContract.defaults({from: app.get('blockProducerAddress'), gas: 4500000, gasPrice: 5500000000});
        QuestionContract.deployed()
            .then(function(instance) {
                console.log('got contract instance of question');
                questionContractInstance = instance;
                watchAllEvents(questionContractInstance);
                return instance;
            })
            .catch(err => {
                console.error(err);
            });
    }

    app.getCollectionContractInstance = function(unlock) {
        if (unlock) {
            return unlockAndReturn(collectionContractInstance);
        } else {
            return new Promise(function(resolve, reject) {
                resolve(collectionContractInstance);
            });
        }
    };

    app.getKarmaContractInstance = function(unlock) {
        if (unlock) {
            return unlockAndReturn(karmaContractInstance);
        } else {
            return new Promise(function(resolve, reject) {
                resolve(karmaContractInstance);
            });
        }
    };

    app.getKarmaContractInstanceFor = function(unlockAccount, accountPassword) {
        return unlockSpecificAndReturn(unlockAccount, accountPassword);
    };

    app.getGyanContractInstance = function(unlock) {
        if (unlock) {
            return unlockAndReturn(gyanContractInstance);
        } else {
            return new Promise(function(resolve, reject) {
                resolve(gyanContractInstance);
            });
        }
    };

    app.getScholarshipContractInstance = function(unlock) {
        if (unlock) {
            return unlockAndReturn(scholarshipContractInstance);
        } else {
            return new Promise(function(resolve, reject) {
                resolve(scholarshipContractInstance);
            });
        }
    };

    app.getQuestionContractInstance = function(unlock) {
        if (unlock) {
            return unlockAndReturn(questionContractInstance);
        } else {
            return new Promise(function(resolve, reject) {
                resolve(questionContractInstance);
            });
        }
    };

    function watchAllEvents(contractInstance) {
        // Subscribe to all events of given contract
        contractInstance.allEvents().watch((err, result) => {
            let event;
            if (!err) {
                console.log('Captured event ' + result.event + ': ');
                console.log(result.args);
                event = {
                    name: result.event,
                    status: 'success',
                    result: JSON.stringify(result.args),
                    transactionHash: result.transactionHash,
                    transactionIndex: result.transactionIndex,
                    logIndex: result.logIndex,
                    blockNumber: result.blockNumber,
                };
            } else {
                event = {
                    name: err.event,
                    status: 'error',
                    error: JSON.stringify(err),
                };
            }
            // Save the event in local DB and link it to peer nodes
            app.models.event.create(event)
                .then(eventInstance => {
                    console.log('Created event node in DB');
                    if (result.args.partyA && result.args.partyA !== '0x0000000000000000000000000000000000000000') {
                        eventInstance.peer.add(result.args.partyA.toLowerCase());
                    }
                    if (result.args.partyB && result.args.partyB !== '0x0000000000000000000000000000000000000000') {
                        eventInstance.peer.add(result.args.partyB.toLowerCase());
                    }
                })
                .catch(err => {
                    console.error('Error logging event in DB');
                });

            // Send email to both users about new balance if event is : KarmaTransfer
            if (result.event === 'KarmaTransfer') {
                // Send DEBIT email to sender
                const transactionTypeDr = 'debit';
                const transactionSymbolDr = '-';
                const transactionAmountDr = result.args.amount;
                const transactorAddressDr = result.args.to.toLowerCase();
                const userEthAddressDr = result.args.from.toLowerCase();
                let transactorNameDr, karmaBalanceDr, userNameDr;
                app.models.protocol_peer.findById(transactorAddressDr)
                    .then(transactorInstance => {
                        transactorNameDr = transactorInstance.fName + ' ' + transactorInstance.lName;
                        return app.models.protocol_peer.findById(userEthAddressDr);
                    })
                    .then(userInstance => {
                        karmaBalanceDr = userInstance.karmaBalance - parseInt(transactionAmountDr, 10);
                        userNameDr = userInstance.fName + ' ' + userInstance.lName;
                        // Update karma balance in DB
                        userInstance.updateAttribute('karmaBalance', karmaBalanceDr)
                            .then(res => {
                                console.log('Karma balance updated in DB');
                                let emailData = {
                                    transactorName: transactorNameDr,
                                    userName: userNameDr,
                                    transactionType: transactionTypeDr,
                                    transactionSymbol: transactionSymbolDr,
                                    transactionAmount: transactionAmountDr,
                                    karmaBalance: karmaBalanceDr,
                                    transactionHash: result.transactionHash,
                                };
                                let renderer = loopback.template(path.resolve(__dirname, 'views/karmaTransfer.ejs'));
                                let htmlBody = renderer(emailData);
                                loopback.Email.send({
                                    to: userInstance.email,
                                    from: 'one0x <noreply@mx.one0x.com>',
                                    subject: 'Karma Wallet Update',
                                    html: htmlBody,
                                })
                                    .then(function(response) {
                                        console.log('email sent! - ' + response);
                                    })
                                    .catch(function(err) {
                                        console.log('email error! - ' + err);
                                    });
                            })
                            .catch(err => {
                                console.error('Failed to update karma balance');
                            });
                    })
                    .catch(err => {
                        console.error('In DEBIT transaction, partyB not found or is a Karma Burn case');
                    });

                // Send CREDIT email to receiver
                const transactionTypeCr = 'credit';
                const transactionSymbolCr = '+';
                const transactionAmountCr = result.args.amount;
                const transactorAddressCr = result.args.from.toLowerCase();
                const userEthAddressCr = result.args.to.toLowerCase();
                let transactorNameCr, karmaBalanceCr, userNameCr;
                app.models.protocol_peer.findById(transactorAddressCr)
                    .then(transactorInstance => {
                        transactorNameCr = transactorInstance.fName + ' ' + transactorInstance.lName;
                        return app.models.protocol_peer.findById(userEthAddressCr);
                    })
                    .then(userInstance => {
                        karmaBalanceCr = userInstance.karmaBalance + parseInt(transactionAmountCr, 10);
                        userNameCr = userInstance.fName + ' ' + userInstance.lName;
                        // Update karma balance in DB
                        userInstance.updateAttribute('karmaBalance', karmaBalanceCr)
                            .then(res => {
                                console.log('Karma balance updated in DB');
                                let emailData = {
                                    transactorName: transactorNameCr,
                                    userName: userNameCr,
                                    transactionType: transactionTypeCr,
                                    transactionSymbol: transactionSymbolCr,
                                    transactionAmount: transactionAmountCr,
                                    karmaBalance: karmaBalanceCr,
                                    transactionHash: result.transactionHash,
                                };
                                let renderer = loopback.template(path.resolve(__dirname, 'views/karmaTransfer.ejs'));
                                let htmlBody = renderer(emailData);
                                loopback.Email.send({
                                    to: userInstance.email,
                                    from: 'one0x <noreply@mx.one0x.com>',
                                    subject: 'Karma Wallet Update',
                                    html: htmlBody,
                                })
                                    .then(function(response) {
                                        console.log('email sent! - ' + response);
                                    })
                                    .catch(function(err) {
                                        console.log('email error! - ' + err);
                                    });
                            })
                            .catch(err => {
                                console.error('Failed to update karma balance');
                            });
                    })
                    .catch(err => {
                        console.error('In CREDIT transaction, partyA not found or is a Karma Mint case');
                    });
            }
        });
    }
};
