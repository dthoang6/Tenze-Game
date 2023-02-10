const Follow = require("../models/Follow");

exports.addFollow = function (req, res) {
  //pass in the username of the user you want to follow
  //pass in the user by using session data, who want to follow
  let follow = new Follow(req.params.username, req.visitorId);

  follow
    .create()
    .then(() => {
      req.flash("success", `Successfully followed ${req.params.username}`);
      req.session.save(() => res.redirect(`/profile/${req.params.username}`));
    })
    .catch(errors => {
      errors.forEach(error => {
        req.flash("errors", error);
      });
      req.session.save(() => res.redirect("/"));
    });
};

exports.removeFollow = function (req, res) {
  //pass in the username of the user you want to follow
  //pass in the user by using session data, who want to follow
  let follow = new Follow(req.params.username, req.visitorId);

  follow
    .delete()
    .then(() => {
      req.flash("success", `Successfully followed ${req.params.username}`);
      req.session.save(() => res.redirect(`/profile/${req.params.username}`));
    })
    .catch(errors => {
      errors.forEach(error => {
        req.flash("errors", error);
      });
      req.session.save(() => res.redirect("/"));
    });
};
