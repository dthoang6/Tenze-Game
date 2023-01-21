const express = require("express");
const app = express();

const router = require("./router"); //require function executes said file immediately, and returns whatever that file exports to variable router to use whenever or whatever we see fit.

app.use(express.static("public")); //public folder: css, js browser files that we want to be accessible by anyone who views our app.
app.set("views", "views"); //a = express option, b is the second views is the folder name, it can be different.
app.set("view engine", "ejs"); //b = tell express which template engine we are using: EJS/Pug/Handlebars

app.use("/", router); //a=which url to use this router for, b = the router that you want to use. Using Router to keep our main file clean and organized.
/* app.get("/", function (req, res) {
  //res.send("Welcome to our complex app.");
  res.render("home-guest");
}); */

app.listen(3000);
