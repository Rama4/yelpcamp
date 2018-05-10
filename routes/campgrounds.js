var express = require("express");
var bp = require("body-parser");
var cloudinary = require('cloudinary'); // for content modereation
var router = express.Router({mergeParams : true});
var campground = require("../modules/campground");
var midw = require("../middleware/index.js"); //index.js is the default file whenever we 'require' something
// so its enough if we just require the folder containing index.js file
// i.e var midw = require("../middleware");
//--------------------------------------------------------------------
var getDate = function(){
  var monthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  date = new Date,  day = date.getDate(), month = monthNames[ date.getMonth() ], year = date.getFullYear();
  return day+"-"+month+"-"+year;
};
//--------------------------------------------------------------------
var moderate = function(img_url,campid)
{
    var notification_url = "https://rama-yelpcamp.herokuapp.com/campgrounds/"+campid+"/moderation";
    console.log("notification_url= "+notification_url);
    cloudinary.uploader.upload(
        img_url,
        function(result)
        { 
            console.log(result);
            if(result.error)
            { console.log("Error while uploading image to cloudinary!"); }
            else
            { console.log("image is uploaded!\npending moderation..."); }
        }, 
        { 
            moderation: "webpurify",
            notification_url: notification_url
        }
    );
}
//--------------------------------------------------------------------

var foo = function(campid, new_camp, callback)
{
    // find camp and compare old img url with new url
    campground.findById(campid).exec(function(err,old_camp)
    {
        if(err){	req.flash("errorArr",err.message);	res.redirect("/campgrounds");	}
        else
        {
            // if change is detected, send it for moderation
            if(old_camp.image != new_camp.image)
                moderate(new_camp.image,campid);
        }    
    });
    callback();
}
//--------------------------------------------------------------------
cloudinary.config({ 
    cloud_name: 'rama4', 
    api_key: process.env.cloudinary_api_key,
    api_secret: process.env.cloudinary_api_secret
  });
//--------------------------------------------------------------------
// index  -> show all campgrounds
router.get("/",function(req,res)
{
    campground.find({},function(err,allcamps)
    {
        if(err)
            console.log(err);
        else
        {
            res.render("campgrounds/index", {camps : allcamps});
        }
    });
});

router.get("/new", midw.isLoggedIn , function(req,res)
{
    res.render("campgrounds/newcamp");
});
//*************************************************************************
// show rout
//*************************************************************************
router.get("/:id",function(req,res)
{   //  populating comments in foundcamp and also upvotes and downvotes for each comment
    campground.findById(req.params.id)  
    .populate({
        path: 'comments',
        populate : {
                        path : 'upvotes',
                        model : 'user'
                  }
    })
    .exec(function(err,foundcamp)
    {
        if(err)
            console.log(err);
        else
        {   //populate upvotes and downvotes in foundcamp
            campground.populate(foundcamp, 
                    {
                        path: 'comments.downvotes',
                        model: 'user',
                    }, function(err, popcamp) {
                        if (err)
                            console.log(err);
                        else
                            res.render("campgrounds/show",{campground : popcamp});   
                    });
        }
    });
    
});
// add a new campground
router.post("/", midw.isLoggedIn ,function(req,res)
{
    var data=req.body.cname;
    var url=req.body.link;
    var desc=req.body.description;
    var rating= "N/A";
    var date = getDate();
    var information = req.body.info;
    var author  = {
      id: req.user._id,
      username : req.user.username
    }
    var newcampground =  {
          name: data ,
          image : url ,
          description : desc,
          author : author,
          date_created : date,
          info : information,
          rating_avg : rating,
          image_approved : false
      }
    campground.create(newcampground ,function(err,campground)
    {
        if(err)
        {
          req.flash("errorArr",err.message);
        }
        else
            {
                req.flash("successArr","New Campground added successfully! Awaiting image moderation..");
                res.redirect("/campgrounds/"+campground._id);
                if(url.length)
                    moderate(url,campground._id);               
            }
    });
});

// Update image moderation status
router.post("/:id/moderation",function(req,res)
{
    console.log("received moderation response!");
    console.log(req.body);
    campground.findById(req.params.id).exec(function(err,camp)
    {
        if(err){	req.flash("errorArr",err.message);	res.redirect("/campgrounds");	}
        else
        {
            if(req.body.moderation_status == 'approved')
            {
                console.log("image for campground:"+req.params.id+" approved!");
                camp.image_approved = true;
                camp.save();
            }
            else
            {
                console.log("Sorry! image for campground:"+req.params.id+" not approved!");
                camp.image_approved = false;
                camp.save();
            }   
            console.log("image for campground:"+req.params.id+"'s status updated in DB!");
        }
    });
});

// EDIT Route
router.get("/:id/edit",midw.checkCampgroundOwnership, function(req,res)
{
  campground.findById(req.params.id, function(err, foundCampground){
      res.render("campgrounds/edit", {campground: foundCampground});
  });
});

// UPDATE Route
router.put("/:id",function(req,res)
{    // find and update the correct campground
    foo(req.params.id, req.body.campground, function()
    {
        campground.findByIdAndUpdate(req.params.id,req.body.campground,function(err,updatedcampground)
        {
        if(err)
        {
            req.flash("errorArr",err.message);
            res.redirect("/campgrounds");
        }
        else
        {  // redirect somewhere
            req.flash("successArr","Campground Updated!");
            res.redirect("/campgrounds/"+req.params.id);
        }
        });
    });
});

// DESTROY Route
router.delete("/:id",midw.checkCampgroundOwnership,function(req,res)
{
  campground.findByIdAndRemove(req.params.id,function(err)
  {
    req.flash("successArr","Campground Deleted!");
    res.redirect("/campgrounds");
  });
});

module.exports = router;

