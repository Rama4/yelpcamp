var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");
var userschema = new mongoose.Schema(
  {
      username : String,
      password : String
  });
// add passport(authentication) functionality to schema
userschema.plugin(passportLocalMongoose);
module.exports = mongoose.model("user",userschema);
