
module.exports.getResetPasswordEmailWaterfall = function (destEmail, mailOptions, req, res) {

    const ONE_HOUR = 3600000;
    const EMAIL_SENDER = process.env.EMAIL_ADDR;
    const EMAIL_SENDER_PW = process.env.EMAIL_PASS;
    const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER;

    var nodemailer = require("nodemailer");
    let crypto = require('crypto');
    let User = require('../models/users');
    var smtpTransport = require('nodemailer-smtp-transport');

    smtpTransport = nodemailer.createTransport(smtpTransport({
        service : "gmail",
        auth : {
            user : EMAIL_SENDER,
            pass : EMAIL_SENDER_PW,
        }
    }));


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

                    if (user.locked) {
                        req.flash('error', 'This account is locked, only the administrators will be able to unlock the account.');
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
                mailOptions.text = mailOptions.text.replace("{{token}}", token);
                smtpTransport.sendMail(mailOptions, function(err) {
                    console.log("message send to :" + user.email);
                    req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                    done(err, 'done');
                });
            }
    ];

};

