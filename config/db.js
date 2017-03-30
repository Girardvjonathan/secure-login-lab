/**
 * Created by john on 3/28/17.
 */
module.exports = {
    connectDB: function(callback) {
        "use strict";
        let username = 'gti619';
        let password = 'gti619';
        let mongodbUri = 'mongodb://' + username + ':' + password + '@ds147080.mlab.com:47080/gti619';
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
}
