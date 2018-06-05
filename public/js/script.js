($ => {
  "use strict";

  // Scroll using jQuery easing
  $('a.js-scroll-trigger[href*="#"]:not([href="#"])').click(() => {
    if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
      if (target.length) {
          $('html, body').animate({
          scrollTop: (target.offset().top - 54)
        }, 1000, "easeInOutExpo");
        return false;
      }
    }
  });

  // Close responsive menu when scroll trigger is clicked
  $('.js-scroll-trigger').click(() => {
    $('.navbar-collapse').collapse('hide');
  });

  // Use Bootstrap JS scrollspy with jQuery
  $('.wrapper').scrollspy({
    target: '#mainNav',
    offset: 56
  });

  // Collapse Navbar
  let navbarCollapse = () => {
      if ($(".wrapper").scrollTop() > 100) {
        $("#mainNav").addClass("navbar-shrink");
      } else {
        $("#mainNav").removeClass("navbar-shrink");
      }
  };
  // Collapse if page is not at top
  navbarCollapse();
  // Collapse the navbar when page is scrolled
  $('.wrapper').scroll(navbarCollapse);

  // Hide navbar when modals trigger
  $('.portfolio-modal').on('show.bs.modal', e => {
    $(".navbar").addClass("d-none");
  })
  $('.portfolio-modal').on('hidden.bs.modal', e => {
    $(".navbar").removeClass("d-none");
  })

})(jQuery);


function createGroup(gname) {
  $.post("/create-group", gname, () => {console.log("success!")} );
}

const getUser = () => {
  $.get("http://eventhop.herokuapp.com/user") //request user groups form server
    .done((data, status, xhr) => {
      data.Groups.forEach(group => {
        //generate buttons for user groups
        $("#user-groups").append(`<div class="col-md-4 col-sm-6 portfolio-item">
                <a class="portfolio-link" data-toggle="modal" href="#show-route-modal" data-group="${group.id}">
                  <div class="portfolio-hover">
                    <div class="portfolio-hover-content">
                      <i class="fa fa-plus fa-3x"></i>
                    </div>
                  </div>
                  <img class="img-fluid" src="public/img/portfolio/event-02.jpg" alt="">
                </a>
                <div class="portfolio-caption">
                 <p class="text-muted">|${group.members} members|</p>
                </div>
              </div>`);
      });
    })
    .fail(err =>
      $("#user-groups").html(
        '<h3 class="section-subheading text-muted">Create custom groups!</h3>'
      )
    ); //no user, no groups D`:
};

//front end handshake
//
//Front end login receive signature
//
let getUserId;
const authenticate =(user) => {

  let userToken = localStorage.getItem('EHUserToken');
  console.log(user);

  $.post("http://eventhop.herokuapp.com/auth", user)
  .done(
    (data,status,xhr) => {
      $.ajaxSetup({
        beforeSend: xhr => xhr.setRequestHeader("Authorization",`Bearer ${data.token}`)
      });
      localStorage.setItem('EHUserToken',data.token);
      $("#loginModal").modal('toggle');
      console.log(data.user);
      getUserId = data.user.id;
      $('.def-nav').remove();
       $.get("http://eventhop.herokuapp.com/user/nav")
            .done((data,status,xhr) => {
              $('#mainNav_items').append(data);
              googleMapInit();
            })
          })
      .fail(xhr => console.log(JSON.parse(xhr.responseText).message)); 
}

$('#login_form').on('submit', event => {
  event.preventDefault();
      authenticate({email:$('#username').val(),password:$('#password').val()});
    });

//
//google maps api for create group
//

