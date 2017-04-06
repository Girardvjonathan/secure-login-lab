var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var expressValidator = require('express-validator');
var flash = require('connect-flash');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongo = require('mongodb');
var mongoose = require('mongoose');
require('ssl-root-cas').inject();
require('dotenv').config();

var Config = require('./models/config');

//CSRF
// var csrf = require('csurf');

// mongoose.connect('mongodb://localhost/loginapp');
// var db = mongoose.connection;
var db = require('./config/db');

// var routes = require('./routes/index');
// var users = require('./routes/users');

// Init App
var app = express();

// View Engine
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout:'layout'}));
app.set('view engine', 'handlebars');
app.locals.copyrightsYear = new Date().getFullYear();

// BodyParser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Set Static Folder
app.use(express.static(path.join(__dirname, 'public')));

// Express Session
app.use(session({
    secret: process.env.APP_SECRET,
    cookie: {
        // secure: true,
        maxAge: parseFloat(process.env.APP_SESSION_TIME_MINUTES) * 1000 * 60 // 5 min cookies
    },
    saveUninitialized: true,
    resave: true
}));

// Reset session timeout everytime there's a request
app.use(function(req,res,next){
  req.session._garbage = Date();
  req.session.touch();
  next()
})

// Passport init
app.use(passport.initialize());
app.use(passport.session());

// Express Validator
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

// Connect Flash
app.use(flash());

// Global Vars
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});


//TODO check that
// app.use(csrf());


// Config hook
app.use(function(req, res, next){
  Config.getconfig(function (err, config) {
    req.appConfig = config;
    next();
  });
});


require('./routes/routes')(app); // configure our routes

// Set Port
app.set('port', (process.env.PORT || 3000));

var fs = require('fs');
var https = require('https');

var options = {
    key  : fs.readFileSync('server.key'),
    cert : fs.readFileSync('server.crt')
};

db.connectDB(function() {
    app.listen(app.get('port'), function(){
        console.log('Server started on port '+app.get('port'));
    });
    // https.createServer(options, app).listen(app.get('port'), function () {
    //     console.log('Started!');
    // });
});

exports = module.exports = app;