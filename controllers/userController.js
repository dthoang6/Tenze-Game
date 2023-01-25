const User = require("../models/User");

//each of controllers will contain relevant functions for that feature.

//when the node environment sees this code, it's going to make sure that a property named login is added to what's getting exported from this file.
exports.login = function (req, res) {
  let user = new User(req.body);
  //how to know if user login has correct username and password
  //we're not exactly sure when to send back our response. We don't know how long this login method is going to take because it's working with the database.
  //the question becomes within our controller here, how can we wait until login has had a chance to do its job and then send back our response to the browser?
  //traditional approach vs modern best practice approach
  /* //traditional approach: callback function
  user.login(function (result) {
    //when we define the login function, we are waiting until the perfect moment to call this function.
    //In other words, we know that this function is not going to run until the appropriate moment once the database action has had a chance to complete.
    //result is what we are passing in when callback.
    res.send(result);
  }); */
  //using promise
  //the login method will return a promise object, how to use it?
  user
    .login()
    .then(function (result) {
      res.send(result);
    })
    .catch(function (e) {
      res.send(e);
    });
};

exports.logout = function () {};

exports.register = function (req, res) {
  let user = new User(req.body); //creating a new object using reuseable User() blueprint. this keyword is what allows our blueprint to be flexible. It's how we point towards the current object that is going to get created. Pass into it an argument as form field values that user submitted.
  user.register();
  //when it comes to conditions within an if statement, any number larger than zero evaluates to true
  //in the future set up this login in models.
  if (user.errors.length) {
    res.send(user.errors);
  } else {
    res.send("There are no errors.");
  }
};

exports.home = function (req, res) {
  res.render("home-guest");
};
