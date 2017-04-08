let User = require('../../models/users');
let express = require('express');
let router = express.Router();
let Log = require('../../models/logs.js');
let crypto = require('crypto');
let async = require('async');
let ResetPasswordHelper = require('../../helpers/reset-password');

router.get('/', ensureIsAdmin, function(req, res) {
    res.render('add-user');
});

router.post('/', ensureIsAdmin, function(req, res) {
    let currentPassword = req.body.currentPassword;
    let username = req.body.username;
    let email = req.body.email;
    let name = req.body.name;
    let role = parseInt(req.body.role);

    req.checkBody('currentPassword', 'Current password is required').notEmpty();
    req.checkBody('username', 'New password is required').notEmpty();
    req.checkBody('email', 'New password is required').notEmpty();
    req.checkBody('name', 'New password is required').notEmpty();
    req.checkBody('role', 'New password is required').notEmpty();
    req.checkBody('email', 'Email is not valid').isEmail();

    var errors = req.validationErrors();


    if (role === 1) {
        role = "Préposé aux clients résidentiels";
    } else if (role === 2) {
        role = "Préposé aux clients d'affaires";
    } else if (role === 3) {
        role = "admin";
    } else {
        req.flash('error_msg', "Invalid request");
        return res.redirect('/users/add');
    }


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
                                        'https://' + req.headers.host + '/users/reset-password/{{token}}&' + user.email + '\n\n' +
                                        'You have one hour to complete to registration.\n'
                                };
                                async.waterfall(ResetPasswordHelper.getResetPasswordEmailWaterfall(email, mailOptions, req, res), function(err) {
                                    if (err) {
                                        console.log(err);
                                        return err;
                                    }
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
    if(req.isAuthenticated() && !req.user.twoFactorToken){
        return next();
    } else {
        res.redirect('/users/login');
    }
}

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