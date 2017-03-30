/**
 * Created by john on 3/30/17.
 */
/**
 * Created by john on 3/28/17.
 */
var mongoose = require('mongoose');

// User Schema
var configSchema = mongoose.Schema({
    id: {
        type: Number,
        index:true,
        unique: true
    },
    name: {
        type: String,
        unique:true
    },
    current: {
        type: Boolean,
        default: false
    }
});

var config = module.exports = mongoose.model('config', configSchema);

module.exports.addconfig = function(newconfig, callback){
    newconfig.save(callback);
}

module.exports.getconfigById = function(id, callback){
    var query = {id: id};
    config.findOne(query, callback);
}

module.exports.getconfigByName = function(name, callback){
    var query = {name: name};
    config.findOne(query, callback);
}

module.exports.getCurrent = function(callback){
    var query = {current: true};
    config.findOne(query, callback);
}
