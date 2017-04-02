module.exports = function () {
    var mongoose = require('mongoose');


    mongoose.connection.collections['hashes'].drop( function(err) {
        mongoose.connection.collections['configs'].drop( function(err) {
            mongoose.connection.collections['users'].drop( function(err) {
                // mongoose.connection.collections['logs'].drop( function(err) {
                    createData();
                // });
            });
        });
    });

    createData = function () {
        let User = require('./users');
        let Hash = require('./hash');
        let Config = require('./config');
        let Log = require('./logs');
        // Init hash
        let hash1 = new Hash({
            id: 1,
            name: 'sha256',
        });

        let hash2 = new Hash({
            id:2,
            name: 'sha512',
            current: true
        });

        Hash.addHash(hash1,function (err, hash) {
        });
        Hash.addHash(hash2,function (err, hash) {
            let user1 = new User({
                name: 'user1',
                username: 'user1',
                password: 'user1',
                email: 'user1@mailinator.com',
            });

            let user2 = new User({
                username: 'user2',
                name: 'user2',
                password: 'user2',
                email: 'user2@mailinator.com',
                role: "Préposé aux clients d'affaires"
            });

            let admin1 = new User({
                username: 'admin1',
                name: 'admin1',
                password: 'admin1',
                email: 'admin1@mailinator.com',
                role: 'admin',
            });
            let admin2 = new User({
                username: 'admin2',
                name: 'admin2',
                password: 'admin2',
                email: 'admin2@mailinator.com',
                role: 'admin',
            });

            let user3 = new User({
                username: 'john',
                name: 'john',
                password: '123',
                email: 'john@mailinator.com',
                role: 'admin',
            });

            let user4 = new User({
                username: 'chaton',
                name: 'chaton',
                password: '123',
                email: 'chaton@mailinator.com',
            });

            let user5 = new User({
                name: 'Utilisateur1',
                username: 'Utilisateur1',
                password: 'Utilisateur1',
                email: 'Utilisateur1@mailinator.com',
                role: 'Préposé aux clients résidentiels'
            });

            let user6 = new User({
                name: 'Utilisateur2',
                username: 'Utilisateur2',
                password: 'Utilisateur2',
                email: 'Utilisateur2@mailinator.com',
                role: 'Préposé aux clients d\'affaires'
            });


            User.createUser(user1, function (err, user) {
                //console.log(err)
            });
            User.createUser(user2, function (err, user) {
                //console.log(user)
            });
            User.createUser(user3, function (err, user) {
                //console.log(user)
            });
            User.createUser(user4, function (err, user) {
                //console.log(user)
            });
            User.createUser(admin1, function (err, user) {
                //console.log(user)
            });
            User.createUser(admin2, function (err, user) {
                //console.log(user)
            });
            User.createUser(user5, function (err, user) {
                //console.log(user)
            });
            User.createUser(user6, function (err, user) {
                //console.log(user)
            });

        });
        // init config
        let config = new Config({
            compte:1
        });
        Config.addconfig(config, function () {
        });

        console.log('Database migrated');
    }

};
