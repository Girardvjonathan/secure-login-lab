let mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const crypto = require('crypto');
let Hash = require('./hash');

// User Schema
let UserSchema = mongoose.Schema({
    username: {
        type: String,
        index: true,
        unique: true
    },
    password: {
        type: String
    },
    email: {
        type: String,
        unique: true
    },
    name: {
        type: String
    },
    role: {
        type: String,
        default: "user"
    },
    salt: String,
    hashId: Number,
});

let User = module.exports = mongoose.model('User', UserSchema);

module.exports.createUser = function (newUser, callback) {
    newUser.salt = makeSalt();
    Hash.getCurrent(function (err, hash) {
        newUser.password = encryptPassword(newUser.password, hash.name, newUser.salt);
        newUser.hashId = hash.id;
        newUser.save(callback);
    });
};

// Adapted from https://github.com/madhums/node-express-mongoose-demo/blob/master/app/models/user.js

module.exports.authenticate = function (plainText, user) {
        return new Promise((resolve, reject) => {
            Hash.getHashById(user.hashId,function (err, hash) {
                if(err) reject(err);
                let hashed_password = encryptPassword(plainText, hash.name, user.salt);
                resolve({ isMatch: hashed_password === user.password
                , user: user });
            });
    });
    //TODO verify
};

let makeSalt = function () {
    return Math.round((new Date().valueOf() * Math.random())) + '';
};

let encryptPassword = function (password, hash, salt) {
    // console.log("hello + password = "+ password, hash, salt);
    if (!password) return '';
    try {
        return crypto
            .createHmac(hash, salt)
            .update(password)
            .digest('hex');
    } catch (err) {
        return '';
    }
};

module.exports.getUserByUsername = function (username, callback) {
    let query = {username: username};
    User.findOne(query, callback);
};

module.exports.getUserById = function (id, callback) {
    User.findById(id, callback);
};
