const ONE_HOUR = 3600000;
const EMAIL_SENDER = "gti619.loginapp@gmail.com";
const EMAIL_SENDER_PW = "gti619gti619"; // could put credentials in seperate file

var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
let Config = require('../models/config');
let Log = require('../models/logs.js');

var async = require('async');
var crypto = require('crypto');
var nodemailer = require("nodemailer");
var smtpTransport = require('nodemailer-smtp-transport');
var smtpTransport = nodemailer.createTransport(smtpTransport({
    service : "gmail",
    auth : {
        user : EMAIL_SENDER,
        pass : EMAIL_SENDER_PW,
    }
}));

var User = require('../models/users');
var bouncer = require("express-bouncer")(2000, 900000);
var isPasswordResettable = function(callback) {
    return Config.getconfig(function (err, config) {
        callback(config.allowPasswordReset);
    });
}


// Register
router.get('/register', function (req, res) {
    res.render('register');
});

// Login
router.get('/login', function (req, res) {
    isPasswordResettable(function(passwordResettable){
        res.render('login', {
            passwordResettable: passwordResettable
        });
    });
});

// Forgot password
router.get('/forgot-password', function (req, res) {
    isPasswordResettable(function(passwordResettable){
        if (passwordResettable){
            res.render('forgot-password');
        } else {
            req.flash('error_msg', 'Invalid request');
            return res.redirect('/users/login/');
        }
    });
});

// Register User
router.post('/register', function (req, res) {
    var name = req.body.name;
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;
    var password2 = req.body.password2;

    // Validation
    req.checkBody('name', 'Name is required').notEmpty();
    req.checkBody('email', 'Email is required').notEmpty();
    req.checkBody('email', 'Email is not valid').isEmail();
    req.checkBody('username', 'Username is required').notEmpty();
    req.checkBody('password', 'Password is required').notEmpty();
    req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

    var errors = req.validationErrors();

    if (errors) {
        res.render('register', {
            errors: errors
        });
    } else {
        var newUser = new User({
            name: name,
            email: email,
            username: username,
            password: password
        });

        User.createUser(newUser, function (err, user) {
            if (err) {
                req.flash('error_msg', err.message);
                return res.redirect('/users/register');
                throw err;
                // console.log(user);
            } else {
                req.flash('success_msg', 'You are registered and can now login');
                res.redirect('/users/login');
            }
        });
    }
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
    res.send(429, "Too many requests have been made, " +
        "please wait " + remaining / 1000 + " seconds");
};

router.post('/login', bouncer.block, function (req, res, next) {
    passport.authenticate('local', function (err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user) {
            req.flash('error_msg', 'Wrong credential');
            Log.addLog(new Log({
                username: req.body.username,
                ipAddress: req.headers['x-real-ip'] || req.connection.remoteAddress,
                action: "Failed login",
                date: Date.now()
            }));
            return res.redirect('/users/login');
        }
        req.logIn(user, function (err) {
            if (err) {
                return next(err);
            }

            Log.addLog(new Log({
                username: req.body.username,
                ipAddress: req.headers['x-real-ip'] || req.connection.remoteAddress,
                action: "Successful login",
                date: Date.now()
            }));

            // res.redirect('/users/' + user.username);
            bouncer.reset(req);
            return res.redirect('/');
        });
    })(req, res, next);
});

router.get('/logout', function (req, res) {
    req.logout();

    req.flash('success_msg', 'You are logged out');

    res.redirect('/users/login');
});


