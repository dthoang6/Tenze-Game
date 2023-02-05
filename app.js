const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const app = express();

//configure options how we want to use sessions
let sessionOptions = session({
  secret: "JavaScript is so cool",
  //by default the session data store at server memory, override to store it to mongodb
  store: MongoStore.create({ client: require("./db") }),
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24, httpOnly: true }
});
app.use(sessionOptions);
app.use(flash()); //add flash feature to our application

//72.  when we say app.use, we are telling express to run this function for every request. It means that we now have access to a user property from within any of our ejs templates.
app.use(function (req, res, next) {
  //make all error and success flash messages available from all templates.
  //so we don't need to manually pass that data into our templates within all of our post controllers.
  res.locals.errors = req.flash("errors");
  res.locals.success = req.flash("success");

  //81: make current user id available on the req object. visitorID is a new property we make to hold the user id and add to session.
  //so now, no matter which control or function we're in, we can access to the visitorId property on the request object.
  if (req.session.user) {
    req.visitorId = req.session.user._id;
  } else {
    req.visitorId = 0;
  }

  //we are now working with an object that will be available from within our ejs templates so we can add any objects or properties we want onto this locals object.
  //make user session data available from within view templates
  res.locals.user = req.session.user;
  next(); //and then since we are calling next, express will move on to run the actual relevant functions for a particular route.
});

const router = require("./router"); //require function executes said file immediately, and returns whatever that file exports to variable router to use whenever or whatever we see fit.
//accepting the two most common ways of submitting data on the web.
app.use(express.urlencoded({ extended: false })); //1. traditional html form submit, tell express to add the user submitted data onto our request object. Then we can access it from request body.
app.use(express.json()); //2. sending JSON data

app.use(express.static("public")); //public folder: css, js browser files that we want to be accessible by anyone who views our app.
app.set("views", "views"); //a = express option, b is the second views is the folder name, it can be different.
app.set("view engine", "ejs"); //b = tell express which template engine we are using: EJS/Pug/Handlebars

app.use("/", router);

//a=which url to use this router for, b = the router that you want to use. Using Router to keep our main file clean and organized.
/* app.get("/", function (req, res) {
  //res.send("Welcome to our complex app.");
  res.render("home-guest");
}); */

/* app.listen(3000);
 */

module.exports = app;
//we are creating an express application under this variable app. But instead of telling it to actually start listening, we're just exporting it from this file.
