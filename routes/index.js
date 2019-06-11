var express = require("express");
var router = express.Router({mergeParams : true});
var passport = require("passport");
var midw = require("../middleware/index.js"); //index.js is the default file whenever we 'require' something
var user = require("../models/user");
var campground = require("../models/campground");
var bcrypt = require('bcrypt-nodejs'),
    async = require('async'),
    crypto = require('crypto');
var helper = require('sendgrid').mail;
//----------------------------------------------------------------------------------------------------------------    
var getratings=function(req,res)
{
  campground.find().exec(function(err,allcamps)
  {
    if(err)
    {
      req.flash("errorArr",err.message);
      res.redirect("/");
    }
    else
    {
      for(var i=0;i<allcamps.length;i++)
        if(allcamps[i].rating_avg=="N/A")
          allcamps[i].rating_avg = -1;
        allcamps.sort(function(a, b) {
          return parseFloat(b.rating_avg,10) - parseFloat(a.rating_avg,10);
        });
        var s = allcamps;
        return s;
    }
  });
} ;
//----------------------------------------------------------------------------------------------------------------    
    
router.get("/",function(req,res)
{
    res.render("land");
});

router.get("/googled8dc49fbf79a182d.html",function(req,res)
{
    res.sendFile('googled8dc49fbf79a182d.html');
});
router.get("/about",function(req,res)
{
  res.render("about");
});
router.get("/tips",function(req,res)
{
  res.render("tips");
});
router.get("/favorites",function(req,res)
{
  var camparr = getratings(req,res);
  console.log(camparr);
  res.render("favorites",{camps : camparr});
});
router.get("/profiles/:username",function(req,res)
{
  user.findOne({ username: req.params.username }, function(err, user)
  {
    if (!user) {
      req.flash('errorArr',"user not found!");
      res.redirect('/campgrounds');
      
    }
    else
    {
      campground.find().populate("comments").exec(function(err,allcamps){
        if(err)
              console.log(err);
        else
        {
          campground.find({"author.username":req.params.username}).populate("comments").exec(function(err,foundcampground)
          {
            if(err)
                console.log(err);
            else
            {
                    res.render("profile",{user:user , camps:foundcampground, allcamps:allcamps});        
            }
          });
        }
      });
    }
  });
});

//********************************
//  AUTH routes
router.get("/register",function(req,res)
{
  res.render("register");
});

router.post("/register",function(req,res)
{
  var newuser = new user(
    {
      username : req.body.username,
      email : req.body.email,
      resetPasswordToken : undefined,
      resetPasswordExpires : undefined
    });
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

router.get("/login/1",function(req,res)
{
    req.flash("successArr","Welcome To Yelpcamp!");
    res.redirect("/campgrounds");
});

router.get("/login/2",function(req,res)
{
    req.flash("errorArr","Wrong Username/Password!");
    res.redirect("/login");
});

router.get("/login",function(req,res)
{
  res.render("login");
});

router.post("/login" , passport.authenticate("local",
{
  successRedirect: "/login/1",
  failureRedirect: "/login/2"
}) ,
function(req,res)
{ });

router.get("/logout",function (req,res)
{
  req.flash("successArr","You have successfully signed out!");
  req.logout();
  res.redirect("/campgrounds");
});
// CHANGE PASSWORD
router.get("/change-password", midw.isLoggedIn ,function(req,res)
{
  res.render('change-password');
});

router.post("/change-password",function(req,res)
{
  user.findById(req.user._id).exec(function(err,person)
  {
    if(err)
    {
      req.flash("errorArr",err.message);
      res.redirect("/campgrounds");
    }
    else
    {
      if(req.body.password  == req.body.confirm)
        { // if both passwords match, then store new password, else redirect
          person.setPassword(req.body.password,function()
          {
            person.save();
            req.flash("successArr","Password Changed Successfully!");
            res.redirect("/campgrounds");
          });
        }
        else
        { 
          req.flash("errorArr","Password was not changed because they did not match");
          res.redirect('/campgrounds');  
        }
    }
  });
});


// FORGOT PASSWORD
router.get("/forgot",function(req,res)
{
 res.render("forgot"); 
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      user.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('errorArr', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        user.save(function(err) { done(err, token, user); });
      });
    },
    function(token, user, done) 
    {
      // using SendGrid's v3 Node.js Library
      // https://github.com/sendgrid/sendgrid-nodejs
      var from_email = new helper.Email("rama41296@gmail.com"),
      to_email = new helper.Email(user.email),
      subject = "Forgot Password - yelpcamp",
      content = new helper.Content("text/plain",'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
      					'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
      					'http://' + req.headers.host + '/reset/' + token + '\n\n' +
      					'If you did not request this, please ignore this email and your password will remain unchanged.\n' ),
      mail = new helper.Mail(from_email, subject, to_email, content);
      var sg = require('sendgrid')(process.env.SENDGRIDAPIKEY);
      var request = sg.emptyRequest({
        method: 'POST',
        path: '/v3/mail/send',
        body: mail.toJSON()
      });
      
      sg.API(request, function(error, response)
      {/*console.log(response.statusCode)
        console.log(response.body)
        console.log(response.headers)*/
        req.flash('successArr', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
      	res.redirect('/campgrounds');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

// RESET PASSWORD

router.get('/reset/:token', function(req, res) {
  user.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('errorArr', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {
      user: req.user,
      token : req.params.token
    });
  });
});

router.post('/reset/:token', function(req, res) 
{
  async.waterfall([
    function(done) {
      user.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('errorArr', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password  == req.body.confirm)
        { // if both passwords match, then store new password, else redirect
          user.setPassword(req.body.password,function()
          {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            user.save(function(err)
            {
              req.logIn(user, function(err){  done(err, user);  });
            });
          });
        }
        else
        { res.redirect('/reset/:token');  }
  
      });
    },
    function(user, done) 
    {
      // using SendGrid's v3 Node.js Library
      // https://github.com/sendgrid/sendgrid-nodejs
      var from_email = new helper.Email("rama41296@gmail.com"),
      to_email = new helper.Email(user.email),
      subject = "Forgot Password - yelpcamp",
      content = new helper.Content("text/plain",'Hello,\n\n' +
          'This is a confirmation that the password for your account \"' + user.username+'\" <'+user.email+ '> has just been changed.\n' ),
      mail = new helper.Mail(from_email, subject, to_email, content);
      
      var sg = require('sendgrid')(process.env.SENDGRIDAPIKEY);
      var request = sg.emptyRequest({
        method: 'POST',
        path: '/v3/mail/send',
        body: mail.toJSON()
      });
      
      sg.API(request, function(error, response)
      {/*console.log(response.statusCode)
        console.log(response.body)
        console.log(response.headers)*/
        req.flash('successArr', 'Password Changed Successfully!');
        res.redirect('/campgrounds');
      });   
            
    }
  ], function(err) {
    res.redirect('/');
  });
});

//*************************************************************************
router.get("*",function(req,res)
{
  res.send("404 page not found");
});

module.exports = router;