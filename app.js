var express = require("express");
var methodOverride = require("method-override");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");

var passport = require("passport");
var LocalStrategy = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");



var app = express();

console.log("goodmorning Morioh Cho");

app.use(require("express-session")({
	secret: "bruh moment",
	resave: false,
	saveUninitialized: false
}));

app.use(function(req, res, next)
{
	res.locals.currentUser = req.user;
	next();
})

app.use(methodOverride('_method'));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect("mongodb://localhost/pics_db");



app.get("/", function(req, res)
{
	res.render("landing.ejs");		
})

app.listen(process.env.port || "3000", process.env.ip, function()
{
	console.log("listening");	
	
})

app.get("/pics", isLoggedIn , function(req, res)
{
	var user = req.user;
	pics.find({}, function(err, data){
		if (err)
		{
			console.log("error loading")	
		}
		else
		{
			res.render("index.ejs", {pics: data, currentUser: user});
		}
	});
	
});

app.post("/pics", function(req, res)
{
	console.log(req.body);
	var title = req.body.title;
	var url = req.body.URL;
	var Descrip = req.body.description;
	
	var author = {
		id: req.user._id,
		username: req.user.username
	}
	
	
	createNewObj(title, url, Descrip, author);
	res.redirect("/pics");
	
});

app.get("/pics/:id", function(req, res)
{
	pics.findById(req.params.id, function(err, data)
	{
		if (err == true)
		{
			console.log("id not found");
		}
		else
		{
			console.log(data.author.id.equals(req.user._id))
			console.log(req.isAuthenticated())
			
			if (req.isAuthenticated() && (data.author.id.equals(req.user._id)))
			{
				console.log("true")
				res.render("show.ejs", {pics:data, isOwner:true });
				

			}
			else
			{
				console.log("false")
				res.render("show.ejs", {pics:data, isOwner:false });

			}
		}
	});
	
});

app.get("/pics/:id/edit", checkOwnership, function(req, res){
	
	pics.findById(req.params.id, function(err, data)
	{
		if (err == true)
		{
			console.log("id not found");
		}
		else
		{
			
			res.render("edit.ejs", {pics:data});
		}
	});

});

app.put("/pics/:id", checkOwnership, function(req, res){
	
	pics.findByIdAndUpdate(req.params.id, req.body.pics, function(err, updatedInfo){
		
		if (err)
		{
			console.log(err);
			
		}
		else
		{
			res.redirect("/pics/");
		}
		
	})
	
})

app.delete("/pics/:id", checkOwnership, function(req, res){
	
	pics.findByIdAndRemove(req.params.id, function(err){
		
		if (err)
		{
			console.log(err);
			res.redirect("/pics");
		}
		else
		{
			res.redirect("/pics")
		}
	})
	
})



app.get("/register", function(req, res){
	res.render("register.ejs");
})


app.post("/register", function(req, res){
	
	console.log(req.body);
	var username = req.body.username;
	var password = req.body.password;
	
	User.register(new User({username: username}), password, function(err, user){
		if (err == true)
		{
			console.log(err);
			return res.render("register.ejs");
		}
		else
		{
			passport.authenticate("local")(req, res, function()
			{
				res.redirect("/pics");
				console.log("yay");
			})
		}
		
	})
});

app.get("/login", function(req, res){
	
	res.render("login.ejs");
})

app.post("/login", passport.authenticate("local", {
	successRedirect: "/pics",
	failureRedirect: "/login"
	}), function(req, res){	
});

app.get("/logout", function(req, res){
	req.logout();
	res.redirect("/");

});



var picsSchema = mongoose.Schema({

title: String,
URL: String,
description: String,
author:{
	id:{
		type: mongoose.Schema.Types.ObjectId,
		ref:"User"
	},
	username: String,
},
});
var pics = mongoose.model("pics", picsSchema);


var loginSchema = mongoose.Schema({
	username: String,
	password: String
});

loginSchema.plugin(passportLocalMongoose);
var User = mongoose.model("User", loginSchema);
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


function createNewObj(_title, _URL, _descrip, _author)
{
	var obj = new pics({
		
		title: _title,
		URL: _URL,
		description: _descrip,
		author: _author
		
	});
	
	obj.save(errCallBack);
	
	return obj;
}

function errCallBack(err, done)
{
	if(err == true)
	{
		console.log("failed to save/find");			
	}
	else
	{
		console.log(done + " was sucessfully saved/found");
	}
}

function isLoggedIn(req, res, next){
	if(req.isAuthenticated())
	{	
		return next();
	}
	
	res.redirect("/login");
}

function checkOwnership(req, res, next)
{
	if (req.isAuthenticated())
	{
		pics.findById(req.params.id, function(err, pics){
			if (err){
				res.redirect("back");
			}
			else
			{
				if (pics.author.id.equals(req.user.id)){
					next();
				}
				else
				{
					res.redirect("back");
				}
			}
		})
	}
	else
	{
		res.redirect("back");
	}
	
}


