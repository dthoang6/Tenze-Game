//accessing to database
const postsCollection = require("../db").db().collection("posts");
const User = require("./User");
//we don't need the entire package here, we just need ObjectId constructor function so we can pass it a simple string of text and it will return that as a special object ID object type.
const ObjectId = require("mongodb").ObjectId;
const sanitizeHTML = require("sanitize-html");
//when our post controller uses this constructor function to create a post object, we are passing along request body, which is going to be the form data that was just submitted.
let Post = function (data, userId, requestedPostId) {
  this.data = data;
  this.errors = []; //when we call validate function, push a message onto this array.
  this.userId = userId;
  this.requestedPostId = requestedPostId;
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
    title: sanitizeHTML(this.data.title.trim(), { allowedTags: [], allowedAttributes: [] }),
    body: sanitizeHTML(this.data.body.trim(), { allowedTags: [], allowedAttributes: [] }),
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
        .then(info => {
          resolve(info.insertedId); //resolve with information about the database action that just took place.
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

Post.prototype.update = function () {
  return new Promise(async (resolve, reject) => {
    //find the relevant post document in db
    try {
      let post = await Post.findSingleById(this.requestedPostId, this.userId);
      if (post.isVisitorOwner) {
        //actually update the db, can write code here but should write a separate function for organization
        let status = await this.actuallyUpdate(); //resolve with success or failure
        resolve(status);
      } else {
        reject();
      }
    } catch {
      reject();
    }
  });
};

Post.prototype.actuallyUpdate = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanUp();
    this.validate();
    if (!this.errors.length) {
      await postsCollection.findOneAndUpdate({ _id: new ObjectId(this.requestedPostId) }, { $set: { title: this.data.title, body: this.data.body } });
      resolve("success");
    } else {
      resolve("failure");
    }
  });
};

//the findSingleById and findByAuthorId is similar except the match operation post Id vs author id. So we going to create a new function "reusablePostQuery" to void duplication.
Post.reusablePostQuery = function (uniqueOperations, visitorId) {
  return new Promise(async function (resolve, reject) {
    //take the only unique parts and then add on the shared parts.
    let aggOperations = uniqueOperations.concat([
      //perform a match by requested id from controller
      //{ $match: { _id: new ObjectId(id) } },
      //lookup User document from Post document, and the current post item that we want to perform that match on is the author field which contain the author id.
      //the lookup operation will add the new property authorDocument which is an "array of 1 object" with the value from user document to the return object.
      { $lookup: { from: "users", localField: "author", foreignField: "_id", as: "authorDocument" } },
      //the project allows us to include what fields we want on what we return. We want author property to be an object of user document from authorDocument array of 1 object.
      {
        $project: {
          title: 1,
          body: 1,
          createdDate: 1,
          //81: makeup this property to have the original author value.
          authorId: "$author",
          //passed into html template, we would want the author property to be an object with username, avatar.
          author: { $arrayElemAt: ["$authorDocument", 0] }
        }
      }
    ]);
    let posts = await postsCollection.aggregate(aggOperations).toArray();
    //clean up author property in each post object
    posts = posts.map(function (post) {
      //81: add a new property visitorOwner with the value of true or false after comparison
      post.isVisitorOwner = post.authorId.equals(visitorId);
      //override author object because we do not want password property.
      post.author = {
        username: post.author.username,
        avatar: new User(post.author, true).avatar //getAvatar is true
      };
      return post;
    });
    resolve(posts);
  });
};

Post.findSingleById = function (id, visitorId) {
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
    let posts = await Post.reusablePostQuery([{ $match: { _id: new ObjectId(id) } }], visitorId);
    //if successful find post
    if (posts.length) {
      console.log(posts[0]);
      resolve(posts[0]); //return the first item in the posts array.
    } else {
      reject(posts);
    }
  });
};

//looks in the database for a match where posts have a certain based on author ID: users._id is posts.author
Post.findByAuthorId = function (authorId) {
  //we ar ok with returning an empty array of posts.
  //use reusablePostQuery to return the promise
  //so our controller still working with the return promise if controller call findByAuthorId
  return Post.reusablePostQuery([
    {
      $match: { author: authorId }
    },
    { $sort: { createdDate: -1 } }
  ]);
};

Post.delete = function (postIdToDelete, currentUserId) {
  return new Promise(async (resolve, reject) => {
    try {
      //console.log(postIdToDelete);
      //console.log(currentUserId);
      let post = await Post.findSingleById(postIdToDelete, currentUserId);
      if (post.isVisitorOwner) {
        //start working with our object that represent the db
        await postsCollection.deleteOne({ _id: new ObjectId(postIdToDelete) });
        resolve();
      } else {
        //someone is not author try to delete
        reject();
      }
    } catch {
      //the post id is not valid or the post doesn't exist
      reject();
    }
  });
};

module.exports = Post;
