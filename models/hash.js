/**
 * Created by john on 3/28/17.
 */
var mongoose = require('mongoose');

// User Schema
var HashSchema = mongoose.Schema({
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

var Hash = module.exports = mongoose.model('Hash', HashSchema);

module.exports.addHash = function(newHash, callback){
    newHash.save(callback);
}

module.exports.getHashById = function(id, callback){
    var query = {id: id};
    Hash.findOne(query, callback);
}

module.exports.getHashByName = function(name, callback){
    var query = {name: name};
    Hash.findOne(query, callback);
}

module.exports.getCurrent = function(callback){
    var query = {current: true};
    Hash.findOne(query, callback);
}
