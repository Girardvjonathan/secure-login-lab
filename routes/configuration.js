var express = require('express');
var router = express.Router();
var passport = require('passport');
var hbs = require('express-handlebars').create();

router.get('/', ensureIsAdmin, function(req, res){
	res.render('configuration', {
		// dummy config object
		config: {
			maxNbAttempts: 3,
			allowPasswordReset: true,
			passwordComplexity: {
				requireOneNumber: false,
				requireOneSymbol: true
			}
		}
	});
});

router.post('/apply', ensureIsAdmin, function(req, res){
    req.flash('success_msg', 'Changes have been applied');
    res.redirect('/configuration');
})


function ensureIsAdmin(req, res, next){
	if(req.isAuthenticated() && req.user.role === "admin"){
		return next();
	} else {
		//req.flash('error_msg','You are not logged in');
		res.redirect('/users/login');
	}
}

module.exports = router;