router.post('/forgot-password', function(req, res, next) {
    isPasswordResettable(function(passwordResettable){
        if (passwordResettable) {
            var email = req.body.email;
            var mailOptions = {
                to : email,
                from : EMAIL_SENDER,
                subject : 'GTI619 - LoginApp - Password reset',
                text : 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                    'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                    'http://' + req.headers.host + '/users/reset-password/{{token}}&' + email + '\n\n' +
                    'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
            async.waterfall(getResetPasswordEmailWaterfall(email, mailOptions, req, res), function(err) {
                if (err) return next(err);
                req.flash('success_msg', 'The instructions to reset your password have been sent to your email address.');
                res.redirect('/users/login');
            });
        } else {
            req.flash('error_msg', 'Invalid request');
            return res.redirect('/users/login/');
        }
    });

});


router.get('/reset-password/:token&:email', function(req, res) {
    var email = req.params.email;
    var token = req.params.token;
    User.findOne({
        resetPasswordToken : req.params.token,
        email: email,
        resetPasswordExpires : {
            $gt : Date.now()
        }
    }, function(err, user) {
        if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('/users/forgot-password');
        }

        //res.redirect('/resetPassword/' + email);
        res.render('reset-password', {
            email: email,
            token: token
        });

    });
});

router.post('/reset-password', function(req, res) {

    var email = req.body.email;
    var password = req.body.password;
    var passwordConfirm = req.body.passwordConfirm;
    var token = req.body.token;

    // Validation
    req.checkBody('email', 'Email is required').notEmpty();
    req.checkBody('email', 'Email is not valid').isEmail();
    req.checkBody('password', 'Password is required').notEmpty();
    req.checkBody('passwordConfirm', 'Passwords do not match').equals(req.body.password);
    req.checkBody('token', 'Invalid request').notEmpty();

    var errors = req.validationErrors();

    if (errors) {
        res.render('reset-password', {
            errors: errors,
            token: token,
            email: email
        });

    } else {
        User.findOne({
            email : req.body.email,
            resetPasswordToken: token,
            resetPasswordExpires: {
                $gt: Date.now()
            }
        }, function(err, u) {
            if (!u) {
                console.log('user ' + email + ' not found');
                req.flash('error_msg', 'Invalid request');
                return res.redirect('/users/forgot-password/');
            }

            u.resetPasswordToken = undefined;
            u.resetPasswordExpires = undefined;
            User.changePassword(u, password, function (err, user) {
                if (err) throw err;
                else{
                    Log.addLog(new Log({
                        username: user.username,
                        ipAddress: req.headers['x-real-ip'] || req.connection.remoteAddress,
                        action: "Password reset",
                        date: Date.now()
                    }));
                    req.flash('success_msg', 'Your password has been changed.');
                    return res.redirect('/users/login');
                }
            });
        });
    }
});

router.get('/modify-password', ensureAuthenticated, function(req, res) {
    res.render('modify-password');
});

router.post('/modify-password', ensureAuthenticated, function(req, res) {
    let currentPassword = req.body.currentPassword;
    let newPassword = req.body.newPassword;
    let newPasswordConfirm = req.body.newPasswordConfirm;

    req.checkBody('currentPassword', 'Current password is required').notEmpty();
    req.checkBody('newPassword', 'New password is required').notEmpty();
    req.checkBody('newPasswordConfirm', 'New password confirmation is required').notEmpty();
    req.checkBody('newPasswordConfirm', 'New passwords do not match').equals(req.body.newPassword);

    var errors = req.validationErrors();

    if (errors) {
        res.render('modify-password', {
            errors: errors
        });
    } else {
        User.authenticate(currentPassword, req.user)
            .then((response) => {
                if (response.isMatch) {
                    modifyPassword();
                } else {
                    req.flash('error_msg', 'The password you have entered as your "current" one is WRONG.');
                    return res.redirect('/users/modify-password/');
                }
            })
            .catch(err => console.log(err));

        function modifyPassword(){
            User.changePassword(req.user, newPassword, function (err, user) {
                if (err) throw err;
                else{
                    Log.addLog(new Log({
                        username: user.username,
                        ipAddress: req.headers['x-real-ip'] || req.connection.remoteAddress,
                        action: "Password change",
                        date: Date.now()
                    }));
                    req.flash('success_msg', 'Your password has been changed.');
                    return res.redirect('/');
                }
            });
        }
    }
});

