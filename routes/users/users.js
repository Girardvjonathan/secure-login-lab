var express = require('express');
var router = express.Router();
var User = require('../../models/users');

router.get('/logout', function (req, res) {
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/users/login');
});

router.get('/home-officers', ensureAuthenticated, function(req, res){
    if (req.user.role === "admin" || req.user.role == "Préposé aux clients résidentiels") {
        User.getAllBy('role', 'Préposé aux clients résidentiels', function(err, users){
            res.render('list-users', {
                users: users,
                role: "Préposé aux clients résidentiels"
            });
        });
    } else {
        req.flash('error_msg', 'You don\'t have the permissions the access the requested page.');
        res.redirect('/');
    }
});

router.get('/business-officers', ensureAuthenticated, function(req, res){
    if (req.user.role === "admin" || req.user.role == "Préposé aux clients d'affaires") {
        User.getAllBy('role', 'Préposé aux clients d\'affaires', function(err, users){
            res.render('list-users', {
                users: users,
                role: "Préposé aux clients d'affaires"
            });
        });
    } else {
        req.flash('error_msg', 'You don\'t have the permissions the access the requested page.');
        res.redirect('/');
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