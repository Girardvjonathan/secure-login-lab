/**
 * Created by john on 3/30/17.
 */
/**
 * Created by john on 3/28/17.
 */
var mongoose = require('mongoose');

// User Schema
var configSchema = mongoose.Schema({
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
});

var config = module.exports = mongoose.model('config', configSchema);

module.exports.addconfig = function (newconfig, callback) {
    newconfig.save(callback);
}

module.exports.getconfig = function (callback) {
    var query = {compte: 1};
    config.findOne(query, callback);
}

module.exports.changeConfig = function (config, callback) {
    config.save(callback);
}

