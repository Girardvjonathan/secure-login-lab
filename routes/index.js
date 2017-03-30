var express = require('express');
var router = express.Router();
var hbs = require('express-handlebars').create();

// Get Homepage
router.get('/', ensureAuthenticated, function(req, res){
	res.render('index', {
		user: req.user,
		isAdmin: (req.user.role === "admin")
	});
});

router.get('/initdb', function(req, res) {
    require('./../models/populateDB')();
    res.sendStatus(200);
});

function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
		//req.flash('error_msg','You are not logged in');
		res.redirect('/users/login');
	}
}

module.exports = router;