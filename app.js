const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const markdown = require("marked");
const csrf = require("csurf");
const sanitizeHTML = require("sanitize-html");
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
  //86: make our markdown function available from within ejs template and use sannitizeHTML
  res.locals.filterUserHTML = function (content) {
    return sanitizeHTML(markdown.parse(content), { allowedTags: ["p", "br", "ul", "ol", "li", "strong", "bold", "italic", "h1", "h2", "h3", "h4", "h5", "h6"], allowedAttributes: [] });
  };
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

//set things up so that any of our requests that modify state will need to have a valid and matching csrf token
app.use(csrf());
//make the RF token available from within our html templates.
app.use(function (req, res, next) {
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use("/", router);

//handle the CSRF attack
app.use(function (err, req, res, next) {
  if (err) {
    if (err.code == "EBADCSRFTOKEN") {
      req.flash("errors", "Cross site request forgery detected.");
      req.session.save(() => res.redirect("/"));
    } else {
      res.render("404");
    }
  }
});
//want the server to power socket connections.
//create a server that is going to use our express app as its handler
const server = require("http").createServer(app);

const io = require("socket.io")(server);

//making our express session data available from within the context of socket IO.
io.use(function (socket, next) {
  sessionOptions(socket.request, socket.request.res, next);
});

//now, instead of telling app to listen, tell server to listen. So it's going to power both express app and socket connection.

//2. when a web browser opens a socket connection with our server,
io.on("connection", function (socket) {
  //the parameter "socket" represent the connection between server and browser
  //a is the event type, this case is chatMessageFromBrowser
  //we are free to create as many different types of events as we want such as exit, run, jump, walk for a game in the browser.
  //when the server detects an event of this type, then we run a function to response to the data the browser send.
  if (socket.request.session.user) {
    let user = socket.request.session.user;
    //send to the current user when they open the chat
    socket.emit("welcome", { username: user.username, avatar: user.avatar });

    socket.on("chatMessageFromBrowser", function (data) {
      //send the message to all user except the author
      socket.broadcast.emit("chatMessageFromServer", { message: sanitizeHTML(data.message, { allowedTags: [], allowedAttributes: [] }), username: user.username, avatar: user.avatar });
    });
  }
});

module.exports = server;
//we are creating an express application under this variable app. But instead of telling it to actually start listening, we're just exporting it from this file.
