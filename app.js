//Set up requirements
var express = require("express");
var logger = require('morgan');
var Request = require('request');
var bodyParser = require('body-parser');
var _ = require('underscore');

//Create an 'express' object
var app = express();

//Set up the views directory
app.set("views", __dirname + '/views');
//Set EJS as templating language WITH html as an extension
app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');
//Add connection to the public folder for css & js files
app.use(express.static(__dirname + '/public'));

// Enable json body parsing of application/json
app.use(bodyParser.json());

/*-----
ROUTES
-----*/

//Main Page Route - NO data
app.get("/", function(req, res){
	var dataForThePage = {
		message: "or search their other info by adding /[legislator last name] to the URL",
		search: false
	};
	res.render('index', dataForThePage);
});

//Main Page Route - WITH data requested via the client
// RIGHT NOW THIS DOES THE SAVE PART TO THE DB BUT DOES NOT SHOW INFO ON THE PAGE
app.get("/:word", function(req, res){
	var currentWord = req.params.word;
	var dataForThePage = {
		message: currentWord,
		search: true
	};
	res.render('index', dataForThePage);
});

//JSON Serving route - showing results for Legislators by last name
app.get("/api/legislator/:word", function(req, res){
	//CORS enable this route - http://enable-cors.org/server.html
	res.header('Access-Control-Allow-Origin', "*");
	var currentWord = req.params.word;
	var requestURL = "https://congress.api.sunlightfoundation.com/legislators?last_name=" + currentWord + "&apikey=2508688383dd474eb9bcdde603d6ef0c";
	Request(requestURL, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			//console.log(body);
			var theData = JSON.parse(body);
			//congressID = theData.results[0].sponsor_id;
			console.log(theData);
			console.log('HERE!');
			//send all the data
			res.json(theData);
		}
	});
});


//JSON Serving route
// RIGHT NOW THIS IS TAKING CID ***
app.get("/api/funders/:id", function(req, res){
	//CORS enable this route - http://enable-cors.org/server.html
	res.header('Access-Control-Allow-Origin', "*");
	var CID = req.params.id;
	var requestURL = "https://www.opensecrets.org/api/?method=candContrib&output=json&cid=" + CID + "&cycle=2016&apikey=65e4886ce9fca3667c87871a1de0e799" ;
	Request(requestURL, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			//console.log(body);
			var theData = JSON.parse(body);
			//congressID = theData.results[0].sponsor_id;
			console.log(theData);
			console.log('HERE!');
			//send all the data
			res.json(theData);
		}
	});
});

//SAVE an object to the SUNLIGHT db
app.post("/sundata/save", function(req,res){
	console.log("A POST!!!!");
	//Get the data from the body
	var data = req.body;
	console.log('HI JASMINE - SUNLIGHT');
	console.log(data);

	//Send the data to the db
	Request.post({
		url: keys.cloudant_sun_URL,
		auth: {
			user: keys.cloudant_sun_KEY,
			pass: keys.cloudant_sun_PASSWORD
		},
		json: true,
		body: {timeStamp: new Date(),
				sunData: data}
	},
	function (error, response, body){
		if (response.statusCode == 201){
			console.log("Saved!");
			res.json(body);
		}
		else{
			console.log("Uh oh...");
			console.log("Error: " + res.statusCode);
			res.send("Something went wrong...");
		}
	});
});

//SAVE an object to the OPEN SECRETS db
app.post("/opensec/save", function(req,res){
	console.log("A POST!!!!");
	//Get the data from the body
	var data = req.body;
	console.log('HI JASMINE - OPEN SECRETS');
	//console.log(data);

	//Send the data to the db
	Request.post({
		url: keys.cloudant_open_URL,
		auth: {
			user: keys.cloudant_open_KEY,
			pass: keys.cloudant_open_PASSWORD
		},
		json: true,
		body: {timeStamp: new Date(),
				openData: data}
	},
	function (error, response, body){
		if (response.statusCode == 201){
			console.log("Saved!");
			res.json(body);
		}
		else{
			console.log("Uh oh...");
			console.log("Error: " + res.statusCode);
			res.send("Something went wrong...");
		}
	});
});

//JSON Serving route - ALL Sunlight Data
app.get("/api/legislator", function(req,res){
	console.log('Making a db request for all entries');
	//Use the Request lib to GET the data in the CouchDB on Cloudant
	Request.get({
		url: keys.cloudant_sun_URL+"/_all_docs?include_docs=true",
		auth: {
			user: keys.cloudant_sun_KEY,
			pass: keys.cloudant_sun_PASSWORD
		},
		json: true
	},
	function (error, response, body){
		var theRows = body.rows;
		//Send the data
		res.json(theRows);
	});
});


//JSON Serving route - Find a legislator
app.get("/api/legislator/:word", function(req, res){
	var currentWord = req.params.word;
	console.log('Making a db request for: ' + currentWord);
	//Use the Request lib to GET the data in the CouchDB on Cloudant
	Request.get({
		url: keys.cloudant_sun_URL+"/_all_docs?include_docs=true",
		auth: {
			user: keys.cloudant_sun_KEY,
			pass: keys.cloudant_sun_PASSWORD
		},
		json: true
	},
	function (error, response, body){
		var theRows = body.rows;
		//Filter the results to match the current word
		console.log(theRows);
		var filteredRows = theRows.filter(function (d) {
			console.log(d.doc);
			console.log(d.doc.sunglightData);
			return d.doc.sunData.results[0].last_name == currentWord;
		});
		res.json(filteredRows);
	});
});

//JSON Serving route for Youtube
app.get("/api/youtube/:word", function(req, res){
	//CORS enable this route - http://enable-cors.org/server.html
	res.header('Access-Control-Allow-Origin', "*");
	var currentWord = req.params.word;
	var requestURL = "https://www.googleapis.com/youtube/v3/search?part=snippet&q=" + currentWord + "&type=video%20&key=AIzaSyB7mNx5dGknxiIvRAZ3al7Qge88EXeNPmc";
	Request(requestURL, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var theData = JSON.parse(body);
			console.log(theData);
			console.log('HERE!');
			//send all the data
			res.json(theData);
		}
	});
});


//Catch All Route
app.get("*", function(req, res){
	res.send('Sorry, nothing doing here.');
});

//Start the server -- HEROKU :)
var port = process.env.PORT || 3000;
app.listen(port);
console.log('Express started on port' + port);
