var mongoose = require('mongoose');
const crypto = require('crypto');
let Hash = require('./hash');

// User Schema
var UserSchema = mongoose.Schema({
	username: {
		type: String,
        index:true,
        unique: true
    },
    hashed_password: {
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

var User = module.exports = mongoose.model('User', UserSchema);

module.exports.createUser = function(newUser, callback){
	newUser.salt = UserSchema.makeSalt();
	Hash.getCurrent(function (err, hash) {
		console.log(err);
		console.log(hash);
        newUser.hashed_password = UserSchema.encryptPassword(newUser.password, hash.name, newUser.salt);
        newUser.hashId = hash.id;
        console.log(newUser);
        newUser.save(callback);
    });
};

// Adapted from https://github.com/madhums/node-express-mongoose-demo/blob/master/app/models/user.js
UserSchema.methods = {

    /**
     * Authenticate - check if the passwords are the same
     *
     * @param {String} plainText
     * @return {Boolean}
     * @api public
     */

    authenticate: function (plainText) {
        let hash = Hash.getHashById(this.hashId);
        //TODO verify
        return this.encryptPassword(plainText, hash, this.salt) === this.hashed_password;
    },

    /**
     * Make salt
     *
     * @return {String}
     * @api public
     */

    makeSalt: function () {
        return Math.round((new Date().valueOf() * Math.random())) + '';
    },

    /**
     * Encrypt password
     *
     * @param {String} password
     * @return {String}
     * @api public
     */

    encryptPassword: function (password, hash, salt) {
        if (!password) return '';
        try {
            return crypto
                .createHmac(hash, salt)
                .update(password)
                .digest('hex');
        } catch (err) {
            return '';
        }
    },
};

module.exports.getUserByUsername = function(username, callback){
	var query = {username: username};
	User.findOne(query, callback);
}

module.exports.getUserById = function(id, callback){
	User.findById(id, callback);
}

module.exports.comparePassword = function(candidatePassword, callback){
	return UserSchema.authenticate(candidatePassword);
}