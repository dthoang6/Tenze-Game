const User = require("../models/User");

//each of controllers will contain relevant functions for that feature.

//when the node environment sees this code, it's going to make sure that a property named login is added to what's getting exported from this file.
exports.login = function () {};

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
