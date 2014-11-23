var express = require('express');
var app = express();
var GOOG_API_KEY='AIzaSyBd11992i4WZ1IfIaJKgCbywggEcKLHoJo';
var YAHOO_API_KEY='dj0yJmk9bllNNVEzSjYydTJHJmQ9WVdrOVJVMUVhRTVCTlRBbWNHbzlNQS0tJnM9Y29uc3VtZXJzZWNyZXQmeD0xYw--'

app.get('/update', function(req, res) {
  if (!req.query || !req.query.username || !req.query.location) {
    res.status(400);
    res.send('Missing username and/or location');
  }

  var latLng = req.query.location.split(';').map(parseFloat);

  getTimeZoneOffset(
    latLng[0],
    latLng[1],
    Math.round(new Date() / 1000),
    req,
    res
  );
});

function getTimeZoneOffset(lat, lng, timestamp, req, res) {
  var url = 'https://maps.googleapis.com/maps/api/timezone/json';
  var url_params = {
    location: lat + ',' + lng,
    timestamp: timestamp,
    key: GOOG_API_KEY
  }

  Parse.Cloud.httpRequest({
    url: url,
    success: function(httpResponse) {
      var data = httpResponse.data;
      req.timeZoneOffset = (data.dstOffset + data.rawOffset) / 3600;
      getWoeId(lat, lng, req, res);
    },
    error: function(httpResponse) {
      console.error('Request failed with response code ' + httpResponse.status);
    }
  });
}

function getWoeId(lat, lng, req, res) {
  var url = ([
    "http://where.yahooapis.com/v1/places.",
    "q('" + lat + "," + lng + "')"
  ]).join('');

  var url_params = {
    format: 'json',
    appid: YAHOO_API_KEY
  }

  Parse.Cloud.httpRequest({
    url: url,
    params: url_params,
    success: function(httpResponse) {
      var data = httpResponse.data;
      req.woeId = data.places.place[0]['locality1 attrs']['woeid'];
      saveUser(req, res);
    },
    error: function(httpResponse) {
      console.error('Request failed with response code ' + httpResponse.status);
    }
  });
}

function saveUser(req, res) {
  var UserLocation = Parse.Object.extend('UserLocation');
  var user = req.query.username;
  var latLng = req.query.location.split(';').map(parseFloat);
  var location = new Parse.GeoPoint(latLng[0], latLng[1]);
  var woeId = req.woeId;
  var timeZoneOffset = req.timeZoneOffset;

  var query = new Parse.Query(UserLocation);
  query.equalTo('user', user);
  query.first().then(function(userLocation) {
    userLocation = userLocation || new UserLocation();
    userLocation.set('user', user);
    userLocation.set('location', location);
    userLocation.set('woeid', woeId);
    userLocation.set('timezoneoffset', timeZoneOffset);

    userLocation.save().then(function(message) {
      res.send('User location updated');
    }, function(error) {
      res.status(500);
      res.send('Could not update user location');
    });
  });
}

app.listen();
