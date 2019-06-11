var campground = require("../models/campground");
var Comment = require("../models/comment");
var mo = {};


//  ->  All the middleware functions below can be reused , saving code in many files

mo.checkCampgroundOwnership = function(req, res, next)
{
  if(req.isAuthenticated()) // is the user logged in?
  {   // find the current campground
      campground.findById(req.params.id, function(err, foundCampground)
      {
             if(err)
             {
               req.flash("errorArr",err.message);
               res.redirect("back");
             }
             else
                // does user own the campground?
                  if(foundCampground.author.id.equals(req.user._id) || req.user.username === "ADMIN")  // main-line
                {
                    next();
                }
                else
                {
                    req.flash("errorArr","User Does Not Own campground!");
                    res.redirect("back");
                }
      });
  }
  else
  {
   req.flash("errorArr", "You need to be logged in to do that");
   res.redirect("back");
  }
}

mo.checkCommentOwnership = function (req, res, next)
{
  if(req.isAuthenticated()) // is the user logged in?
  {
      Comment.findById(req.params.comment_id, function(err, foundComment) // find the comment
      {
             if(err)
             {
                 req.flash("errorArr",err.message);
                 res.redirect("back");
             }
             else
                 // does user own the comment?
              if(foundComment.author.id.equals(req.user._id) || req.user.username === "ADMIN")  // main-line
                    next();
                 else
                 {
                   req.flash("errorArr","User Does Not Own Comment");
                   res.redirect("back");
                 }
      });
  }
  else
  {
        req.flash("errorArr", "You need to be logged in to do that");
        res.redirect("back");
  }
}

mo.isLoggedIn = function (req , res , next)
{
    if(req.isAuthenticated())
      return next();
    req.flash("errorArr","You need to be logged in to do that");
    res.redirect("/login");
};

module.exports = mo;
