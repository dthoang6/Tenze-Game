const usersCollection = require("../db").collection("users");

const validator = require("validator");
//Using constructor function to create a reuseable blueprint that we can be used to create user objects.
//We are going to want to be able to leverage this function from within our userController file.

//we are using an object oriented approach with arrow function and this keyword to pointing towards the object that is calling the method.
//the arrow function doesn't change the value of this keyword to point towards the object that called the method.

let User = function (data) {
  this.data = data; //we are taking the data that just got passed in via the parameter and we are storing it (user submit data) within a property that we can access again later.
  /* this.jump = function() {} //this is not an efficient way to create a method for User Object because if we create 5000 objects using this blueprint, js will add this jump method to 5000 objects and it is a lot of duplication. */
  this.errors = [];
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
  if (this.data.password.length > 100) {
    this.errors.push("Password has to be less than 100 characters.");
  }
  if (this.data.username.length > 0 && this.data.username.length < 3) {
    this.errors.push("Username has to be more than 3 characters.");
  }
  if (this.data.username.length > 30) {
    this.errors.push("Username has to be less than 30 characters.");
  }
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
        if (attemptedUser && attemptedUser.password == this.data.password) {
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
  this.cleanUp(); //not allowed to send anything for these value other than a simple string of text, no object, no array.
  //step 1: we would first want to validate user name, email, password value. we want to enforce all of our business login.
  this.validate(); //like we're saying user.validate() because this keyword point toward the user object calling register method in userController. It means this keyword points toward whatever is calling or executing the current function.

  //Step 2: only if there are no validation errors, then save a user data into a database.
  //if the errors array is empty
  if (!this.errors.length) {
    usersCollection.insertOne(this.data); //this.data is an object we want to save into database.
  }
};
module.exports = User;
