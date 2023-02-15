const User = require("../models/User");
const Post = require("../models/Post");
const Follow = require("../models/Follow");
//each of controllers will contain relevant functions for that feature.

//when the node environment sees this code, it's going to make sure that a property named login is added to what's getting exported from this file.

exports.doesUsernameExist = function (req, res) {
  User.findByUsername(req.body.username)
    .then(function () {
      res.json(true);
    })
    .catch(function () {
      res.json(false);
    });
};

exports.doesEmailExist = async function (req, res) {
  let emailBool = await User.doesEmailExist(req.body.email);
  res.json(emailBool);
};

exports.mustBeLoggedIn = function (req, res, next) {
  if (req.session.user) {
    next(); //if a user logged in, we call next() to tell express to call the next function for this route.
  } else {
    //visitor is not logged in
    req.flash("errors", "You must be logged in to perform this action.");
    req.session.save(function () {
      res.redirect("/");
    });
  }
};

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

      req.session.user = { avatar: user.avatar, username: user.data.username, _id: user.data._id }; //when we leveraging session object here, 2 things happened: server is going to store this session data in memory, and the session package is going to send instructions to the web browser to create a cookie.

      //instead of storing session data in memory, let's store it in our mongodb database

      //res.send(result);
      //updating the session in the database is an asynchronous action that's going to take a while to complete.
      //even it save automatically, we manually tell it to save.
      req.session.save(function () {
        res.redirect("/");
      });
    })
    .catch(function (e) {
      //step 17: we perform a redirect if login fail, that's going to be considered a new separate request. Since we redirect to the homepage, our router is going to call our home function at the bottom.
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
  //step 16: because this destroy method is going to have to deal with our database, using promise because we want to be sure that tasks has completed before redirecting them to the home page.
  //we use callback because the session package functions does not return promise yet.
  req.session.destroy(function () {
    res.redirect("/");
  });
};

exports.register = function (req, res) {
  let user = new User(req.body); //creating a new object using reuseable User() blueprint. this keyword is what allows our blueprint to be flexible. It's how we point towards the current object that is going to get created. Pass into it an argument as form field values that user submitted.
  //step 18.3: adjust code because register function will return a Promise we can either use async/await or then().catch()
  user
    .register()
    .then(() => {
      //what we want to do if the registration is successful.
      //instead of sending users to an awkward intermediate screen that just says congrats, we redirect them to the home page, but update their session data so that they're actually logged in.
      req.session.user = { username: user.data.username, avatar: user.avatar, _id: user.data._id };
      req.session.save(function () {
        res.redirect("/");
      });
    })
    .catch(regErrors => {
      //regErrors is the value that the promise rejects with.
      //step 18.1: use the flash package to add these errors into our session data.
      regErrors.forEach(function (error) {
        req.flash("regErrors", error); //create array regErrors and add error into it.
      });
      req.session.save(function () {
        res.redirect("/");
      });
      //now go to home function to adjust to send session data regErrors to html template.
    });
};

exports.home = async function (req, res) {
  //step14: how do we really log a user in using session data?
  if (req.session.user) {
    //step 15: set things up so that if you successfully register, the system automatically logs you in new UI
    //send back the template you want to render, and include any data, message that you want to pass into this template.
    //then we will have a property username available to us from within home-dashboard ejs

    //106: for homepage feed, fetch feed of posts for current user
    let posts = await Post.getFeed(req.session.user._id);

    res.render("home-dashboard", { posts: posts });
  } else {
    //we need to remember the stateless http request runs, our server has no memory to know a login just failed. because we are not always want to show a message.
    //leverage session to know if login fail
    //we want to access that errors data and delete it from the session data base as soon as we've accessed it, which flash package will do it automatically.
    //Then we can leverage the regError message from home-guest because it is unique for home page.
    res.render("home-guest", { regErrors: req.flash("regErrors") });
  }
};

exports.ifUserExists = function (req, res, next) {
  User.findByUsername(req.params.username)
    .then(function (userDocument) {
      /* if our promise resolves with the value of the user document that it found in database that matches the requested username that would get passed into this function as: userDocument */
      //store userDocument in req object so that we can access it in below profilePostsScreen function.
      req.profileUser = userDocument;
      next();
    })
    .catch(function () {
      res.render("404");
    });
};

exports.profilePostsScreen = function (req, res) {
  //ask our Post model for posts by a certain author id
  //Post.findByAuthorId will resolve with a value which is an array of posts.
  Post.findByAuthorId(req.profileUser._id)
    .then(function (posts) {
      //render the profile template and pass the req object with data when ifuserexist above and array of posts .
      res.render("profile", {
        title: `Profile for ${req.profileUser.username}`,
        currentPage: "posts",
        posts: posts,
        profileUsername: req.profileUser.username,
        profileAvatar: req.profileUser.avatar,
        isFollowing: req.isFollowing,
        isVisitorsProfile: req.isVisitorsProfile,
        counts: { postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount }
      });
    })
    .catch(function () {
      reject("404");
    });
};

exports.sharedProfileData = async function (req, res, next) {
  let isVisitorsProfile = false;
  let isFollowing = false;
  if (req.session.user) {
    //setup to hide follow button if you are on your profile
    isVisitorsProfile = req.profileUser._id.equals(req.session.user._id);
    //if the current visitor logged in, ask our follow Model if current visitor follow the profile user or not: true or false?
    isFollowing = await Follow.isVisitorFollowing(req.profileUser._id, req.visitorId);
    //console.log("after calling isVisitorFollowing: " + isFollowing);
  }
  //storing the value into the req object
  //then pass it to profilePostScreen to render it to profile.ejs
  //we can use this true or false value to show either the follow or the stop follow button
  req.isFollowing = isFollowing;
  req.isVisitorsProfile = isVisitorsProfile;

  //105: retrieve post, follower, and following counts
  let postCountPromise = Post.countPostsByAuthor(req.profileUser._id);
  let followerCountPromise = Follow.countFollowersById(req.profileUser._id);
  let followingCountPromise = Follow.countFollowingById(req.profileUser._id);

  //run the Promise for all, and using array destructuring to access the array
  let [postCount, followerCount, followingCount] = await Promise.all([postCountPromise, followerCountPromise, followingCountPromise]);

  req.postCount = postCount;
  req.followerCount = followerCount;
  req.followingCount = followingCount;

  next();
};

exports.profileFollowersScreen = async function (req, res) {
  try {
    //call the function to return an array of users that are following the current users
    //then render to our template
    let followers = await Follow.getFollowersById(req.profileUser._id);
    //console.log(followers);

    res.render("profile-followers", {
      currentPage: "followers",
      followers: followers,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isVisitorsProfile: req.isVisitorsProfile,
      counts: { postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount }
    });
  } catch {
    res.render("404");
  }
};

exports.profileFollowingsScreen = async function (req, res) {
  try {
    //call the function to return an array of users that are following the current users
    //then render to our template
    let followings = await Follow.getFollowingsById(req.profileUser._id);
    //console.log(followers);

    res.render("profile-following", {
      currentPage: "followings",
      followings: followings,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isVisitorsProfile: req.isVisitorsProfile,
      counts: { postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount }
    });
  } catch {
    res.render("404");
  }
};
