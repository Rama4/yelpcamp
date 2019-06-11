var express = require("express");
var router = express.Router({mergeParams : true});
var campground = require("../models/campground");
var Comment = require("../models/comment");
var midw = require("../middleware/index.js"); //index.js is the default file whenever we 'require' something
// so its enough if we just require the folder containing index.js file
// i.e var midw = require("../middleware");
// average calculation function
var calculateAverageRating = function (comm)
{
  if(comm.length==0)
    return 0.0;
  var sum=0.0 , avg = 0.0;
  for(var i=0;i<comm.length;i++)
  {    sum += parseFloat( comm[i].rating_value , 10 );	}// convert string to base 10 float
  avg  = sum / comm.length;
  avg = Math.round(avg*10)/10;
  return avg;
};
// save calculated average rating:
var saveAverageRating = function(req,res)
{
  campground.findById(req.params.id).populate("comments").exec(function(err,camp)
  {
    if(err){	req.flash("errorArr",err.message);	res.redirect("/campgrounds");	}
    else
    {
      var avg = calculateAverageRating(camp.comments);
      camp.rating_avg = avg;
      camp.save(); // save all changes in current campground
    }    
  });
};
var searchId = function(arr,val)
{
  for(var i=0;i<arr.length;i++)
  {    if(arr[i].equals(val))
      {
        return i;
      }
  }
  return -1;
}
var increaseUpvotes = function(req,res)
{
  Comment.findById(req.params.comment_id).exec(function(err,com)
  {
    if(err){	req.flash("errorArr",err.message);	res.redirect("/campgrounds");	}
    else
    {
  		if(searchId(com.upvotes,req.user._id)==-1)
  		{ // add user to that comment's upvotes list
  			com.upvotes.push(req.user);
        // remove user from downvotes list, if they already downvoted the comment
        var index = searchId(com.downvotes,req.user._id);
        if(index!=-1)
          com.downvotes.splice(index,1);
        com.save();
  		}
    }    
  });
};

var decreaseUpvotes = function(req,res)
{
  Comment.findById(req.params.comment_id).exec(function(err,com)
  {
    if(err){	req.flash("errorArr",err.message);	res.redirect("/campgrounds");	}
    else
    { // remove user from that comment's upvotes list
      var index = searchId(com.upvotes,req.user._id);
      if(index!=-1)
      {
        com.upvotes.splice(index,1);
        com.save();
      } 
    }   
  });
};

var increaseDownvotes = function(req,res)
{
  Comment.findById(req.params.comment_id).exec(function(err,com)
  {
    if(err){	req.flash("errorArr",err.message);	res.redirect("/campgrounds");	}
    else
    {
      if(searchId(com.downvotes,req.user._id)==-1)
  		{ // add user to that comment's downvotes list
  			com.downvotes.push(req.user);
        // remove user from upvotes list, if they already upvoted the comment
        var index = searchId(com.upvotes,req.user._id);
        if(index!=-1)
          com.upvotes.splice(index,1);
        com.save();
  		}
    }
  });
};
var decreaseDownvotes = function(req,res)
{
  Comment.findById(req.params.comment_id).exec(function(err,com)
  {
    if(err){	req.flash("errorArr",err.message);	res.redirect("/campgrounds");	}
    else
    { // remove user from that comment's downvotes list
      var index = searchId(com.downvotes,req.user._id);
      if(index!=-1)
      {
        com.downvotes.splice(index,1);
        com.save();
      } 
    }    
  });
};

var getDate = function(){
  var monthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  date = new Date,  day = date.getDate(), month = monthNames[ date.getMonth() ], year = date.getFullYear();
  return day+"-"+month+"-"+year;
  
};
// COMMENTS ROUTES:
//*************************************************************************
//    NEW route
//*************************************************************************
router.get("/new",midw.isLoggedIn,function(req,res)
{
    // find campgrounds by id
    campground.findById(req.params.id,function(err,campground)
    {
        if(err){	req.flash("errorArr",err.message);	res.redirect("/campgrounds");	}
        else {
          res.render("comments/new",{campground: campground});
        }
    });
});

//Comments Create
router.post("/", midw.isLoggedIn ,function(req,res)
{
    // find campgrounds by id and we have to populate with comments in order to calculate avg rating from all comments
    campground.findById( req.params.id ).populate("comments").exec( function(err,camp)  
    {
        if(err){	req.flash("errorArr",err.message);	res.redirect("/campgrounds");	}
        else
        {
            Comment.create(req.body.comment,function(err,com)
            {
              if(err){	req.flash("errorArr",err.message);	res.redirect("/campgrounds");	}
              else{
                    //add username ,id  and date to comment
                    com.author.id = req.user._id;
                    com.author.username = req.user.username;
                    com.date = getDate();
                    //save comment
                    com.save();

                    camp.comments.push(com); // add comment to array of comments in current campground
                    // average rating calculation
                    var avg = calculateAverageRating(camp.comments);
                    console.log(com);
                    camp.rating_avg = avg;
                    camp.save(); // save all changes in current campground
                    req.flash("successArr","Comment Added!");
res.redirect('/campgrounds/' + camp._id);  // redirect after saving
                }
            });
        }
    });
});

//*************************************************************************
//    EDIT route
//*************************************************************************
router.get("/:comment_id/edit",midw.checkCommentOwnership, function(req,res)
{
  Comment.findById(req.params.comment_id, function(err, foundComment){
    if(err){	req.flash("errorArr",err.message);	res.redirect("back");	}
    else
    {
      res.render("comments/edit", {campground_id:req.params.id ,comment: foundComment });}
  });
});

//    UPDATE
router.post("/:comment_id",midw.checkCommentOwnership,function(req,res)
{   // find and update the correct campground
    Comment.findByIdAndUpdate(req.params.comment_id,req.body.comment,function(err,updatedComment)
    {
      if(err){	req.flash("errorArr",err.message);	res.redirect("back");	}
      else
      {  // redirect somewhere
        req.flash("successArr","Comment Updated!");
        saveAverageRating(req,res);
        res.redirect("/campgrounds/" + req.params.id );
      }
    });
});
/*--------------------------------------------------------------------------*/
//  comment upvote and downvote
router.post("/:comment_id/upvote",midw.isLoggedIn,function(req,res)
{
  increaseUpvotes(req,res);
  res.redirect("/campgrounds/"+req.params.id);
});
router.post("/:comment_id/downvote",midw.isLoggedIn,function(req,res)
{
  increaseDownvotes(req,res);
  res.redirect("/campgrounds/"+req.params.id);
});
router.post("/:comment_id/undoupvote",midw.isLoggedIn,function(req,res)
{
  decreaseUpvotes(req,res);
  res.redirect("/campgrounds/"+req.params.id);
});
router.post("/:comment_id/undodownvote",midw.isLoggedIn,function(req,res)
{
  decreaseDownvotes(req,res);
  res.redirect("/campgrounds/"+req.params.id);
});
//*************************************************************************
//    DESTROY route
//*************************************************************************
router.delete("/:comment_id",midw.checkCommentOwnership,function(req,res)
{
  Comment.findByIdAndRemove(req.params.comment_id,function(err)
  {
    req.flash("successArr","Comment Deleted!");
    saveAverageRating(req,res);
    res.redirect("/campgrounds/"+req.params.id);
  });
});

module.exports = router;
