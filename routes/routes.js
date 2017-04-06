module.exports = function(app) {
    // server routes ===========================================================

    // authentication routes

    // frontend routes =========================================================
    // route to handle all angular requests
    var index = require('./index');
    app.use('/', index);

    // Init db with user
    app.get('/initdb', function(req, res) {
        require('./../models/populateDB')();
        return res.send(JSON.stringify("ok"));
    });

    var users = require('./users/users');
    app.use('/users', users);

        var login = require('./users/login');
        app.use('/users/login', login);

        var twoFactorAuth = require('./users/two-factor-auth');
        app.use('/users/two-factor-auth', twoFactorAuth);

        var resetPassword = require('./users/reset-password');
        app.use('/users/reset-password', resetPassword);

        var register = require('./users/register');
        app.use('/users/register', register);

        var add = require('./users/add');
        app.use('/users/add', add);

        var modifyPassword = require('./users/modify-password');
        app.use('/users/modify-password', modifyPassword);

        var lock = require('./users/lock');
        app.use('/users/lock', lock);

    var logs = require('./logs');
    app.use('/logs', logs);

    var configuration = require('./configuration');
    app.use('/configuration', configuration);



};
