//NPM package modules
//==========================
var exp = require("express"),
    app = exp(),
    mongoose = require("mongoose"),
    request = require("request"),
    bp = require("body-parser"),
    passport = require("passport"),
    flash = require("connect-flash"),
    LocalStrategy = require("passport-local"),
    nodemailer = require('nodemailer'),
    bcrypt = require('bcrypt-nodejs'),
    async = require('async'),
    crypto = require('crypto'),
    methodoverride = require("method-override");
    
//============================================================

//models
//============================================================

    var campground = require("./modules/campground"),
     Comment = require("./modules/comment"),
     user = require("./modules/user"),
     seedDB = require("./views/seeds");
// seedDB(); // exported from seeds.js
//============================================================

//exported Routes
//============================================================
    
    var campgroundroutes = require("./routes/campgrounds"),
        commentroutes = require("./routes/comments"),
        indexroutes = require("./routes/index");
//============================================================

//Add mongoose and connect our DB
// environment variable for database url (safety purpose : to prevent users from deleting others' data )
var url = process.env.DATABASEURL || 'mongodb://localhost/yelp_camp';
mongoose.connect(url);



//Express Settings
//============================================================
//Parses data input inside the body
app.use(bp.urlencoded({extended:true}));

//serve contents of the home page
app.set("view engine","ejs");
app.use(exp.static(__dirname + '/public'));
app.use(methodoverride("_method"));   // new
app.use(flash());
//============================================================


//Passport Configuration
//============================================================
app.use(require("express-session")(
  {
    secret : "kabali neruppu da magizhchi",
    resave : false,
    saveUninitialized : false
  }));

app.use(passport.initialize());
app.use(passport.session());

/*  Without Passport local mongoose we will have define our own methods to authenticate a user,
so these code below are ready to use methods that comes inside of the box while using passport local mongoose.
we are creating a new LocalStrategy using the User.authenticate method  */
passport.use(new LocalStrategy(user.authenticate())); 
passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());
//============================================================


//Middleware Settings
//============================================================
//  global variables
app.use(function(req , res , next)
{
  res.locals.currentuser = req.user;
  res.locals.errorArr = req.flash("errorArr");
  res.locals.successArr = req.flash("successArr");
  next(); // very inportant!
});
//============================================================

//Use imports from routes folder
//============================================================
//with this we don't need to append /campgrounds into following paths i.e /campgrounds/new or /campgrounds/:id
app.use("/campgrounds/:id/comments",commentroutes);
app.use("/campgrounds",campgroundroutes);
app.use("/",indexroutes);

//============================================================

// app.listen(process.env.PORT,process.env.IP,function()
app.listen(3000,"127.0.0.1",function()
{
    console.log("sever started!");
});
module.exports = app;
