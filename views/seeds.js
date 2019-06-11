var mongoose = require("mongoose") ,
campground = require("../models/campground"),
Comment = require("../models/comment");

var data = [
  {
  	name : "Saidapet",
  	image : "https://farm6.staticflickr.com/5181/5641024448_04fefbb64d.jpg",
  	rating_avg : "3.5",
  	info:["chennai" , "20" , "Pay telephone,Boating,Playground,Fishing,Firewood","may-jul" ],
  	description : "Ithu saidapet machi! adyar river oda karaila summa gummu nu our camp.Andha Adyar river oda vaasana unga vaila noraiya kalappividum. you will enjoy it.",
    author: { username: "qq", id: "584525da0125cba6149372f8" }
  },
  {
  	name : "Mutthukadu",
  	image : "https://farm4.staticflickr.com/3273/2602356334_20fbb23543.jpg",
  	description : "night time la motta madila jolly a thoongalam, stars a paakalam! ",
  	info:["chennai" , "10" , "Pay telephone,Boating,Fishing,Firewood","may-jul" ],
  	rating_avg : "3.5",
    author: { username: "qq", id: "584525da0125cba6149372f8" }
  },
  {
    name : "Jack sparrow beach",
    image : "https://farm4.staticflickr.com/3872/14435096036_39db8f04bc.jpg",
    rating_avg : "3.5",
    info:["chennai" , "15" , "Pay telephone,Fishing,Firewood","may-jul" ],
    description : "Beach machi! be wary of the big waves that can toss your camp. camp somewhere relatively safer, and you will have a unique camping experience.",
    author: { username: "qq", id: "584525da0125cba6149372f8" }
  },
  {
  	name : "Trolltunga",
  	image : "http://4.bp.blogspot.com/-wqgmokoCBzk/UdwlPIPgX-I/AAAAAAAAQo4/6cf3BdML9Mc/s1600/4875969703_b3ab59956a_b+%25281%2529.jpg",
  	rating_avg : "3.5",
  	info:["Norway" , "40" , "Pay telephone,Boating,Fishing,Firewood","may-jul" ],
  	description: "This awesome campsite sits at the top of an overhanging cliff.This isn't a place for the faint hearted , But if you can take the risk, it will be an unforgettable experience.",
    author: { username: "qq", id: "584525da0125cba6149372f8" }
  },
  {
  	name : "Deccan chargers",
  	image : "https://farm3.staticflickr.com/2353/2069978635_2eb8b33cd4.jpg",
  	rating_avg : "3.5",
  	info:["Hyderabad" , "25" , "Pay telephone,Playground,Emergency Services","may-jul" ],
  	description : "just outside the city of hyderabad , this place is well known as an awesome camping site.The days are hot and the nights are cool. The overall experience is blissful and pleasant.",
    author: { username: "qq", id: "584525da0125cba6149372f8" }
  },
  {
  	name :"chennai",
  	image : "https://farm3.staticflickr.com/2353/2069978635_2eb8b33cd4.jpg",
  	rating_avg : "3.5",
  	info:["Hyderabad" , "25" , "Pay telephone,Playground,Emergency Services","may-jul" ],
  	description : "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident,sunt in culpa qui officia deserunt mollit anim id est laborum.",
    author: { username: "qq", id: "584525da0125cba6149372f8" }
  }
];

function seedDB()
{

  // remove all campgrounds
  campground.deleteMany({}, function(err)
  {

      if(err)
        console.log("error");
        // add a few campgrounds
      else
      {
        for(var i=0;i<data.length;i++)
        {
          campground.create(data[i],function(err,data)
          {
            if(err)
              console.log(err);
            else
              Comment.create(
              {
                  title: "good!",
                  text: "This place is great.It is full of serenity and peace.",
                  rating_value:"3.5",
                  author: { username: "qq", id: "584525da0125cba6149372f8" },
                  date: "04-dec-2016"
              },
              function(err,com)
              {
                if(err)
                  console.log(err);
                else
                {
                  data.comments.push(com);
                  data.save();
                  console.log("created a new comment!" + com+"\n");
                }
              }
            );
          });
        }
      }
    });
}







module.exports = seedDB;
