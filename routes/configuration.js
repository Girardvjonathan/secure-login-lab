var express = require('express');
var router = express.Router();
var passport = require('passport');
var hbs = require('express-handlebars').create();
let Config = require('../models/config');

router.get('/', ensureIsAdmin, function(req, res){
	Config.getconfig(function (err, config) {
        res.render('configuration', {
            // dummy config object
            config: config
        });
    })
});

router.post('/apply', ensureIsAdmin, function(req, res){
    Config.getconfig(function (err, config) {
        var maxNbAttempts = req.body.maxNbAttempts;
        var allowPasswordReset = req.body.allowPasswordReset;
        var requireOneNumber = req.body.requireOneNumber;
        var requireOneSymbol = req.body.requireOneSymbol;
		(allowPasswordReset == 'on')? allowPasswordReset=true: allowPasswordReset=false;
		(requireOneNumber == 'on')? requireOneNumber=true: requireOneNumber=false;
		(requireOneSymbol == 'on')? requireOneSymbol=true: requireOneSymbol=false;

        // Validation
        req.checkBody('maxNbAttempts', 'maxNbAttempts is required').notEmpty();
        req.checkBody('maxNbAttempts', 'maxNbAttempts must be a number').isInt();

        var errors = req.validationErrors();

        if (errors) {
            return res.render('configuration', {
                errors: errors
            });
        } else {
            config.maxNbAttempts = maxNbAttempts;
            config.allowPasswordReset = allowPasswordReset;
            config.passwordComplexity.requireOneNumber = requireOneNumber;
            config.passwordComplexity.requireOneSymbol = requireOneSymbol;
            Config.changeConfig(config);
        }
        req.flash('success_msg', 'Changes have been applied');
        res.redirect('/configuration');
	});
});


function ensureIsAdmin(req, res, next){
	if(req.isAuthenticated() && req.user.role === "admin"){
		return next();
	} else {
		//req.flash('error_msg','You are not logged in');
		res.redirect('/users/login');
	}
}

module.exports = router;