/**
 * Created by john on 3/28/17.
 */
module.exports = {
    connectDB: function(callback) {
        "use strict";
        let username = process.env.DB_USER;
        let password = process.env.DB_PASS;
        let mongodbUri = 'mongodb://' + username + ':' + password + "@" + process.env.DB_HOST;
        // let mongodbUri = "mongodb://localhost/new";
        // for local ^

        let mongoose = require('mongoose');
        mongoose.connect(mongodbUri);

        let conn = mongoose.connection;
        conn.on('error', console.error.bind(console, 'connection error:'));
        conn.once('open', function() {
            console.log("Database connection established");
            callback();
        });
    }
};


