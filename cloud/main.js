var express = require('express');
var app = express();
var request = require('request');
var GOOG_API_KEY='AIzaSyBd11992i4WZ1IfIaJKgCbywggEcKLHoJo';
var YAHOO_API_KEY='dj0yJmk9bllNNVEzSjYydTJHJmQ9WVdrOVJVMUVhRTVCTlRBbWNHbzlNQS0tJnM9Y29uc3VtZXJzZWNyZXQmeD0xYw--'

app.get('/update', function (req, res) {
  if (!req.query || !req.query.username || !req.query.location) {
    res.status(400);
    res.send('Missing username and/or location');
  }

  var UserLocation = Parse.Object.extend('UserLocation');
  var user = req.query.username;
  var latLng = req.query.location.split(';').map(parseFloat);
  var location = new Parse.GeoPoint(latLng[0], latLng[1]);
  var timeZoneOffset, woeId;
  getTimeZoneOffset(
    latLng[0],
    latLng[1],
    Math.round(new Date() / 1000),
    timeZoneOffset
  );
  getWoeId(latLng[0], latLng[1], woeId);

  var query = new Parse.Query(UserLocation);
  query.equalTo('user', user);
  query.first().then(function(userLocation) {
    userLocation = userLocation || new UserLocation();
    userLocation.set('user', user);
    userLocation.set('location', location);

    userLocation.save().then(function(message) {
      res.send('User location updated');
    }, function(error) {
      res.status(500);
      res.send('Could not update user location');
    });
  });
});

app.listen();

function getTimeZoneOffset(lat, lng, timestamp, timeZoneOffset) {
  var url = ([
    'https://maps.googleapis.com/maps/api/timezone/json?',
    'location=' + lat + ',' + lng,
    '&timestamp=' + timestamp,
    '&key=' + GOOG_API_KEY
  ]).join('');

  request(url, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      timeZoneOffset = body.dstOffset + body.rawOffset;
    }
  });
}

function getWoeId(lat, lng, woeId) {
  var url = ([
    "http://where.yahooapis.com/v1/places.",
    "q('" + lat + "," + lng + "')",
    "?format=json",
    "&appid=" + YAHOO_API_KEY
  ]).join('');

  request(url, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      woeId = body.places.place[0]['locality1 attrs']['woeid'];
    }
  });
}