googleMapInit = () => {
  let markers = [];
  let placesArr = [];
  let routeMarkers = [];
  let routePlaces = [];
  let categoryName;
  let mapNum;
  let startLoc = "";
  let secondLoc = "";
  let lastLoc = "";
  let completeRoute = "";
  let isRoute = "";
  const durham = { lat: 35.997, lng: -78.904 };
  // Initializes the location map.
  let map = new google.maps.Map(document.getElementById("map"), {
    center: durham,
    zoom: 15
  });
  // Initializes the route map.
  const routemap = new google.maps.Map(document.getElementById("routemap"), {
    center: durham,
    zoom: 15
  });
  // Create the places service.
  const service = new google.maps.places.PlacesService(map);
  //Create the google directions services
  const directionsService = new google.maps.DirectionsService();
  const directionsDisplay = new google.maps.DirectionsRenderer();
  
  
  //this initializes the google category map and the route map and sets the marker in downtown durham
  
  function populateLocMap(service, category) {
    // clears these variables/elements so they can be repopulated based on the location categories when the user changes them
    placesArr = [];
    markers = [];
    $("#place-list").text("");

    // Perform a nearby search.
    service.nearbySearch(
      {
        location: durham,
        radius: 1800,
        type: [category]
      },
      function(results, status, pagination) {
        if (status !== "OK") return;
        createMarkers(results);
      }
    );  
  }
  
  // creates the markers for the google map
  function createMarkers(places) {
    this.bounds = new google.maps.LatLngBounds();

    //empties select drop-down so it can be repopulated appropriately
    $("#map-select").empty();
    $("#map-select").append($("<option>", { id: 'map-select-title', text: "Select a location!", selected: true, disabled: true }));
    placesRecursion(places, function() {console.log("recursion done!")} );
    // loops through all the found locations in the category and creates appropriate icon
    //for (let i = 0, place; (place = places[i]); i++) {
    for (let i = 0; i<places.length; i++) {
      
      this.image = {
        url: places[i].icon,
        size: new google.maps.Size(71, 71),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(25, 25)
      };
      this.marker = new google.maps.Marker({
        map: map,
        icon: image,
        title: places[i].name,
        position: places[i].geometry.location
      });
      // markers and their place objects are then pushed to arrays in the same order the map-select drop-down is populated so the value can be used to link the correct marker/place
      console.log("index: " + i);
      markers.push(marker);
      populateRoute();
      bounds.extend(places[i].geometry.location);

      //google Places Details API is used to get more specific information on each location in the loop
      //await logPlaceDetails(place.place_id, i);
    }
    map.fitBounds(bounds);
  };

  //recursive function so that all of the async API calls come back in the right index and so the map-select matches the marker index
  function placesRecursion(places, ondone) {
    function go(i) {
      // if building the route using google API, use this function
      if (places.geocoded_waypoints) {
         if (i >= places.geocoded_waypoints.length) {
           ondone();
         } else {
            setTimeout(function() {
            logPlaceDetails(places.geocoded_waypoints[i].place_id, i, true, (i) => go(i + 1));
          }, 150);
         }
      // if showing the map for creating the route, use this function
      } else {
        if (i >= places.length) {
          ondone();
        } else {
          setTimeout(function() {
            logPlaceDetails(places[i].place_id, i, false, (i) => go(i + 1));
          }, 250);
        }
      }
      }
    go(0);
  }

  //Uses the google Places Details API to get more detailed information and passes it into createInfoBox function to build divs with specific info for each place
  function logPlaceDetails(location, i, isRoute, callback) {
    service.getDetails(
      {
        placeId: location
      },
        function(place, status, isRoute) {
          if (!isRoute) {
            $("#map-select").append($("<option>", {
            value: i,
            text: place.name
          }));
          placesArr.push(place);
          }
        //see comment above createInfoBox function
        createInfoBox(place);
        } 
    );
      callback(i);
  }

  // Takes the google Places Details object and parses out useful information and builds a card for each location in the loop.  Card div is then pushed to the DOM
  function createInfoBox(place) {
    // adds photo of durham to info box if there are no pictures pulled from google api
    if(place.photos) {
      var photos = place.photos[0].getUrl({
        maxWidth: 270,
        maxHeight: 350
      });
    } else {
      var photos = "public/img/portfolio/durham.jpeg";
    }

    // validates and filters the location information if some variables are undefined
    let phone = place.formatted_phone_number ? `Phone Number: ${place.formatted_phone_number}` : "No Phone Number Available";
    let rating = place.rating ? `Google Rating: ${place.rating}` : "No Google Ratings Available";
    let website = place.website ? `<span><a href="${place.website}" target="_blank" class="btn btn-sm loc-btn btn-primary card-btn">Website</a></span>` : "";    
    let placeInfoBox = ` 
                    <div class="card">
                        <div class="row">
                            <div class="col-md-4 container-fluid">
                                <img src="${photos}" class="w-100 img-responsive progress">
                            </div>
                            <div class="col-md-8 px-3">
                                <div class="card-block px-3">
                                    <br>
                                    <h2 class="card-title">${place.name}${website}</h2>
                                    <p class="card-text"><em>${rating}</em></p>
                                    <h5 class="card-text">${place.formatted_address}</h5>
                                    <h5 class="card-text">${phone}</h5>
                                    <br>
                                </div>
                            </div>
                        </div>
                    </div>    
                        `;
    $("#place-list").append(placeInfoBox);
    $("#route-place-list").append(placeInfoBox);
  }
  // appends the Route Map into the appropriate modal so the map can be moved around the page without initializing several maps
  function addRouteMap() {
    const routeMapHTML = `
      <h1 id="mapTitle">Here's Your Route!</h1>
      <div id="routemap"></div>
      <div class="container">
        <div class="row">
          <div class="col-lg-12 mx-auto">
            <div class="modal-body">
              <div class="container">
                <div class="row mbr">
                  <h2 class="text-uppercase" id="create-group-title"></h2>
                </div>
                <div class="row mbr">
                  <div class="col-6">
                    <button class="btn btn-primary pull-left" id="create_title_button">Preview Title </button>
                    <input type="text" id="group_title_input" value="Group Name">
                  </div>
                </div>
                <button class="btn btn-primary" id="createGroup" type="button">
                  <i class="fa"></i>
                  Create Your Group!
                </button>
              </div>
              <div id="route-place-list" class="container py-3"></div>
              <div id="directionsPanel"></div>
            </div>
          </div>
        </div>
      </div>
        `;
    $(".route-container-active").append(routeMapHTML);
  }

  $(".mapDiv").addClass("route-container-active");
  $(".mapDiv").removeClass("route-container-active");
  $(".mapDiv").empty();
  $(".route-container").addClass("route-container-active");
  $(".route-container").removeClass("route-container-active");
  $(".route-container").empty();
  $("#route-container-event-one").addClass("route-container-active");
  $("#route-container-event-one").removeClass("route-container-active");
  $("#route-container-event-one").empty();
  $("#route-container-event-two").addClass("route-container-active");
  $("#route-container-event-two").removeClass("route-container-active");
  $("#route-container-event-two").empty();
  $("#route-container-event-three").addClass("route-container-active");
  $("#route-container-event-three").removeClass("route-container-active");
  $("#route-container-event-three").empty();
  $("#route-container-event-four").addClass("route-container-active");
  $("#route-container-event-four").removeClass("route-container-active");
  $("#route-container-event-four").empty();
  $("#route-container-event-five").addClass("route-container-active");
  $("#route-container-event-five").removeClass("route-container-active");
  $("#route-container-event-five").empty();

  function removeRouteMap() {
    $(".routeContainer").empty();
  }

  //updates progress bar [WRITE A MORE CONCISE FUNCTION WHEN YOU HAVE TIME!]
  function progressBar() {
    if (!$("#progOne").hasClass("done")) {
      $("#progOne").addClass("done");
      $("#progOne").removeClass("todo"); 
    } else if (!$("#progTwo").hasClass("done")) {
      $("#progTwo").addClass("done");
      $("#progTwo").removeClass("todo");
    } else if (!$("#progThree").hasClass("done")) {
      $("#progThree").addClass("done");
      $("#progThree").removeClass("todo");
    }
  }

  // resets the classes for the progress bar
  function resetProgress() {
    $("#progOne").addClass("todo");
    $("#progOne").removeClass("done"); 
    $("#progTwo").addClass("todo");
    $("#progTwo").removeClass("done"); 
    $("#progThree").addClass("todo");
    $("#progThree").removeClass("done"); 
  }

  //checks if route is complete based on progress bar, then toggles the two buttons so 'Create Route' button appears if appropriate
  function routeCompleteCheck() {
    if ($("#progThree").hasClass("done")) {
      $("#routeAdd").toggle();
      $("#openRouteModal").toggle();
      console.log(routeMarkers);
    }
  }

  // keeps track of the user's previously chosen location markers and repopulates the map with them whenever the user switches categories
  function populateRoute() {
    for (i = 0; i < routeMarkers.length; i++) {
      routeMarkers[i] = new google.maps.Marker({
        position: routeMarkers[i].position,
        map: map,
        title: routeMarkers[i].title
      });
      routeMarkers[i].setAnimation(google.maps.Animation.BOUNCE);
    }
  }

  // stores the name and address of the user's selected locations to be used in google map's route directions and pushed to the database for route information
  function routeLocations() {
    if(startLoc === "") {
      startLoc = `${placesArr[mapNum].name}, ${placesArr[mapNum].formatted_address}`;
      console.log("Start Location: " + startLoc);
    } else if (secondLoc === "") {
      secondLoc = `${placesArr[mapNum].name}, ${placesArr[mapNum].formatted_address}`;
      console.log("Middle Location: " + secondLoc);
    } else if (lastLoc === "") {
      lastLoc = `${placesArr[mapNum].name}, ${placesArr[mapNum].formatted_address}`;
      console.log("Last Location: " + lastLoc);
    }
  }

  // this function uses the Google Directions API to take the three locations the user has selected and form the fastest walking route between the three and give walking directions/walk time/distance in a toggleable section
  function calculateAndDisplayRoute(directionsService, directionsDisplay, firstLocation, secondLocation, lastLocation) {
    console.log("origin: ", firstLocation);
    console.log("second: ", secondLocation);
    console.log("destination: ", lastLocation);  //Sets the route map and panel for route directions
    directionsDisplay.setMap(routemap);
    directionsDisplay.setPanel(document.getElementById('directionsPanel'));
    $("#route-place-list").text("");
    directionsService.route(
      {
        origin: firstLocation,
        destination: lastLocation,
        waypoints: [
          {
            location: secondLocation,
            stopover: true
          }
        ],
        travelMode: "WALKING"
      },
      function(response, status) {
        if (status === "OK") {
          directionsDisplay.setDirections(response);
          console.log(response);
          placesRecursion(response, ()=> console.log("Recursion complete!"));
        } else {
          window.alert("Directions request failed due to " + status);
        }
      }
    );
  }
  
  //this function takes the full route string from the database an splits it into the three locations to be entered in the Google Directions API 
  function dbStringToRoute(routeString) {
    let routeArr = routeString.split("&");
    startLoc = routeArr[0];
    secondLoc = routeArr[1];
    lastLoc = routeArr[2];
    displayRoute(startLoc, secondLoc, lastLoc);
  }

  // this function resets the map without doing an area search on downtown durham with no category, to prevent rate limiting between category searches
  var resetMap = () => {
    placesArr = [];
    markers = [];
    $("#place-list").text("");

    // resets location map.
    map = new google.maps.Map(document.getElementById("map"), {
      center: durham,
      zoom: 15
    });
  }

  //on change, gets the value from the selected location and makes the marker bounce to show the user where it is
  $("#map-select").change(() => {
    if (markers[mapNum] === true && markers[mapNum].getAnimation() != null) {
      markers[mapNum].setAnimation(null);
    }
    var e = document.getElementById("map-select");
    mapNum = e.options[e.selectedIndex].value;
    console.log("markers[mapNum]: " + markers[mapNum]);
    console.log("mapNum: " + mapNum);
    markers[mapNum].setAnimation(google.maps.Animation.BOUNCE);
  });

  // toggles category buton, pushes route markers/places to arrays
  $("#routeAdd").on("click", () => {
    routeLocations();
    $(categoryName).toggle();
    routeMarkers.push(markers[mapNum]);
    routePlaces.push(placesArr[mapNum]);
    //console.log("places array: " + JSON.stringify(placesArr[mapNum]));
    resetMap();
    //console.log("route markers: " + routeMarkers);
    progressBar();
    routeCompleteCheck();
    populateRoute();
  });

  $("#openRouteModal").on('click', () => {
    resetProgress();
    completeRoute = startLoc + "&";
    completeRoute += secondLoc + "&";
    completeRoute += lastLoc;
    console.log(completeRoute);
    calculateAndDisplayRoute(directionsService, directionsDisplay, startLoc, secondLoc, lastLoc);
  })

  // Allows the user to Create a Group, pushing the route to the database and allowing others to search for and join the group.
  $("#createGroup").on("click", () => {
    createGroup("Cupcakes");
  });

  // initializes the map so it is visible when the modal pops up
  //$("#create-group-button").on("click", () => populateLocMap(service));

  // these do google Places search around the downtown area based on the location type the user chooses.  categoryName is saved so the category button is toggled off if the user chooses a location from that group (so they can't choose from the same category twice)
  $("#cafes").on("click", () => {
    categoryName = "#cafes";
    populateLocMap(service, "cafe");
  });
  $("#bar").on("click", () => {
    categoryName = "#bar";
    populateLocMap(service, "bar");
  });
  $("#art_gallery").on("click", () => {
    categoryName = "#art_gallery";
    populateLocMap(service, "art_gallery");
  });
  $("#restaurant").on("click", () => {
    categoryName = "#restaurant";
    populateLocMap(service, "restaurant");
  });
  $("#movie_theater").on("click", () => {
    categoryName = "#movie_theater";
    populateLocMap(service, "movie_theater");
  });
  $("#spa").on("click", () => {
    categoryName = "#spa";
    populateLocMap(service, "spa");
  });

  // allows the User to name their group and display the title above the map
  $("#create_title_button").on("click", () => {
    console.log($("#group_title_input").val());
    $("#create-group-title").text($("#group_title_input").val());
  });


};                 

$(document).ready(event =>{

            $(window).scrollTop(0);  
            let userToken = localStorage.getItem('EHUserToken');     
            $.ajaxSetup({
              beforeSend: xhr => xhr.setRequestHeader("Authorization",`Bearer ${userToken}`)
            });
            $.get("http://eventhop.herokuapp.com/user/nav")
            .done((data,status,xhr) => {
              $('#mainNav_items').append(data);
            }).fail(xhr => {
              console.log(xhr.responseText.message);
              $.get('http://eventhop.herokuapp.com/nav')
              .done((data,status,xhr) => {
                $('#mainNav_items').append(data);
              });
            });     

});
googleMapInit();
