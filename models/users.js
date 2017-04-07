let mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const crypto = require('crypto');
let Hash = require('./hash');
let Config = require('./config');

// User Schema
let UserSchema = mongoose.Schema({
    username: {
        type: String,
        index: true,
        unique: true
    },
    password: String,
    email: {
        type: String,
        unique: true
    },
    name: String,
    role: {
        type: String,
        default: "Préposé aux clients résidentiels"
    },
    nbFailedLogins: {
        type: Number,
        default: 0
    },
    locked: {
        type: Boolean,
        default: false
    },
    twoFactorEnabled: Boolean,
    twoFactorToken: String,
    phoneNumber: String,
    salt: String,
    hashId: Number,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    prelockTimeoutExpires: {
        type: Date,
        default: Date.now()
    },
    password_history: [{
        password: String,
        hashId: Number
    }]
});

let User = module.exports = mongoose.model('User', UserSchema);

module.exports.createUser = function (newUser, callback) {
    User.exists(newUser, function (exists) {
        if (exists) {
            callback({message: 'This user already exists.'});
        } else {
            Config.getconfig(function (err, config) {
                var complexityFilter = verifyComplexity(newUser.password, config);

                if (complexityFilter === true) {
                    newUser.salt = makeSalt();
                    Hash.getCurrent(function (err, hash) {
                        newUser.password = encryptPassword(newUser.password, hash, newUser.salt);
                        newUser.hashId = hash.id;
                        
                            // Remplir la liste fifo avec le length de la config
                            for (let i = 0; i < config.password_history_length; i++) {
                                newUser.password_history.push({password: newUser.password, hashId: newUser.hashId})
                            }
                            newUser.save(callback);
                        });
                    
                } else {
                    callback(complexityFilter);
                }
            });
        }
    })
};

// Adapted from https://github.com/madhums/node-express-mongoose-demo/blob/master/app/models/user.js
module.exports.authenticate = function (plainText, user) {
    return new Promise((resolve, reject) => {
        Hash.getHashById(user.hashId, function (err, hash) {
            if (err) reject(err);
            let hashed_password = encryptPassword(plainText, hash, user.salt);
            resolve({
                isMatch: hashed_password === user.password
                , user: user
            });
        });
    });
};

module.exports.changePassword = function (user, newPassword, configPasswordHistoryLength, callback) {
    // user.salt = makeSalt();
    Hash.getCurrent(function (err, hash) {

        Config.getconfig(function (err, config) {

            var complexityFilter = verifyComplexity(newPassword, config);

            if (complexityFilter === true) {
                let usedPassword = false;
                user.password = encryptPassword(newPassword, hash, user.salt);
                user.hashId = hash.id;

                for (let i = 0; i < user.password_history.length; i++) {
                    //TODO logique in case hash is different or we dont handle it
                    if (user.password == user.password_history[i].password) {
                        usedPassword = true;
                        callback(new Error("For security purposes, you cannot reuse a password that you have recently used."));
                        break;
                    }
                }

                if (!usedPassword){
                    if (user.password_history.length){
                        user.password_history.unshift({password: user.password, hashId: user.hashId});
                    }
                    user.password_history.length = (user.password_history.length > configPasswordHistoryLength) ? configPasswordHistoryLength : user.password_history.length;
                    user.save(callback);
                }
            } else {
                callback(complexityFilter);
            }
        });
    });
};

module.exports.exists = function (u, callback) {
    User.find({$or: [{'username': u.username}, {'email': u.email}]}, function (err, user) {
        if (err || user.length > 0) {     // user does not come back null, so check length
            callback(1);
            return;
        }
        //no user
        callback(0);
    });
};


module.exports.setTwoFactor = function (user, callback) {
    user.twoFactorToken = Math.floor(1000 + Math.random() * 9000);
    user.save(callback(user.twoFactorToken));
};

module.exports.checkTwoFactor = function (user, code, callback) {
    if (code == user.twoFactorToken) {
        user.twoFactorToken = undefined;
        user.save(callback(true));
    } else {
        callback(false);
    }
};

module.exports.lock = function (username, callback) {
    User.getUserByUsername(username, function (err, user) {
        user.locked = true;
        user.save(callback);
    });
};

