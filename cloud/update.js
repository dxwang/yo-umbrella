var express = require('express');
var app = express();

app.get('/update', function (req, res) {
  if (!req.query || !req.query.username || !req.query.location) {
    res.status(400);
    res.send('Missing username and/or location');
  }

  var UserLocation = Parse.Object.extend('UserLocation');
  var user = req.query.username;
  var latLng = req.query.location.split(';').map(parseFloat);
  var location = new Parse.GeoPoint(latLng[0], latLng[1]);

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
