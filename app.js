const express = require("express");
const app = express();

const router = require("./router"); //require function executes said file immediately, and returns whatever that file exports to variable router to use whenever or whatever we see fit.
//accepting the two most common ways of submitting data on the web.
app.use(express.urlencoded({ extended: false })); //1. traditional html form submit, tell express to add the user submitted data onto our request object. Then we can access it from request body.
app.use(express.json()); //2. sending JSON data

app.use(express.static("public")); //public folder: css, js browser files that we want to be accessible by anyone who views our app.
app.set("views", "views"); //a = express option, b is the second views is the folder name, it can be different.
app.set("view engine", "ejs"); //b = tell express which template engine we are using: EJS/Pug/Handlebars

app.use("/", router); //a=which url to use this router for, b = the router that you want to use. Using Router to keep our main file clean and organized.
/* app.get("/", function (req, res) {
  //res.send("Welcome to our complex app.");
  res.render("home-guest");
}); */

/* app.listen(3000);
 */

module.exports = app;
//we are creating an express application under this variable app. But instead of telling it to actually start listening, we're just exporting it from this file.
