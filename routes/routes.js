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

    var users = require('./users');
    app.use('/users', users);

    var configuration = require('./configuration');
    app.use('/configuration', configuration);

};
