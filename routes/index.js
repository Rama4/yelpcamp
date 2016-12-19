var express = require("express");
var router = express.Router({mergeParams : true});
var passport = require("passport");
var user = require("../modules/user");

router.get("/",function(req,res)
{
  
    res.render("landing");
});

router.get("/googled8dc49fbf79a182d.html",function(req,res)
{
    res.sendFile('googled8dc49fbf79a182d.html');
});

//********************************
//  AUTH routes
router.get("/register",function(req,res)
{
  res.render("register");
});

router.post("/register",function(req,res)
{
  var newuser = new user({username:req.body.username});
  user.register(newuser, req.body.password , function(err,user)
  {
    if(err)
    {
      req.flash("errorArr","That name exists already");
      res.redirect("/register");
    }
    else
    passport.authenticate("local")(req , res , function()
    {
      req.flash("successArr","welcome to yelpcamp, "+user.username);
      res.redirect("/campgrounds");
    });
  });
});

router.get("/login",function(req,res)
{
  res.render("login");
});

router.post("/login" , passport.authenticate("local",
{
  successRedirect: "/campgrounds",
  failureRedirect: "/login"
}) ,
function(req,res)
{ });

router.get("/logout",function (req,res)
{
  req.flash("successArr","You have successfully signed out!");
  req.logout();
  res.redirect("/campgrounds");
});

//*************************************************************************
router.get("*",function(req,res)
{
  res.send("404 page not found");
});

module.exports = router;