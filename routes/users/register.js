let User = require('../../models/users');
let express = require('express');
let router = express.Router();
let Log = require('../../models/logs.js');



// Register
router.get('/', function (req, res) {
    res.render('register');
});

// Register User
router.post('/', function (req, res) {
    var name = req.body.name;
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;
    var password2 = req.body.password2;
    var role = parseInt(req.body.role);

    // Validation
    req.checkBody('name', 'Name is required').notEmpty();
    req.checkBody('email', 'Email is required').notEmpty();
    req.checkBody('email', 'Email is not valid').isEmail();
    req.checkBody('username', 'Username is required').notEmpty();
    req.checkBody('password', 'Password is required').notEmpty();
    req.checkBody('password2', 'Passwords do not match').equals(req.body.password);
    req.checkBody('role', 'Role is required').notEmpty();

    if (role === 1) {
        role = "Préposé aux clients résidentiels";
    } else if (role === 2) {
        role = "Préposé aux clients d'affaires";
    } else {
        req.flash('error_msg', "Invalid request");
        return res.redirect('/users/register');
    }


    var errors = req.validationErrors();


    if (errors && errors.length > 0) {
        res.render('register', {
            errors: errors
        });
    } else {
        var newUser = new User({
            name: name,
            email: email,
            username: username,
            password: password,
            role: role
        });

        User.createUser(newUser, function (err, user) {
            if (err && typeof err == "object" && err.length > 0) {
                res.render('register', {
                    errors: err
                });
            } else if (err) {
                req.flash('error_msg', err.message);
                return res.redirect('/users/register');
                throw err;
                // console.log(user);
            } else {
                req.flash('success_msg', 'You are registered and can now login');
                res.redirect('/users/login');
            }
        });
    }
});

module.exports = router;