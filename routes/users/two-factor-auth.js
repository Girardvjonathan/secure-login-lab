let User = require('../../models/users');
let express = require('express');
let router = express.Router();
let Log = require('../../models/logs.js');

router.get('/', function(req, res){
    if (req.user && req.user.twoFactorToken)
        res.render('two-factor-auth');
    else
        return res.redirect('/');            
});

router.post('/', function(req, res) {
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



router.get('/tfa-setup', ensureAuthenticated, function(req, res) {
        res.render('tfa-setup');
    }
);


router.post('/tfa-setup', ensureAuthenticated, function(req, res) {
    var enabled = req.body.twoFactorEnabled;
    var phoneNumber = req.body.phoneNumber;

    if (enabled === "true") {
        enabled = true;
        req.checkBody('phoneNumber', 'The phone number is required when enabling two-factor authentication.').notEmpty();
    }

    var errors = req.validationErrors();

    if (errors) {
        res.render('tfa-setup', {
            errors: errors
        });
    } else {
        User.findOne({
            email : req.user.email
        }, function(err, user) {
            if (!user) {
                console.log("no user found with: " + destEmail);
                req.flash('error', 'No account with that email address exists.');
                return res.redirect('/');
            }
            user.phoneNumber = phoneNumber+"";
            user.twoFactorEnabled = enabled;

            user.save();
            req.flash('success_msg', 'Changes have been applied.');
            res.redirect('/');
        });
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