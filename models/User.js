const usersCollection = require("../db").db().collection("users");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const md5 = require("md5");

//Using constructor function to create a reuseable blueprint that we can be used to create user objects.
//We are going to want to be able to leverage this function from within our userController file.

//we are using an object oriented approach with arrow function and this keyword to pointing towards the object that is calling the method.
//the arrow function doesn't change the value of this keyword to point towards the object that called the method.

let User = function (data, getAvatar) {
  this.data = data;
  this.errors = [];
  if (getAvatar == undefined) {
    getAvatar == false;
  }
  if (getAvatar) {
    this.getAvatar();
  }
};
//using prototype to create register method, JS will not need to create a copy of this method once for each new object. Instead, any object created using this constructor function will simply have access to this method which is much more efficient.
User.prototype.cleanUp = function () {
  if (typeof this.data.username != "string") {
    this.data.username = "";
  }
  if (typeof this.data.email != "string") {
    this.data.email = "";
  }
  if (typeof this.data.password != "string") {
    this.data.password = "";
  }

  //get rid of any bogus properties, purifying our data property
  this.data = {
    username: this.data.username.trim().toLowerCase(), //the trim method to trim empty white space.
    email: this.data.email.trim().toLowerCase(),
    password: this.data.password
  };
};

User.prototype.validate = function () {
  return new Promise(async (resolve, reject) => {
    //convert anonymous function to arrow function

    if (this.data.username == "") {
      this.errors.push("You must provide a username.");
    }
    //if the user type something and if it is alphanumeric, we would want to check for the opposite.
    if (this.data.username != "" && !validator.isAlphanumeric(this.data.username)) {
      this.errors.push("username can only contain letters and numbers.");
    }
    //using a validator package to check email: using ! to check for the opposite because we only want to push this error if what the user typed is not a valid email.
    if (!validator.isEmail(this.data.email)) {
      this.errors.push("You must provide a valid email address.");
    }
    if (this.data.password == "") {
      this.errors.push("You must provide a password.");
    }
    if (this.data.password.length > 0 && this.data.password.length < 12) {
      this.errors.push("Password has to be more than 12 characters.");
    }
    if (this.data.password.length > 50) {
      this.errors.push("Password has to be less than 50 characters.");
    }
    if (this.data.username.length > 0 && this.data.username.length < 3) {
      this.errors.push("Username has to be more than 3 characters.");
    }
    if (this.data.username.length > 30) {
      this.errors.push("Username has to be less than 30 characters.");
    }

    //step 18.2 Only if username is valid then check to see if its already taken
    if (this.data.username.length > 2 && this.data.username.length < 31 && validator.isAlphanumeric(this.data.username)) {
      let usernameExists = await usersCollection.findOne({ username: this.data.username });
      //if the mongodb can find a matching document, this promise will resolve to usernameExists an object that represents a document.
      //if mongodb can not find a matching document, this promise will resolve a null, for if statement null == false
      if (usernameExists) {
        this.errors.push("That username is already taken.");
      }
    }
    //step 18.2: for email check
    if (validator.isEmail(this.data.email)) {
      let emailExists = await usersCollection.findOne({ email: this.data.email });
      //if the mongodb can find a matching document, this promise will resolve to usernameExists an object that represents a document.
      //if mongodb can not find a matching document, this promise will resolve a null, for if statement null == false
      if (emailExists) {
        this.errors.push("That email is already being use.");
      }
    }
    //step 18.3 call resolve to signify that this operation or promise has actually completed.
    resolve();
  });
};

