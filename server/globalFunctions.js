'use strict';
exports = module.exports = function(model) {
    model.toAsciiResult = function(array) {
        const outputArray = [];
        if (array.constructor === Array) {
            for (let i = 0; i < array.length; i++) {
                if (typeof array[i] === 'string' && array[i].length > 42) {
                    console.log(array[i]);
                    outputArray.push(model.app.web3.utils.toAscii(array[i]).split('\u0000')[0]);
                } else if (typeof array[i] === 'object' && array[i].constructor === Array) {
                    const secondLevelArray = [];
                    for (let j = 0; j < array[i].length; j++) {
                        secondLevelArray.push(model.app.web3.utils.toAscii(array[i][j]).split('\u0000')[0]);
                    }
                    outputArray.push(secondLevelArray);
                } else {
                    outputArray.push(array[i]);
                }
            }
            return outputArray;
        } else {
            return 'Response is not an array';
        }
    };
};
