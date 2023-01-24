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
User.prototype.validate = function () {
  if (this.data.username == "") {
    this.errors.push("You must provide a username.");
  }
  if (this.data.email == "") {
    this.errors.push("You must provide a valid email address.");
  }
  if (this.data.password == "") {
    this.errors.push("You must provide a password.");
  }
};
User.prototype.register = function () {
  //step 1: we would first want to validate user name, email, password value. we want to enforce all of our business login.
  this.validate(); //like we're saying user.validate() because this keyword point toward the user object calling register method in userController. It means this keyword points toward whatever is calling or executing the current function.

  //Step 2: only if there are no validation errors, then save a user data into a database.
};
module.exports = User;