User.prototype.login = function () {
  //when we calling this login function from within our userController, this function will return a promise object. We want to pass into it a function.
  return new Promise((resolve, reject) => {
    //within the body of this function, we can perform asynchronous operations or operations that are going to take sometime to complete.
    //and then when whenever those actions are complete, we just call resolve or reject.
    //We let js know that this promise has either completed in the case of resolve or fail in the case of reject.
    this.cleanUp();
    //lookup data from database using findOne method and we are trying to find a document where the username property is matching with whatever the user just type in login form.
    //we will provide a function that findOne is going to call once the read operation has had a chance to complete
    //when the findOne method calls our callback function, because it's not an object directly calling our function. JS is actually going to consider the global object to be what's calling our function. It's going to set this.data.password in traditional anonymous function to our lowercase user object that we created from our blueprint not this User object.

    //callback method: Instead of providing a traditional anonymous function, we provide an arrow function here. It will not manipulate or change the this keyword.
    //promise method: all of the mongodb methods return a promise so we will use promise instead of call back to read database. Convert callback to promise
    usersCollection
      .findOne({ username: this.data.username })
      .then(attemptedUser => {
        //if mongo db does find a user that matches our condition,, it's going to pass that document as this parameter attemptedUser into our function.
        //let see if the attemptedUser is exist at all and password is true
        //take care of the situation where the database operation completes successfully.
        //step 13: using bcrypt package to compare the password
        if (attemptedUser && bcrypt.compareSync(this.data.password, attemptedUser.password)) {
          //step 19: pull in the user avatar
          //we need to grab the associated email with that user account from the database.
          this.data = attemptedUser;
          this.getAvatar();
          resolve("Congrats!");
        } else {
          reject("Invalid username or password.");
        }
      })
      .catch(function () {
        //database error or unexpected error
        //generic error, something wrong with the server
        //the mongodb method fails, it has nothing to do with the user typing.
        //error on our side as a developer
        reject("Please try again later.");
      });
  });
};

User.prototype.register = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanUp(); //not allowed to send anything for these value other than a simple string of text, no object, no array.
    //step 1: we would first want to validate user name, email, password value. we want to enforce all of our business login.

    //in step 18.2 we adjust validate function to async function,(step 18.3) so we need to adjust our validate function to return a promise and then we can await that promise down here in the register function

    //step 18.3 we add await when calling validate function, so now all of our validation checks will actually complete before the the step 2 code run down here. And again, we can only use the word await in async function, so add it to register function.

    await this.validate(); //like we're saying user.validate() because this keyword point toward the user object calling register method in userController. It means this keyword points toward whatever is calling or executing the current function.

    //Step 2: only if there are no validation errors, then save a user data into a database.
    //if the errors array is empty
    if (!this.errors.length) {
      //step 13: hash user password with 2 steps process with bcryptjs package
      let salt = bcrypt.genSaltSync(10);
      this.data.password = bcrypt.hashSync(this.data.password, salt);
      //make sure this database action complete
      await usersCollection.insertOne(this.data); //this.data is an object we want to save into database.
      //step 19: pull in the user avatar
      this.getAvatar(); //we call it after the database action because we don't want to store the avatar in the database permanently.
      resolve();
    } else {
      //if the else code run, that mean there were errors.
      //call reject and reject with our array of errors.
      reject(this.errors);
    }
  });
};

User.prototype.getAvatar = function () {
  this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`;
};

//our controller will pass in whatever username is at the end of the url.
User.findByUsername = function (username) {
  return new Promise(function (resolve, reject) {
    //check the username
    if (typeof username != "string") {
      reject();
      return;
    }
    //perform findOne database operation
    usersCollection
      .findOne({ username: username })
      .then(function (userDoc) {
        //if a mongo operation is successful and resolves well, it would resolve with the data it found, so we can receive it within these then function parentheses "userDoc".
        if (userDoc) {
          //customize the user document to not leak out or expose data link password
          //we taking the raw data userDoc to create a new user document by passing 2 parameters: raw data, and getAvatar
          userDoc = new User(userDoc, true);
          //pass only 3 properties
          userDoc = {
            _id: userDoc.data._id,
            username: userDoc.data.username,
            avatar: userDoc.avatar
          };
          resolve(userDoc);
          //when we resolve, we want to resolve with a userDoc value, and our controller will save this value onto the request object so that we can use it later to display the profile to find posts written by the user.
        } else {
          reject();
        }
      })
      .catch(function () {
        //if the mongo db method rejects, that does not mean it couldn't find a matching document. That means it ran into some sort of error.
        reject("404");
      });
  });
};

User.doesEmailExist = function (email) {
  return new Promise(async function (resolve, reject) {
    if (typeof email != "string") {
      resolve(false);
      return;
    }

    let user = await usersCollection.findOne({ email: email });
    if (user) {
      resolve(true);
    } else {
      resolve(false);
    }
  });
};

module.exports = User;
