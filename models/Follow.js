const usersCollection = require("../db").db().collection("users");
const followsCollection = require("../db").db().collection("follows");
const User = require("./User");
const ObjectId = require("mongodb").ObjectId;

let Follow = function (followedUsername, authorId) {
  this.followedUsername = followedUsername;
  this.authorId = authorId;
  this.errors = [];
};

Follow.prototype.cleanUp = function () {
  if (typeof this.followedUsername != "string") {
    this.followedUsername = "";
  }
};

Follow.prototype.validate = async function (action) {
  //followedUsername must exist in database
  let followedAccount = await usersCollection.findOne({ username: this.followedUsername });
  console.log("followed Account info: " + followedAccount._id);
  if (followedAccount) {
    //if we do find a matching account based on that username, let's store the ID of that document because username is not permanent.
    this.followedId = followedAccount._id;
  } else {
    this.errors.push("You cannot follow a user that does not exist.");
  }

  //check if follow already or not to follow and stop following
  let doesFollowAlreadyExist = await followsCollection.findOne({ followedId: this.followedId, authorId: new ObjectId(this.authorId) });

  if (action == "create") {
    //if create we want to make sure the follow matching these two IDs does not exist.
    if (doesFollowAlreadyExist) {
      this.errors.push("You are already follow this user.");
    }
  }
  if (action == "delete") {
    //not be able to stop following or remove a follow from someone you're not already following.
    if (!doesFollowAlreadyExist) {
      this.errors.push("You cannot stop following someone you have not follow.");
    }
  }

  //should not be allowed to follow yourself
  if (this.followedId.equals(this.authorId)) {
    this.errors.push("You can not follow yourself.");
  }
};

Follow.prototype.create = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanUp();
    await this.validate("create");
    if (!this.errors.length) {
      //no errors, store data to db
      await followsCollection.insertOne({ followedId: this.followedId, authorId: new ObjectId(this.authorId) });
      resolve();
    } else {
      reject(this.errors);
    }
  });
};

Follow.prototype.delete = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanUp();
    await this.validate("delete");
    if (!this.errors.length) {
      //no errors, store data to db
      await followsCollection.deleteOne({ followedId: this.followedId, authorId: new ObjectId(this.authorId) });
      resolve();
    } else {
      reject(this.errors);
    }
  });
};

Follow.isVisitorFollowing = async function (followedId, visitorId) {
  let followDoc = await followsCollection.findOne({ followedId: followedId, authorId: new ObjectId(visitorId) });
  //console.log("check if exist in db: " + followDoc);
  //console.log("followedId: " + followedId);
  //console.log("visitorId: " + visitorId);

  if (followDoc) {
    return true;
  } else {
    return false;
  }
};

Follow.getFollowersById = function (id) {
  return new Promise(async (resolve, reject) => {
    try {
      //using aggregate to provide an array of object of db operations
      let followers = await followsCollection
        .aggregate([
          //this operation is going to find any matching follow documents
          { $match: { followedId: id } },
          //then we need to use the authorId to look up the related users document for email, username to show to Followers template
          { $lookup: { from: "users", localField: "authorId", foreignField: "_id", as: "userDoc" } },
          {
            $project: {
              //only include username and email of followers
              username: { $arrayElemAt: ["$userDoc.username", 0] },
              email: { $arrayElemAt: ["$userDoc.email", 0] }
            }
          }
        ])
        .toArray();

      //followers is an array, and each item in the array will be an object that has properties, username and email of the person that's following the current profile user.
      //modified the followers array to get an avatar
      followers = followers.map(follower => {
        //create a user using User Model to get avatar based on email.
        let user = new User(follower, true);
        return { username: follower.username, avatar: user.avatar };
      });

      resolve(followers);
    } catch {
      reject();
    }
  });
};

Follow.getFollowingsById = function (id) {
  return new Promise(async (resolve, reject) => {
    try {
      //should update followers to followings
      let followers = await followsCollection
        .aggregate([
          //this operation is going to find any matching follow documents
          { $match: { authorId: id } },
          //then we need to use the authorId to look up the related users document for email, username to show to Followers template
          { $lookup: { from: "users", localField: "followedId", foreignField: "_id", as: "userDoc" } },
          {
            $project: {
              //only include username and email of followers
              username: { $arrayElemAt: ["$userDoc.username", 0] },
              email: { $arrayElemAt: ["$userDoc.email", 0] }
            }
          }
        ])
        .toArray();

      followers = followers.map(follower => {
        //create a user using User Model to get avatar based on email.
        let user = new User(follower, true);
        return { username: follower.username, avatar: user.avatar };
      });

      resolve(followers);
    } catch {
      reject();
    }
  });
};

Follow.countFollowersById = function (id) {
  return new Promise(async (resolve, reject) => {
    let followerCount = await followsCollection.countDocuments({ followedId: id });
    resolve(followerCount);
  });
};

Follow.countFollowingById = function (id) {
  return new Promise(async (resolve, reject) => {
    let followingCount = await followsCollection.countDocuments({ authorId: id });
    resolve(followingCount);
  });
};

module.exports = Follow;
