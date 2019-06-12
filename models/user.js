var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");
var userschema = new mongoose.Schema(
  {
      username : String,
      email : String,
      resetPasswordToken:Object,
      resetPasswordExpires:Object,
      password : String
  });
/*
Using Passport-Local Mongoose:
  First you need to plugin Passport-Local Mongoose into your User schema
  You're free to define your User how you like. Passport-Local Mongoose will add a username, hash and salt field to store the username, the hashed password and the salt value.
  Additionally Passport-Local Mongoose adds some methods to your Schema. 
*/ 
userschema.plugin(passportLocalMongoose);

module.exports = mongoose.model("user",userschema);