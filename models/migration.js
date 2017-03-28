module.exports = function () {
    let User = require('./users');
    //
    // // init user
    let user1 = new User({
        name: 'user1',
        username: 'user1',
        password: "user1",
        email: "user1@mailinator.com",
    });

    let user2 = new User({
        username: 'user2',
        name: 'user2',
        password: "user2",
        email: "user2@mailinator.com",
    });

    let admin1 = new User({
        username: 'admin1',
        name: 'admin1',
        password: "admin1",
        email: "admin1@mailinator.com",
        role: "admin",
    });
    let admin2 = new User({
        username: 'admin2',
        name: 'admin2',
        password: "admin2",
        email: "admin2@mailinator.com",
        role: "admin",
    });

    let user3 = new User({
        username: "john",
        name: "john",
        password: "123",
        email: "john@mailinator.com",
        role: "admin",
    });

    let user4 = new User({
        username: "chaton",
        name: "chaton",
        password: "123",
        email: "chaton@mailinator.com",
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
    console.log("Database migrated");
}
