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
    .then(function (newId) {
      req.flash("success", "New post successfully created.");
      req.session.save(() => res.redirect(`/post/${newId}`));
    })
    .catch(function (errors) {
      errors.forEach(error => req.flash("errors", error));
      req.session.save(() => res.redirect("/create-post"));
    });
};

exports.viewSingle = async function (req, res) {
  try {
    let post = await Post.findSingleById(req.params.id, req.visitorId);
    res.render("single-post-screen", { post: post, title: post.title }); //we are passing a property of post which is the document from database to pull in data for single post template.
  } catch {
    res.render("404");
  }
};

exports.viewEditScreen = async function (req, res) {
  //we need to ask our post model for the data for this relevant post id so author of the post can update and edit title, body.
  try {
    let post = await Post.findSingleById(req.params.id, req.visitorId);
    if (post.isVisitorOwner) {
      //render an edit screen template with passing post
      res.render("edit-post", { post: post });
    } else {
      res.flash("errors", "You do not have permission to perform that action.");
      req.session.save(() => res.redirect("/"));
    }
  } catch {
    res.render("404");
  }
};

exports.edit = function (req, res) {
  let post = new Post(req.body, req.visitorId, req.params.id);
  post
    .update()
    .then(status => {
      //if the Promise resolve either: the post was successfully updated in the database or it mean the user have permission to edit.
      //even if they have permissions to modify the post, it still didn't successful go through because they may left the title or body blank - validation errors.
      //we need to setup update function to return a status value.
      if (status == "success") {
        //post was updated in db
        //redirect to the same edit screen that just submitted so if user want to edit more with a flash message
        req.flash("success", "Post successfully updated.");
        req.session.save(function () {
          res.redirect(`/post/${req.params.id}/edit`);
        });
      } else {
        //there were validation errors
        //redirect the user back to the same edit screens and show them red error with the validation errors.
        post.errors.forEach(function (error) {
          req.flash("errors", error);
        });
        req.session.save(function () {
          res.redirect(`/post/${req.params.id}/edit`);
        });
      }
    })
    .catch(() => {
      //the update() function Promise reject.
      //if a post with the requested id doesn't exist
      //or if the current visitor is not the owner of the requested post.
      //redirect the user back to the homepage with a red error message
      req.flash("errors", "You do not have permission to perform that action.");
      req.session.save(function () {
        res.redirect("/");
      });
    });
};

exports.delete = function (req, res) {
  Post.delete(req.params.id, req.visitorId)
    .then(() => {
      req.flash("success", "Post successfully deleted.");
      req.session.save(() => {
        res.redirect(`/profile/${req.session.user.username}`);
      });
    })
    .catch(() => {
      req.flash("errors", "You do not have permission to perform that action.");
      req.session.save(() => res.redirect("/"));
    });
};

exports.search = function (req, res) {
  Post.search(req.body.searchTerm)
    .then(posts => {
      res.json(posts);
    })
    .catch(() => {
      res.json([]);
    });
};
