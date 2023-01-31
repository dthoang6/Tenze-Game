//accessing to database
const postsCollection = require("../db").db().collection("posts");
const User = require("./User");
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

//We can leverage the Post either as a constructor function from an OOP perspective or we can just simply call a simple function on it by adding a function as a properties to Post object.
//we add properties 'findSingleById' as a function to a Post constructor function because JS function is an object.
Post.findSingleById = function (id) {
  return new Promise(async function (resolve, reject) {
    //make sure the requested id is not an injection attack or the incoming id is not a valid mongo db object id.
    if (typeof id != "string" || !ObjectId.isValid(id)) {
      reject();
      return; //prevent any further action
    }
    /* //75, 76 looking for post in database
    let post = await postsCollection.findOne({ _id: new ObjectId(id) }); */
    //77: performing lookup in mongodb to find post author from user document based on author id of post document.
    //aggregate is great to perform complex or multiple operations by giving an array of database operation as input.
    //it's going to return an array of posts even it is only one item which is a Promise from mongo database
    let posts = await postsCollection
      .aggregate([
        //perform a match by requested id from controller
        { $match: { _id: new ObjectId(id) } },
        //lookup User document from Post document, and the current post item that we want to perform that match on is the author field which contain the author id.
        //the lookup operation will add the new property authorDocument which is an "array of 1 object" with the value from user document to the return object.
        { $lookup: { from: "users", localField: "author", foreignField: "_id", as: "authorDocument" } },
        //the project allows us to include what fields we want on what we return. We want author property to be an object of user document from authorDocument array of 1 object.
        {
          $project: {
            title: 1,
            body: 1,
            createdDate: 1,
            //passed into html template, we would want the author property to be an object with username, avatar.
            author: { $arrayElemAt: ["$authorDocument", 0] }
          }
        }
      ])
      .toArray();
    //clean up author property in each post object
    posts = posts.map(function (post) {
      //override author object because we do not want password property.
      post.author = {
        username: post.author.username,
        avatar: new User(post.author, true).avatar //getAvatar is true
      };
      return post;
    });
    //if successful find post
    if (posts.length) {
      console.log(posts[0]);
      resolve(posts[0]); //return the first item in the posts array.
    } else {
      reject(posts);
    }
  });
};

module.exports = Post;
