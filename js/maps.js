(function(A) {
  if (!Array.prototype.forEach)
    A.forEach =
      A.forEach ||
      function(action, that) {
        for (var i = 0, l = this.length; i < l; i++) if (i in this) action.call(that, this[i], i, this);
      };
})(Array.prototype);

var mapObject,
  markers = [],
  markersData = {
    Marker: [
      {
        type_point: "Plumbers",
        name: "Hydraulic Warszawa",
        location_latitude: 52.300507,
        location_longitude: 21.019092,
        map_image_url: "images/category/places/place-1.jpg",
        rate: "4.5",
        name_point: "Hydraulic Warszawa",
        url_point: "single-listing-one.html",
        review: "13 reviews"
      },
      {
        type_point: "Plumbers",
        name: "Plumber Warsaw Ochota",
        location_latitude: 52.262912,
        location_longitude: 21.055204,
        map_image_url: "images/category/places/plumber.jpg",
        rate: "4",
        name_point: "Plumber Warsaw Ochota",
        url_point: "single-listing-one.html",
        review: "12 reviews"
      },
      {
        type_point: "Plumbers",
        name: "Pogotowie Hydrauliczne",
        location_latitude: 52.251746,
        location_longitude: 20.982256,
        map_image_url: "images/category/places/place-5.jpg",
        rate: "5",
        name_point: "Pogotowie Hydrauliczne",
        url_point: "single-listing-two.html",
        review: "11 reviews"
      },
      {
        type_point: "Plumbers",
        name: "Pomoc Hydrauliczna",
        location_latitude: 52.231815,
        location_longitude: 21.016075,
        map_image_url: "images/category/places/place-4.jpg",
        rate: "4.7",
        name_point: "Pomoc Hydrauliczna",
        url_point: "single-listing-two.html",
        review: "9 reviews"
      }
    ]
  };

var mapOptions = {
  zoom: 12,
  center: new google.maps.LatLng(52.2297, 21.0122),
  mapTypeId: google.maps.MapTypeId.ROADMAP,

  mapTypeControl: false,
  mapTypeControlOptions: {
    style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
    position: google.maps.ControlPosition.LEFT_CENTER
  },
  panControl: false,
  panControlOptions: {
    position: google.maps.ControlPosition.TOP_RIGHT
  },
  zoomControl: true,
  zoomControlOptions: {
    position: google.maps.ControlPosition.RIGHT_BOTTOM
  },
  scrollwheel: false,
  scaleControl: false,
  scaleControlOptions: {
    position: google.maps.ControlPosition.TOP_LEFT
  },
  streetViewControl: true,
  streetViewControlOptions: {
    position: google.maps.ControlPosition.LEFT_TOP
  },
  styles: [
    {
      featureType: "administrative",
      elementType: "geometry",
      stylers: [
        {
          visibility: "off"
        }
      ]
    },
    {
      featureType: "administrative.land_parcel",
      elementType: "labels",
      stylers: [
        {
          visibility: "off"
        }
      ]
    },
    {
      featureType: "poi",
      stylers: [
        {
          visibility: "off"
        }
      ]
    },
    {
      featureType: "road",
      elementType: "labels.icon",
      stylers: [
        {
          visibility: "off"
        }
      ]
    },
    {
      featureType: "road.local",
      elementType: "labels",
      stylers: [
        {
          visibility: "off"
        }
      ]
    },
    {
      featureType: "transit",
      stylers: [
        {
          visibility: "off"
        }
      ]
    }
  ]
};
var marker;
mapObject = new google.maps.Map(document.getElementById("map_right_listing"), mapOptions);
for (var key in markersData)
  markersData[key].forEach(function(item) {
    marker = new google.maps.Marker({
      position: new google.maps.LatLng(item.location_latitude, item.location_longitude),
      map: mapObject,
      icon: "images/others/" + key + ".png"
    });

    if ("undefined" === typeof markers[key]) markers[key] = [];
    markers[key].push(marker);
    google.maps.event.addListener(marker, "click", function() {
      closeInfoBox();
      getInfoBox(item).open(mapObject, this);
      mapObject.setCenter(new google.maps.LatLng(item.location_latitude, item.location_longitude));
    });
  });

new MarkerClusterer(mapObject, markers[key]);

function hideAllMarkers() {
  for (var key in markers)
    markers[key].forEach(function(marker) {
      marker.setMap(null);
    });
}

function closeInfoBox() {
  $("div.infoBox").remove();
}

function getInfoBox(item) {
  return new InfoBox({
    content: '<div class="marker_info" id="marker_info">' + '<img src="' + item.map_image_url + '" alt=""/>' + "<span>" + "<em>" + item.type_point + "</em>" + '<h3><a href="' + item.url_point + '">' + item.name_point + "</a></h3>" + '<span class="infobox_rate">' + item.rate + "</span>" + '<span class="btn_infobox_reviews">' + item.review + "</span>" + "</span>" + "</div>",
    disableAutoPan: false,
    maxWidth: 0,
    pixelOffset: new google.maps.Size(10, 92),
    closeBoxMargin: "",
    closeBoxURL: "images/others/close_infobox.png",
    isHidden: false,
    alignBottom: true,
    pane: "floatPane",
    enableEventPropagation: true
  });
}
function onHtmlClick(location_type, key) {
  google.maps.event.trigger(markers[location_type][key], "click");
}
