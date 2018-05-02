var mongoose = require("mongoose");
// schema setup
var campschema = new mongoose.Schema(
{
    name : String,
    image : String,
    description : String,
    rating_avg : String,
    date_created : String,
    info : [String],
    image_approved : Boolean,
    author : {
        id : {
            type : mongoose.Schema.Types.ObjectId,
            ref: "user" //same as the 1st param in mongoose.model() used in userschema
          },
         username: String
    },
    comments : [
      {
        type : mongoose.Schema.Types.ObjectId,
        ref: "Comment" //same the 1st param in mongoose.model() used in commentschema
      }
    ]
});
//model setup
module.exports = mongoose.model("campground",campschema);
