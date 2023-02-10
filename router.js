//build a router for our application: A router has the responsibility of listing out the urls or routes that you want to listen and then say what should happen for each of those routes. understand require function.

//it is the router job to list out all of the urls or routes that we are on the lookout for.

const express = require("express");
const router = express.Router(); //express framework will return a mini application or  a router.
const userController = require("./controllers/userController");
const postController = require("./controllers/postController");
const followController = require("./controllers/followController");

//same like app.get() app.post(). Instead of working with express app, express router.
//it would be better if our router did not have to contain these actual functions and instead could just call said functions that live in a separate file. The router should not store all the logic, function.
//user related routes
router.get("/", userController.home);
router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/logout", userController.logout);

//profile related routes
router.get("/profile/:username", userController.ifUserExists, userController.sharedProfileData, userController.profilePostsScreen);

router.get("/profile/:username/followers", userController.ifUserExists, userController.sharedProfileData, userController.profileFollowersScreen);

router.get("/profile/:username/following", userController.ifUserExists, userController.sharedProfileData, userController.profileFollowingsScreen);

//profile follower routes
router.post("/addFollow/:username", userController.mustBeLoggedIn, followController.addFollow);

router.post("/removeFollow/:username", userController.mustBeLoggedIn, followController.removeFollow);

//post related routes
router.get("/create-post", userController.mustBeLoggedIn, postController.viewCreateScreen);
router.post("/create-post", userController.mustBeLoggedIn, postController.create);

router.get("/post/:id", postController.viewSingle);

router.get("/post/:id/edit", userController.mustBeLoggedIn, postController.viewEditScreen);
router.post("/post/:id/edit", userController.mustBeLoggedIn, postController.edit);
router.post("/post/:id/delete", userController.mustBeLoggedIn, postController.delete);

router.post("/search", postController.search);

module.exports = router; //this is what we make available to any file that require in this file.
