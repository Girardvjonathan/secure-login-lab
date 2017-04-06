const EMAIL_SENDER = process.env.EMAIL_ADDR;
const EMAIL_SENDER_PW = process.env.EMAIL_PASS;
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER;

let User = require('../../models/users');
let express = require('express');
let router = express.Router();
let Log = require('../../models/logs.js');
let ResetPasswordHelper = require('../../helpers/reset-password');

var nodemailer = require("nodemailer");
var smtpTransport = require('nodemailer-smtp-transport');
smtpTransport = nodemailer.createTransport(smtpTransport({
    service : "gmail",
    auth : {
        user : EMAIL_SENDER,
        pass : EMAIL_SENDER_PW,
    }
}));

var async = require('async');

// Forgot password
router.get('/forgot-password', function (req, res) {

    if (req.appConfig.allowPasswordReset){
        res.render('forgot-password');
    } else {
        req.flash('error_msg', 'Invalid request');
        return res.redirect('/users/login/');
    }

});


router.post('/forgot-password', function(req, res, next) {
    if (req.appConfig.allowPasswordReset) {
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
        async.waterfall(ResetPasswordHelper.getResetPasswordEmailWaterfall(email, mailOptions, req, res), function(err) {
            if (err) return next(err);
            req.flash('success_msg', 'The instructions to reset your password have been sent to your email address.');
            res.redirect('/users/login');
        });
    } else {
        req.flash('error_msg', 'Invalid request');
        return res.redirect('/users/login/');
    }
});


router.get('/:token&:email', function(req, res) {
    req.logout();

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

router.post('/', function(req, res) {

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

            if (u.locked) {
                req.flash('error_msg', 'This account is locked, only the administrators will be able to unlock the account.');
                return res.redirect('/users/forgot-password');
            }

            u.resetPasswordToken = undefined;
            u.resetPasswordExpires = undefined;
            User.changePassword(u, password, req.appConfig.password_history_length, function (err, user) {
                if (err){
                    return res.render('reset-password', {
                        errors: [{msg: err.message}],
                        token: token,
                        email: email
                    });
                } else {
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


module.exports = router;