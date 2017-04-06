const EMAIL_SENDER = process.env.EMAIL_ADDR;
const EMAIL_SENDER_PW = process.env.EMAIL_PASS;
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER;

let User = require('../../models/users');
let express = require('express');
let router = express.Router();
let Log = require('../../models/logs.js');
let ResetPasswordHelper = require('../../helpers/reset-password');
let async = require('async');


var nodemailer = require("nodemailer");
var smtpTransport = require('nodemailer-smtp-transport');
smtpTransport = nodemailer.createTransport(smtpTransport({
    service : "gmail",
    auth : {
        user : EMAIL_SENDER,
        pass : EMAIL_SENDER_PW,
    }
}));


router.get('/locked-accounts', ensureIsAdmin, function(req, res){
    if (req.user.role === "admin") {
        User.getAllBy('locked', true, function(err, users){
            res.render('list-users', {
                users: users,
                role: "Locked users",
                listItemActionUrl: true
            });
        });
    } else {
        req.flash('error_msg', 'You don\'t have the permissions the access the requested page.');
        res.redirect('/');
    }
});




router.post('/unlock', ensureIsAdmin, function(req, res){
    var id = req.body.id;

    User.getUserById(id, function(err, user){
        User.unlock(user, function(err, user){
            var mailOptions = {
                to : user.email,
                from : EMAIL_SENDER,
                subject : 'GTI619 - LoginApp - Account unlocked and Password reset',
                text : 'You are receiving this because your account had been locked and now requires a password reset.\n\n' +
                    'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                    'http://' + req.headers.host + '/users/reset-password/{{token}}&' + user.email + '\n\n' +
                    'You have one hour to do so.\n'
            };
            async.waterfall(ResetPasswordHelper.getResetPasswordEmailWaterfall(user.email, mailOptions, req, res), function(err) {
                if (err) return next(err);
                req.flash('success_msg', 'The account has been unlocked and the instructions to reset the password has been sent to the user at his email address.');
                res.redirect('/users/locked-accounts');
            });
        })
    })

});

function ensureIsAdmin(req, res, next){
    if(req.isAuthenticated() && !req.user.twoFactorToken && req.user.role === "admin"){
        return next();
    } else {
        //req.flash('error_msg','You are not logged in');
        req.flash('error_msg', 'You don\'t have the permissions the access the requested page.');
        res.redirect('/');
    }
}


module.exports = router;