var express = require("express");
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
// index  -> show all campgrounds
router.get("/",function(req,res)
{
    campground.find({},function(err,allcamps)
    {
        if(err)
            console.log(err);
        else
            res.render("campgrounds/index",{camps:allcamps});
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
{
    campground.findById(req.params.id).populate("comments").exec(function(err,foundcampground)
    {
        if(err)
            console.log(err);
        else
        {
            res.render("campgrounds/show",{campground : foundcampground});
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
          rating_avg : rating
      }
    campground.create(newcampground ,function(err,campground)
    {
        if(err)
        {
          req.flash("errorArr",err.message);
        }
        else
            {
                req.flash("successArr","New Campground added successfully!");
                res.redirect("/campgrounds/"+campground._id);
                    
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
