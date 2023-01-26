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
      //step 14: setup session to trust subsequent request
      //our request object now has new session object that is unique per browser visitor.
      //add the new property 'user or any name' onto the session object

      //now, we can store any information we want and that will be specific or unique to this one visitor or web browser.
      //the whole idea of a session is that it allows us to have some sort of persistent data from one request to another, meaning our server is going to remember this session data.

      req.session.user = { username: user.data.username }; //when we leveraging session object here, 2 things happened: server is going to store this session data in memory, and the session package is going to send instructions to the web browser to create a cookie.

      //instead of storing session data in memory, let's store it in our mongodb database

      //res.send(result);
      //updating the session in the database is an asynchronous action that's going to take a while to complete.
      //even it save automatically, we manually tell it to save.
      req.session.save(function () {
        res.redirect("/");
      });
    })
    .catch(function (e) {
      //we perform a redirect if login fail, that's going to be considered a new separate request. Since we redirect to the homepage, our router is going to call our home function at the bottom.
      //leverage flash message package
      //a=name of a collection or an array of messages that we want to start building or adding on to.
      //b=actual message that you want to add to collection or array, which is e because that's the value that our promise is going to reject with and passed into the function.

      req.flash("errors", e); //look into our session to add a property flash and errors array req.session.flash.errors = [e]
      req.session.save(function () {
        res.redirect("/");
      });
    });
};

exports.logout = function (req, res) {
  //because this destroy method is going to have to deal with our database, using promise because we want to be sure that tasks has completed before redirecting them to the home page.
  //we use callback because the session package functions does not return promise yet.

  req.session.destroy(function () {
    res.redirect("/");
  });
};

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
  //step14: how do we really log a user in using session data?
  if (req.session.user) {
    //step 15: set things up so that if you successfully register, the system automatically logs you in new UI
    //send back the template you want to render, and include any data, message that you want to pass into this template.
    //then we will have a property username available to us from within home-dashboard ejs
    res.render("home-dashboard", { username: req.session.user.username });
  } else {
    //we need to remember the stateless http request runs, our server has no memory to know a login just failed. because we are not always want to show a message.
    //leverage session to know if login fail
    res.render("home-guest");
  }
};
