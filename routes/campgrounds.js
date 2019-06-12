var express = require("express");
var bp = require("body-parser");
var cloudinary = require('cloudinary'); // for content modereation
var router = express.Router({mergeParams : true});
var campground = require("../models/campground");
var midw = require("../middleware/index.js"); //index.js is the default file whenever we 'require' something
// so its enough if we just require the folder containing index.js file
// i.e var midw = require("../middleware");
//--------------------------------------------------------------------
cloudinary.config({ 
    cloud_name: process.env.cloudinary_name, 
    api_key: process.env.cloudinary_api_key,
    api_secret: process.env.cloudinary_api_secret
  });
//--------------------------------------------------------------------
var getDate = function(){
  var monthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  date = new Date,  day = date.getDate(), month = monthNames[ date.getMonth() ], year = date.getFullYear();
  return day+"-"+month+"-"+year;
};
//--------------------------------------------------------------------
var moderate_updated_image = function(campid, new_camp, callback)
{
    // find camp and compare old img url with new url
    campground.findById(campid).exec(function(err,old_camp)
    {
        if(err){	req.flash("errorArr",err.message);	res.redirect("/campgrounds");	}
        else
        {
            // if change is detected, send it for moderation, and save changes to the original campground
            if(old_camp.image != new_camp.image)
                moderate_image(new_camp, function(moderated_camp)
                {
                    callback(moderated_camp);
                });
            else
                callback(new_camp);
        }    
    });
}
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
// show route
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
        {    
            if (err.name && err.name == 'CastError')
            {
                if(err.message) console.log(err.message);
                console.log("Campground not found!");    
                res.status(404).send("Campground not found!");
            }
            else
            {    
                console.log(err);
                res.status(500).send("Sorry! an error occurred!");
            }
        }
        else if(!foundcamp)
        {    
            console.log("Campground not found!");
            res.status(404).send("Campground not found!");
        }
        else
        {   //populate upvotes and downvotes in foundcamp
            campground.populate(foundcamp, 
                    {
                        path: 'comments.downvotes',
                        model: 'user',
                    }, function(err, popcamp) {
                        if (err)
                        {   
                            console.log(err);
                            res.status(500).send("Sorry! an error occurred!");
                        }
                        else
                            res.render("campgrounds/show",{camp : popcamp});   
                    });
        }
    });
    
});

function moderate_image(camp, callback)
{
    if(camp.image)
    {
        if(process.env.MODERATION_ENABLED === "true")
        {
            console.log("mod enabled");
            cloudinary.v2.uploader.upload( camp.image, { moderation: "aws_rek" }, function(err, result)
            { 
                if(err)
                { 
                    console.log("Error while moderating image: ", err);
                    callback(camp);
                }
                else
                {
                    console.log("Moderation result:", result);
                    if(result.moderation && result.moderation.length > 0)
                    {
                        let verdict = result.moderation[0].status;
                        camp.image_approved = verdict === "approved";
                        callback(camp);
                    }
                    else
                    {
                        console.log("Wrong format of Moderation response.. Rejecting image..")
                        camp.image_approved = false;
                        callback(camp);
                    }
                }
            });
        }
        else
        {
            console.log("Moderation disabled! Image will be shown!");
            camp.image_approved = true;
            callback(camp);
        }
    }
    else
    {
        console.log("No image specified!");
        // remove "image_approved" key from campground, so no need to display moderation result
        camp.image_approved = false;
        callback(camp);
    }
}

// add a new campground
router.post("/", midw.isLoggedIn ,function(req,res)
{
    var newcampground =  {
        name: req.body.cname ,
        image : req.body.link,
        description : req.body.description,
        author : {
            id: req.user._id,
            username : req.user.username
        },
        date_created : getDate(),
        info : req.body.info,
        rating_avg : "N/A",
      }
      
    if(newcampground.image.length)
    {
        moderate_image(newcampground, function(moderated_camp)
        {
            campground.create(moderated_camp ,function(err,campground)
            {
                if(err)
                {
                req.flash("errorArr",err.message);
                }
                else
                {
                    req.flash("successArr","New Campground added successfully! Awaiting image moderation..");
                    res.redirect("/campgrounds/"+campground._id);
                }
            });
        });
    }
    else
    {
        campground.create(newcampground ,function(err, created_camp)
        {
            if(err)
            {
            req.flash("errorArr",err.message);
            }
            else
            {
                req.flash("successArr","New Campground added successfully! Awaiting image moderation..");
                res.redirect("/campgrounds/"+created_camp._id);
            }
        });
    }
});

// EDIT Route
router.get("/:id/edit",midw.checkCampgroundOwnership, function(req,res)
{
  campground.findById(req.params.id, function(err, foundCampground){
      res.render("campgrounds/edit", {campground: foundCampground});
  });
});

// UPDATE Route
router.put("/:id", function(req,res)
{    // find and update the correct campground
    moderate_updated_image(req.params.id, req.body.campground, function(moderated_camp)
    {
        campground.findByIdAndUpdate(req.params.id, moderated_camp, function(err)
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