router.get('/add', ensureIsAdmin, function(req, res) {
    res.render('add-user');
});

router.post('/add', ensureIsAdmin, function(req, res) {
    let currentPassword = req.body.currentPassword;
    let username = req.body.username;
    let email = req.body.email;
    let name = req.body.name;
    let role = req.body.role;

    req.checkBody('currentPassword', 'Current password is required').notEmpty();
    req.checkBody('username', 'New password is required').notEmpty();
    req.checkBody('email', 'New password is required').notEmpty();
    req.checkBody('name', 'New password is required').notEmpty();
    req.checkBody('role', 'New password is required').notEmpty();
    req.checkBody('email', 'Email is not valid').isEmail();

    var errors = req.validationErrors();

    if (errors) {
        res.render('modify-password', {
            errors: errors
        });
    } else {
        User.authenticate(currentPassword, req.user)
            .then((response) => {
                if (response.isMatch) {
                    var newUser = new User({
                        name: name,
                        email: email,
                        username: username,
                        role: role
                    });

                    crypto.randomBytes(20, function(err, buf) {
                        newUser.password = buf.toString('hex');
                        User.createUser(newUser, function (err, user) {
                            if (err) {
                                req.flash('error_msg', err.message);
                                return res.redirect('/users/add');
                            } else {
                                var mailOptions = {
                                    to : email,
                                    from : 'loginApp@gmail.com',
                                    subject : 'GTI619 - LoginApp - Password reset',
                                    text : 'An account has been created for you on loginApp.\n\n' +
                                        'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                                        'http://' + req.headers.host + '/users/reset-password/{{token}}&' + user.email + '\n\n' +
                                        'You have one hour to complete to registration.\n'
                                };
                                async.waterfall(getResetPasswordEmailWaterfall(email, mailOptions, req, res), function(err) {
                                    if (err) return next(err);
                                    req.flash('success_msg', 'The user has been created and an email has been sent to ' + email + ' containing instructions to define a password.');
                                    res.redirect('/');
                                });
                            }
                        });
                    });
                } else {
                    req.flash('error_msg', 'The password you have entered as your "current" one is WRONG. Are you even trying?');
                    return res.redirect('/users/add');
                }

            }).catch(err => console.log(err));
    }
});


function ensureAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return next();
    } else {
        res.redirect('/users/login');
    }
}

function ensureIsAdmin(req, res, next){
    if(req.isAuthenticated() && req.user.role === "admin"){
        return next();
    } else {
        //req.flash('error_msg','You are not logged in');
        res.redirect('/users/login');
    }
}

function getResetPasswordEmailWaterfall(destEmail, mailOptions, req, res){
    return [
            function(done) {
                crypto.randomBytes(20, function(err, buf) {
                    var token = buf.toString('hex');
                    done(err, token);
                });
            },
            function(token, done) {
                User.findOne({
                    email : destEmail
                }, function(err, user) {
                    if (!user) {
                        console.log("no user found with: " + destEmail);
                        req.flash('error', 'No account with that email address exists.');
                        return res.redirect('/users/forgot-password');
                    }
                    user.resetPasswordToken = token;
                    user.resetPasswordExpires = Date.now() + ONE_HOUR;

                    user.save(function(err) {
                        done(err, token, user);
                    });
                });
            },
            function(token, user, done) {
                var smtpTransport = require('nodemailer-smtp-transport');
                var smtpTransport = nodemailer.createTransport(smtpTransport({
                    service : "gmail",
                    auth : {
                        user : EMAIL_SENDER,
                        pass : EMAIL_SENDER_PW,
                    }
                }));
                mailOptions.text = mailOptions.text.replace("{{token}}", token);
                smtpTransport.sendMail(mailOptions, function(err) {
                    console.log("message send to :" + user.email);
                    req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                    done(err, 'done');
                });
            }
    ];
}

module.exports = router;
