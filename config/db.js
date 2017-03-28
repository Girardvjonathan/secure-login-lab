/**
 * Created by john on 3/28/17.
 */
module.exports = {
    connectDB: function(callback) {
        "use strict";
        let username = 'user';
        let password = 'pass';
        // let mongodbUri = 'mongodb://' + username + ':' + password + '@ds123050.mlab.com:23050/name';
        // for local
        let mongodbUri = "mongodb://localhost/gti619";

        let mongoose = require('mongoose');
        mongoose.connect(mongodbUri);

        let conn = mongoose.connection;
        conn.on('error', console.error.bind(console, 'connection error:'));
        conn.once('open', function() {
            console.log("Database connection established");
            callback();
        });
    }
}
