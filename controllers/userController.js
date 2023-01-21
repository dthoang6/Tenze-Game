//each of controllers will contain relevant functions for that feature.

//when the node environment sees this code, it's going to make sure that a property named login is added to what's getiing exported from this file.
exports.login = function () {};

exports.logout = function () {};

exports.register = function () {};

exports.home = function (req, res) {
  res.render("home-guest");
};
