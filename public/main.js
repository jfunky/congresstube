function makeHTML(sunlightObj){
	$('#legis-container').html('');
	var theHTML = "<br>";

	for (var i=0; i<sunlightObj.length; i++){

		var start_date = sunlightObj[i].term_start.substr(5,2) + "-" + sunlightObj[i].term_start.substr(8,2) + "-" +
			sunlightObj[i].term_start.substr(0,4);
		var end_date = sunlightObj[i].term_end.substr(5,2) + "-" + sunlightObj[i].term_end.substr(8,2) + "-" +
			sunlightObj[i].term_end.substr(0,4);
		var name = sunlightObj[i].title + " " + sunlightObj[i].first_name + " " +
			sunlightObj[i].last_name + ", " + sunlightObj[i].party;
		var state = sunlightObj[i].state_name ;
		var website = sunlightObj[i].website ;

		theHTML += "<a href='" + website + "'>" + name + " </a><p>" + "State: " + state + "<br> <br>" + "Term start: " + start_date  + "<br>" +
			"Term end: " + end_date + "</p> <br> <br> <br>" ;
	}

	return theHTML;
}

function funderHTML(openSecretsObj){
	$('#funder-container').html('');
	var funderHTML = "<h2> Top Funders </h2> <ol>";

	for (var i=0; i<openSecretsObj.length; i++){

		var funder_name = openSecretsObj[i]['@attributes'].org_name;
		var total_contributed = openSecretsObj[i]['@attributes'].total;

		funderHTML += "<li>" + funder_name + "   $" + total_contributed + "</li>" ;
	}

	funderHTML += "</ol>";

	return funderHTML;
}

function drawPie(contributors){
	var width = 960,
	  height = 500,
	  radius = Math.min(width, height) / 2;
}

function showVideo(youtubeData){

	var videoMarkup = '<iframe width="560" height="315" src="https://www.youtube.com/embed/' + youtubeData +
	'" frameborder="50" allowfullscreen></iframe>' ;

	console.log(videoMarkup);

	$('#legis-video').append(videoMarkup);
}

function youtubeSearch(id){

	$.ajax({
		url: '/api/youtube/' + id,
		type: 'GET',
		dataType: 'json',
		error: function(err){
			console.log(err);
		},
		success: function(data){
			console.log("Got the youtube data.");
			console.log(data);

			//grab first video
			var firstVideo = data.items[0].id.videoId ;
			console.log(firstVideo);
			showVideo(firstVideo);
		}
	});
}

// OPEN SECRETS 
function saveOpenData(obj){
	$.ajax({
		url: '/opensec/save',
		type: 'POST',
		contentType: 'application/json',
		data: JSON.stringify(obj),
		error: function(resp){
			console.log("Oh no... (open secrets data)");
			console.log(resp);
		},
		success: function(resp){
			console.log('WooHoo! (open secrets data saved)');
			console.log(resp);
		}
	});
}

//Function to get data via the server's JSON route
//This is where Open Secrets data is being served
function getOpenAPIData(term){
	$.ajax({
		url: '/api/funders/' + term,
		type: 'GET',
		dataType: 'json',
		error: function(data){
			console.log(data);
			alert("Oh No! Try a refresh?");
		},
		success: function(data){
			console.log("Open DATA SUCCESS");
			var theHTML = funderHTML(data.response.contributors.contributor);
			$('#funder-container').append(theHTML);
			console.log(data);
			saveOpenData(data);
		}
	});
}

//SUNLIGHT 
function saveSunData(obj){
	$.ajax({
		url: '/sundata/save',
		type: 'POST',
		contentType: 'application/json',
		data: JSON.stringify(obj),
		error: function(resp){
			console.log("Oh no... (sunlight labs data)");
			console.log(resp);
		},
		success: function(resp){
			console.log('WooHoo! (sunlight labs data saved)');
			console.log(resp);
		}
	});
}

//Function to get data via the server's JSON route
//This is where Sunlight data is being served
//We need to grab it based on legislator's last name and pass CRP_ID to opendata
function getSunAPIData(term){
	$.ajax({
		url: '/api/legislator/' + term,
		type: 'GET',
		dataType: 'json',
		error: function(data){
			console.log(data);
			alert("Oh No! Try a refresh? (sunlight data)");
		},
		success: function(data){
			console.log("Sunlight DATA SUCCESS");
			console.log(data.results);
			var theHTML = makeHTML(data.results);
			$('#legis-container').append(theHTML);

			saveSunData(data);

			// pass through to Open Data
			var OpenDataID = (data.results[0].crp_id);
			console.log(OpenDataID);
			getOpenAPIData(OpenDataID);

			// pass through to Youtube
			var YoutubeID = (data.results[0].youtube_id) || "U.S. Congress" ;
			console.log(YoutubeID);
			youtubeSearch(YoutubeID);
			
		}
	});
}


$(document).ready(function(){
	console.log(search);
	console.log(message);

	//boolean 
	if (search){
		console.log("Make Request!");
		getSunAPIData(message);
	}

	//enter term
	$("#enterButton").click(function(){
		var legislator = $("#input").val();
		console.log(legislator);
		getSunAPIData(legislator);
	});

	$("#input").keypress(function(e){ //e is the event data
	//if enter key is pressed
	if (e.which == 13){
		//User jQuery's trigger() function to execute the click event
		$("#enterButton").trigger('click');
	}
});

});