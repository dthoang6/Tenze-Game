//build a router for our application: A router has the responsibility of listing out the urls or routes that you want to listen and then say what should happen for each of those routes. understand require function.

//it is the router job to list out all of the urls or routes that we are on the lookout for.

const express = require("express");
const router = express.Router(); //express framework will return a mini application or  a router.
const userController = require("./controllers/userController");

//same like app.get() app.post(). Instead of working with express app, express router.
//it would be better if our router did not have to contain these actual functions and instead could just call said functions that live in a separate file. The router should not store all the logic, function.
router.get("/", userController.home);
router.post("/register", userController.register);
router.post("/login", userController.login);

module.exports = router; //this is what we make available to any file that require in this file.
