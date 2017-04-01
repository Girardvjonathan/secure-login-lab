var express = require('express');
var router = express.Router();
var hbs = require('express-handlebars').create();

// Get Homepage
router.get('/', ensureAuthenticated, function(req, res){
	res.render('index', {
		user: req.user,
		isAdmin: (req.user.role === "admin"),
        homeOfficersAccess: (req.user.role === "admin" || req.user.role === "Préposé aux clients résidentiels"),
        businessOfficersAccess: (req.user.role === "admin" || req.user.role === "Préposé aux clients d'affaires")
	});
});

router.get('/initdb', function(req, res) {
    require('./../models/populateDB')();
    res.sendStatus(200);
});

function ensureAuthenticated(req, res, next){
    if(req.isAuthenticated() && !req.user.twoFactorToken){
        return next();
    } else {
        res.redirect('/users/login');
    }
}

module.exports = router;