module.exports.incrementFailedLogins = function (username, callback) {
    User.getUserByUsername(username, function (err, user) {
        if (user) {
            user.nbFailedLogins++;
            user.save(callback(user.nbFailedLogins));
        } else {
            callback(0);
        }
    });
};

module.exports.resetFailedLogins = function (user, callback) {
    user.nbFailedLogins = 0;
    user.save(callback);
};


module.exports.setPrelockTimeout = function (username, dateTimeoutExpires, callback) {
    User.getUserByUsername(username, function (err, user) {
        if (user) {
            user.prelockTimeoutExpires = dateTimeoutExpires;
            user.save(callback);
        } else {
            callback(0);
        }
    })
};

module.exports.unlock = function (user, callback) {
    user.locked = false;
    user.save(callback);
};


let makeSalt = function () {
    return Math.round((new Date().valueOf() * Math.random())) + '';
};

let encryptPassword = function (password, hash, salt) {
    // console.log("hello + password = "+ password, hash, salt);
    if (!password) return '';
    try {
        let hashPasses = [];
        let stringToHash;
        let saltToUse = password + salt;

        for (var i = 0; i < hash.nbPasses; i++) {
            stringToHash = (i === 0) ? password : hashPasses[0];
            hashPasses.unshift(crypto.createHmac(hash.name, saltToUse).update(stringToHash).digest('hex'));
        }
        return hashPasses[0];
        
    } catch (err) {
        return err;
    }
};

module.exports.getUserByUsername = function (username, callback) {
    let query = {username: username};
    User.findOne(query, callback);
};

module.exports.getUserById = function (id, callback) {
    User.findById(id, callback);
};

module.exports.getAllBy = function (by, value, callback) {
    let query = {};
    query[by] = value;
    User.find(query, callback);
};


function verifyComplexity(password, config) {


    var requireOneNumber = config.passwordComplexity.requireOneNumber;
    var requireOneSymbol = config.passwordComplexity.requireOneSymbol;
    var requireOneUppercase = config.passwordComplexity.requireOneUppercase;
    var requireOneLowercase = config.passwordComplexity.requireOneLowercase;
    var requireSpecificLength = config.passwordComplexity.requireSpecificLength;
    var requireSpecificLengthMin = config.passwordComplexity.requireSpecificLengthMin;
    var requireSpecificLengthMax = config.passwordComplexity.requireSpecificLengthMax;
    var requireMaximumConsecutiveRecurringCharacters = config.passwordComplexity.requireMaximumConsecutiveRecurringCharacters;

    function hasLowerCase(str) {
        return (/[a-z]/.test(str));
    }

    function hasUpperCase(str) {
        return (/[A-Z]/.test(str));
    }

    function hasDigit(str) {
        return (/[0-9]/.test(str));
    }

    function hasSpecialChar(str) {
        return (/[#?!@$%^&*-]/.test(str));
    }

    function hasIdenticalCharactersFollowing(str){
        return (/(.)\1{2,}/.test(str));
    }

    function hasMaximumCharacter(str, min, max){
        return (str.length >= min  && str.length <= max);
    }

    errors = [];
    if(requireOneLowercase && !hasLowerCase(password)) {
        errors.push({ param : "password", msg : 'Password requires at least one lowercase char' });
    }

    if(requireOneUppercase && !hasUpperCase(password)) {
        errors.push({ param : "password", msg : 'Password requires at least one uppercase char' });
    }

    if(requireOneNumber && !hasDigit(password)) {
        errors.push({ param : "password", msg : 'Password requires one number minimum' });
    }

    if(requireOneSymbol && !hasSpecialChar(password)) {
        errors.push({ param : "password", msg : 'Password requires one symbol minimum' });
    }
    if(requireSpecificLength && !hasMaximumCharacter(password, requireSpecificLengthMin, requireSpecificLengthMax)) {
        errors.push({ param : "password", msg : 'Password requires must be between' + requireSpecificLengthMin + ' and ' + requireSpecificLengthMax + ' characters' });
    }
    if(requireMaximumConsecutiveRecurringCharacters && hasIdenticalCharactersFollowing(password)) {
        errors.push({ param : "password", msg : 'Password cannot contain more then 2 consecutives characters'});
    }

    if (errors.length > 0)
        return errors;
    else
        return true;

}
