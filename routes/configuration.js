var express = require('express');
var router = express.Router();
var passport = require('passport');
var hbs = require('express-handlebars').create();
var handlebars = require('handlebars');
var moment = require('moment');
let Config = require('../models/config');
let Log = require('../models/logs');

handlebars.registerHelper('formatTime', function (date, format) {
    var mmnt = moment(date);
    return mmnt.format(format);
});

router.get('/logs', ensureIsAdmin, function(req, res){
    Log.getLogs(function(err, logs) {
        logs.map(function(log){
            if (log.action === "Successful login")
                log.tag = "success";
            else if (log.action === "Failed login" || log.action === "Failed login (2-factor)")
                log.tag = "danger"
            else
                log.tag = "primary"
            return log;
        });
        res.render('logs', {
            logs: logs
        });
    });
});

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
        var nbFailsPerAttempt = req.body.nbFailsPerAttempt;
        var password_history_length = req.body.password_history_length;
		(allowPasswordReset == 'on')? allowPasswordReset=true: allowPasswordReset=false;
		(requireOneNumber == 'on')? requireOneNumber=true: requireOneNumber=false;
		(requireOneSymbol == 'on')? requireOneSymbol=true: requireOneSymbol=false;

        // Validation
        req.checkBody('maxNbAttempts', 'maxNbAttempts is required').notEmpty();
        req.checkBody('maxNbAttempts', 'maxNbAttempts must be a number').isInt();
        req.checkBody('nbFailsPerAttempt', 'nbFailsPerAttempt is required').notEmpty();
        req.checkBody('nbFailsPerAttempt', 'nbFailsPerAttempt must be a number').isInt();
        req.checkBody('password_history_length', 'password_history_length is required').notEmpty();
        req.checkBody('password_history_length', 'password_history_length must be a number').isInt();

        var errors = req.validationErrors();

        if (errors) {
            return res.render('configuration', {
                errors: errors
            });
        } else {
            config.maxNbAttempts = maxNbAttempts;
            config.nbFailsPerAttempt = nbFailsPerAttempt;
            config.allowPasswordReset = allowPasswordReset;
            config.passwordComplexity.requireOneNumber = requireOneNumber;
            config.passwordComplexity.requireOneSymbol = requireOneSymbol;
            config.password_history_length = password_history_length;
            Config.changeConfig(config);
        }
        req.flash('success_msg', 'Changes have been applied');
        res.redirect('/configuration');
	});
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