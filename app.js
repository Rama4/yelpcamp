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
    methodoverride = require("method-override"),
    cookieSession  = require('cookie-session'),
    dotenv = require('dotenv').config(); // for managing environment variables stored in .env file
    
//============================================================

//models
//============================================================

    var campground = require("./models/campground"),
     Comment = require("./models/comment"),
     user = require("./models/user"),
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
mongoose.Promise = global.Promise;
mongoose.set('debug', false);
// fix deprecation warnings
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

mongoose.connect(url, (err) => {
  if(err) console.log("Error occurred while connecting to DB:", err);
  else  console.log("DB connected successfully!");
});



//Express Settings
//============================================================
//Parses data input inside the body
app.use(bp.urlencoded({extended:true}));
app.use(bp.json());

//serve contents of the home page
app.set("view engine","ejs");
app.use(exp.static(__dirname + '/public'));
app.use(methodoverride("_method"));   // new
app.use(flash());
//============================================================


//Passport Configuration
//============================================================
app.use(cookieSession({
    name: 'session',
    keys: [process.env.COOKIE_KEY],
    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }))


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

//Run the server
//============================================================
const port = process.env.PORT || 3000;
const ip = process.env.IP || "0.0.0.0";

// app.listen(3000,"localhost",function()
app.listen(port, ip, function()
{
    console.log(`Server running at http://${ip}:${port}`);
});
module.exports = app;