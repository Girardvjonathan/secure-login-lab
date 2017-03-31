var mongoose = require('mongoose');

// User Schema
var LogSchema = mongoose.Schema({
    username: {
        type: String
    },
    ipAddress: {
        type: String
    },
    action: {
        type: String
    },
    date: {
        type: Date
    }
});


var Log = module.exports = mongoose.model('log', LogSchema);

module.exports.addLog = function (newLog, callback) {
    newLog.save(callback);
}

module.exports.getLogs = function (callback) {
    Log.find({}, callback);
}