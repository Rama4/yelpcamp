var mongoose = require("mongoose");
var commentschema = mongoose.Schema(
{
    title : String,
    text : String ,
    rating_value : String,
    date: String,
    upvotes : [
      {
        type : mongoose.Schema.Types.ObjectId,
        ref: "user"
      }
    ],
    downvotes : [
      {
        type : mongoose.Schema.Types.ObjectId,
        ref: "user"
      }
    ],
    author : {
              id : {
                      type : mongoose.Schema.Types.ObjectId,
                      ref : "user"
                    },
              username : String
            }
    
});
module.exports = mongoose.model("Comment",commentschema);
