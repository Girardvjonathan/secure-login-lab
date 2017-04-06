let express = require('express');
let router = express.Router();
let passport = require('passport');
let LocalStrategy = require('passport-local').Strategy;
let Log = require('../../models/logs.js');
let bouncer = require("express-bouncer")(2000, 900000);
let User = require('../../models/users');


const TWILIOACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID; 
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;  
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
var twilio = require('twilio');
var client = new twilio.RestClient(TWILIOACCOUNT_SID, TWILIO_AUTH_TOKEN);


// Login
router.get('/', function (req, res) {
    res.render('login', {
        passwordResettable: req.appConfig.allowPasswordReset
    });
});

passport.use(new LocalStrategy(
    function (username, password, done) {
        User.getUserByUsername(username, function (err, user) {
            if (err) throw err;
            if (!user) {
                return done(null, false, {message: 'Unknown User'});
            }

            User.authenticate(password, user)
                .then((res) => {
                    if (res.isMatch) {
                        return done(null, res.user);
                    } else {
                        return done(null, false, {message: 'Invalid username/password.'});
                    }
                })
                .catch(err => console.log(err));
        });
    }));


passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.getUserById(id, function (err, user) {
        done(err, user);
    });
});


bouncer.blocked = function (req, res, next, remaining) {
    res.status(429).send("Too many requests have been made within a short period of time, " +
        "please wait " + remaining / 1000 + " seconds");
};

router.post('/', bouncer.block, function (req, res, next) {
    passport.authenticate('local', function (err, user, info) {
        if (err) {
            return next(err);
        }

        if (!user || user.locked) {
            User.getUserByUsername(req.body.username, function (err, u) {
                if (u && u.prelockTimeoutExpires && Date.now() < u.prelockTimeoutExpires) {
                    req.flash('error_msg', 'Wrong credentials. You will need to wait ' + req.appConfig.attemptTimeout/1000 + " seconds before you can try to login to this account again.");
                    return res.redirect('/users/login');
                } else {
                    User.incrementFailedLogins(req.body.username, function(nbFailedLogins){
                        if (nbFailedLogins >= req.appConfig.nbFailsPerAttempt * req.appConfig.maxNbAttempts) {
                            User.lock(req.body.username, function(){
                                let errors = [];
                                errors.push({shake: true, param : "Max login attempts", msg : 'This account has been locked due to a high number of unsuccesful logins. The site administrators have been informed of the incident and the FBI may or may not be on their way to your house. The administrator will be able to unlock your account.' });
                                return res.render('login', {
                                    errors: errors,
                                    passwordResettable: req.appConfig.allowPasswordReset,
                                    troll: true
                                });
                            });
                        } else if (nbFailedLogins && !(nbFailedLogins % req.appConfig.nbFailsPerAttempt)) {
                            User.setPrelockTimeout(req.body.username, Date.now() + req.appConfig.attemptTimeout, function(){
                                req.flash('error_msg', 'Wrong credentials. You will need to wait ' + req.appConfig.attemptTimeout/1000 + " seconds before you can try to login to this account again.");
                                return res.redirect('/users/login');
                            });

                        } else {
                            req.flash('error_msg', 'Wrong credentials ');
                            Log.addLog(new Log({
                                username: req.body.username,
                                ipAddress: req.headers['x-real-ip'] || req.connection.remoteAddress,
                                action: "Failed login",
                                date: Date.now()
                            }));
                            return res.redirect('/users/login');
                        }

                    });
                }
            });


        } else {
            req.logIn(user, function (err) {
                if (err) {
                    return next(err);
                }

                bouncer.reset(req);

                if (user.twoFactorEnabled === true) {
                    User.setTwoFactor(user, function(token){
                        client.messages.create({
                            body: 'Your verification code is: ' + token,
                            to: '+1' + user.phoneNumber,  // Text this number
                            from: TWILIO_PHONE_NUMBER // From a valid Twilio number
                        }, function(err, message) {
                            req.user = user;
                            return res.redirect('/users/two-factor-auth');
                        });
                        
                    });
                } else {
                    User.resetFailedLogins(user, function(){
                        Log.addLog(new Log({
                            username: user.username,
                            ipAddress: req.headers['x-real-ip'] || req.connection.remoteAddress,
                            action: "Successful login",
                            date: Date.now()
                        }));

                        // res.redirect('/users/' + user.username);
                        return res.redirect('/');    
                    })
             
                }

            });
        }
    })(req, res, next);
});

router.get('/two-factor-auth', function(req, res){
    if (req.user && req.user.twoFactorToken)
        res.render('two-factor-auth');
    else
        return res.redirect('/');            
});

router.post('/two-factor-auth', function(req, res) {
    let twoFactorCode = req.body.twoFactorCode;
    req.checkBody("twoFactorCode", "The code is required to login").notEmpty();

    let errors = req.validationErrors();

    if (errors) {
        res.render('two-factor-auth', {
            errors: errors
        });
    } else {
        // console.log(req.user);
        User.checkTwoFactor(req.user, twoFactorCode, function(validated){
            if (validated) {
                User.resetFailedLogins(req.user, function(){
                    Log.addLog(new Log({
                        username: req.user.username,
                        ipAddress: req.headers['x-real-ip'] || req.connection.remoteAddress,
                        action: "Successful login",
                        date: Date.now()
                    }));

                    res.redirect('/');
                });
            } else {
                Log.addLog(new Log({
                    username: req.user.username,
                    ipAddress: req.headers['x-real-ip'] || req.connection.remoteAddress,
                    action: "Failed login (2-factor)",
                    date: Date.now()
                }));
                req.flash('error_msg', 'The verification code you supplied is incorrect.');
                res.redirect('/users/two-factor-auth');
            }
        });
    }
})

module.exports = router;