/**
 * Created by john on 3/30/17.
 */
/**
 * Created by john on 3/28/17.
 */
let mongoose = require('mongoose');

// User Schema
let configSchema = mongoose.Schema({
    compte: {
        type: Number,
        index: true,
        unique: true
    },
    maxNbAttempts: {
        type: Number,
        default: 3
    },
    nbFailsPerAttempt: {
        type: Number,
        default: 2
    },
    allowPasswordReset: {
        type: Boolean,
        default: true
    },
    passwordComplexity: {
        requireOneNumber: {
            type: Boolean,
            default: false
        },
        requireOneSymbol: {
            type: Boolean,
            default: false
        }
    },
    password_history_length: {
        type: Number,
        default: 3
    }
});

let config = module.exports = mongoose.model('config', configSchema);

module.exports.addconfig = function (newconfig, callback) {
    newconfig.save(callback);
};

module.exports.getconfig = function (callback) {
    let query = {compte: 1};
    config.findOne(query, callback);
};

module.exports.changeConfig = function (config, callback) {
    config.save(callback);
};

