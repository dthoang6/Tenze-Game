const Post = require("../models/Post");
//start exporting functions that the router can call.

exports.viewCreateScreen = function (req, res) {
  res.render("create-post");
};

exports.create = function (req, res) {
  //we will store the title value and body content value into the database
  //any sort of data management should be done with our Model. create a Post Model
  //req.body will contain the form data that a visitor just submitted.
  let post = new Post(req.body, req.session.user._id);
  post
    .create()
    .then(function () {
      res.send("New post created.");
    })
    .catch(function (e) {
      res.send(errors);
    });
};

exports.viewSingle = async function (req, res) {
  try {
    let post = await Post.findSingleById(req.params.id);
    res.render("single-post-screen", { post: post }); //we are passing a property of post which is the document from database to pull in data for single post template.
  } catch {
    res.render("404");
  }
};
