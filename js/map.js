$(document).ready(function(){
	
	var zillowID = [];
	var name = [];
	var allMarkers = [];
	var infoWindow = null;
	var allLatlng = [];
	var url = [];
	var pos;
	var userCords;
	var googleURL;
	var output;
	var tempMarkerHolder = [];

	
	// Initial map setup.
	var mapOptions = {
			zoom: 7,
			center: new google.maps.LatLng(36.746842, -119.772587),
			panControl: false,
			panControlOptions: {
				position: google.maps.ControlPosition.BOTTOM_LEFT
			},
			zoomControl: true,
			zoomControlOptions: {
				style: google.maps.ZoomControlStyle.LARGE,
				position: google.maps.ControlPosition.RIGHT_CENTER
			},
			mapTypeId: google.maps.MapTypeId.ROADMAP,
			scaleControl: false
		};

		// Enable geolocation depending on the user input
		if (navigator.geolocation){
		// Handle error
		function handleLocationError(browserHasGeolocation) {
			console.warn(browserHasGeolocation ? 'Error: The Geolocation service failed.' : 'Error: Your browser doesn\'t support geolocation');
		}
		// Plot the marker of the current location on success.
		function onSuccess(position) {
			pos = { lat: position.coords.latitude, lng: position.coords.longitude};
			userCords = position.coords;

			console.log(pos.lat + ", " + pos.lng);
			var marker = new google.maps.Marker({ position : pos, map: map, animation: google.maps.Animation.DROP});
			function bounce() {
				if (marker.getAnimation() !== null) {
 					   marker.setAnimation(null);
 					 } else {
  						  marker.setAnimation(google.maps.Animation.BOUNCE);
 					 }
 					}
 				marker.addListener('click', bounce);
			}


			navigator.geolocation.getCurrentPosition(onSuccess, handleLocationError);
		}

		// console.log(userCords.latitude);
		


		if(navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(function(position) {
				 	pos = {
					lat: position.coords.latitude,
					lng: position.coords.longitude,
			};


			console.log(pos.lat + ", " + pos.lng);

			var marker = new google.maps.Marker({
				position: pos,
				map: map,
				animation: google.maps.Animation.DROP
			});

			function bounce() {
 				 if (marker.getAnimation() !== null) {
 					   marker.setAnimation(null);
 					 } else {
  						  marker.setAnimation(google.maps.Animation.BOUNCE);
 					 }
 					}
			marker.addListener('click', bounce);

			}, function() {
				handleLocationError(true);
			});
		} else {
			handleLocationError(false);
		}


	var infoWindow = new google.maps.InfoWindow({ content: "holding ..."});

	var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

	
	// Do the following after a submit action on form with id 'chooseZipCode'
	$('#chooseZipCode').submit(function(){

		
		// assign the value entered by the user to 'userInput'
		var userInput = $('#textZip').val();

		console.log(userInput);
		// regular expression for only numbers, letters, comma and period in user input.
		var checkInput = /^[0-9a-zA-z,.]+$/;
		
		var googleURL;

	/*	if (userInput){
			googleURL = "http://maps.googleapis.com/maps/api/geocode/json?address=" + userInput;
		} else {
			googleURL = "http://maps.googleapis.com/maps/api/geocode/json?latlng=" + pos.lat + "," + pos.lng;
		}*/

		// Google's geocode API with URIencoded userinput.
		googleURL = "http://maps.googleapis.com/maps/api/geocode/json?address=" + encodeURI(userInput);

		console.log(googleURL);

		// First ajax query to Google's geocode API.
		$.ajax({
			type: "GET",
			url: googleURL,
			success: function(data){
				
				$.each(data.results, function(i,v){


					var status = v.status;
					console.log(status);
					if (status == 'ZERO_RESULTS') {
						alert('Enter a correct address');
					}

					// look for 'formatted_address' in 'v'
					var output = v.formatted_address;
					var splitOutput = output.split(', ');
					
					var city = splitOutput[0];
					var cityURI = encodeURI(city);
					console.log(cityURI);
					var state = splitOutput[1];
					// console.log(typeof(state));
					var stateCode = state.substring(0,2);
					/*console.log(city);
					console.log(state);
					console.log(stateCode);*/


					var counter = 0;
					var zillowURL = "http://www.zillow.com/webservice/GetRegionChildren.htm?zws-id=<Zillow-ID>&state=" + stateCode + "&city=" + cityURI + "&childtype=neighborhood";
					//console.log(zillowURL);


					// Second ajax query to Zillow API.
					$.ajax({

						type: "GET",
						url: zillowURL,
						cache: false,
						//dataType: "xml",
						success: function(xml){
						// in the 'xml' find 'message field and implement function on each data found'
						$(xml).find('message').each(function(){
							var zillStatus = $(this).find("code").text();
							if (zillStatus == '0') {

								$(xml).find('response').each(function(){
								$(this).find("region").each(function(){
								console.log(this);
								var reg = $(this);
								var code = $(reg).find("code").text();
								var id = $(reg).find("id").text();
								var name = $(reg).find("name").text();
								var zindex = $(reg).find("zindex").text();

								var url = $(reg).find("url").text();
								var latitude = $(reg).find("latitude").text();
								var longitude = $(reg).find("longitude").text();

								console.log(name, zindex, url);


								myLatlng = new google.maps.LatLng(parseFloat(latitude), parseFloat(longitude));

								allMarkers = new google.maps.Marker({
									position: myLatlng,
									map: map,
									title: id,
									html: '<div class="markerPop">' +
										  '<h1> Name: ' + name + '</h1>' +
										  '<h3> Index: ' + zindex + '$ </h3>' +
										  '<a href=' + url + ' target = "_blank">' + 'URL: '+ url + '</a>' +
										  '</div>'
								});

								allLatlng.push(myLatlng);
								tempMarkerHolder.push(allMarkers);
								counter++;
								
								google.maps.event.addListener(allMarkers, 'click', function(){

									infoWindow.setContent(this.html);
									infoWindow.open(map, this);
								});

								});

								var bounds = new google.maps.LatLngBounds();
								for (var i = 0, Ltlglen = allLatlng.length; i < Ltlglen; i++){
									bounds.extend(allLatlng[i]);
								}

								map.fitBounds(bounds);
							});

							}else {
								alert("Enter a valid address");
							}
						});
						
						}
					});
				});			
			},
			error: function(){
				alert("No data found");
			}
		});

		return false;
	});
});