//accessing to database
const postsCollection = require("../db").db().collection("posts");
//we don't need the entire package here, we just need ObjectId constructor function so we can pass it a simple string of text and it will return that as a special object ID object type.
const ObjectId = require("mongodb").ObjectId;
//when our controller uses this constructor function to create an object, we are passing along request body, which is going to be the form data that was just submitted.
let Post = function (data, userId) {
  this.data = data;
  this.errors = []; //when we call validate function, push a message onto this array.
  this.userId = userId;
};

Post.prototype.cleanUp = function () {
  //making sure that both title and the body content values are strings.
  if (typeof this.data.title != "string") {
    this.data.title = "";
  }

  if (typeof this.data.body != "string") {
    this.data.body = "";
  }

  //get rid of any bogus properties.
  this.data = {
    title: this.data.title.trim(),
    body: this.data.body.trim(),
    //this will return a date object representing the current time when this code executes.
    createdDate: new Date(),
    author: ObjectId(this.userId)
  };
};

Post.prototype.validate = function () {
  //make sure neither of these fields are not blank
  if (this.data.title == "") {
    this.errors.push("You must provide a title.");
  }

  if (this.data.body == "") {
    this.errors.push("You must provide post content.");
  }
};

Post.prototype.create = function () {
  return new Promise((resolve, reject) => {
    this.cleanUp();
    this.validate();
    if (!this.errors.length) {
      //save post into database
      //in a situation where trying to coordinate multiple things, use async await with try catch, resolve in if, reject in else
      //in simple situation like this, use then catch, resolve in then, reject in catch
      postsCollection
        .insertOne(this.data)
        .then(() => {
          resolve();
        })
        .catch(() => {
          this.errors.push("Please try again later.");
          reject(this.errors);
        });
    } else {
      reject(this.errors);
    }
  });
};

module.exports = Post;
