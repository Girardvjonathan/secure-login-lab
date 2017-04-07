let User = require('../../models/users');
let express = require('express');
let router = express.Router();
let Log = require('../../models/logs.js');

router.get('/', ensureAuthenticated, function(req, res) {
    res.render('modify-password');
});

router.post('/', ensureAuthenticated, function(req, res) {
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
            User.changePassword(req.user, newPassword, req.appConfig.password_history_length, function (err, user) {
                if (err && typeof err == "object" && err.length > 0) {
                    res.render('modify-password', {
                        errors: err
                    });
                } else if (err) {
                    req.flash('error_msg', err.message);
                    return res.redirect('/users/modify-password');
                } else {
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

function ensureAuthenticated(req, res, next){
    if(req.isAuthenticated() && !req.user.twoFactorToken){
        return next();
    } else {
        res.redirect('/users/login');
    }
}


module.exports = router;
