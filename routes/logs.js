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

router.get('/', ensureIsAdmin, function(req, res){
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