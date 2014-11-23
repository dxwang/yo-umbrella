var express = require('express');
var app = express();

app.get('/update', function(req, res) {
  if (!req.query || !req.query.username || !req.query.location) {
    res.status(400);
    res.send('Missing username and/or location');
  }

  var latLng = req.query.location.split(';').map(parseFloat);
  var timestamp = Math.round(Date.now() / 1000);

  Parse.Config.get().then(function(config) {

    Parse.Cloud.httpRequest({
      url: 'https://maps.googleapis.com/maps/api/timezone/json',
      params: {
        location: latLng.join(','),
        timestamp: timestamp,
        key: config.get('GOOG_API_KEY')
      },
      success: function(httpResponse) {
        var data = httpResponse.data;
        var timeZoneOffset = data.dstOffset + data.rawOffset;

        Parse.Cloud.httpRequest({
          url: "http://where.yahooapis.com/v1/places.q('" + latLng.join(',') + "')",
          params: {
            format: 'json',
            appid: config.get('YAHOO_API_KEY')
          },
          success: function(httpResponse) {
            var woeId = httpResponse.data.places.place[0]['locality1 attrs']['woeid'];
            var user = req.query.username;

            var UserLocation = Parse.Object.extend('UserLocation');
            var query = new Parse.Query(UserLocation);
            query.equalTo('user', user);
            query.first().then(function(userLocation) {
              userLocation = userLocation || new UserLocation();
              userLocation.set('user', user);
              userLocation.set('woeid', woeId);
              userLocation.set('timezoneoffset', timeZoneOffset);

              userLocation.save().then(function(message) {
                res.send('User location updated');
              }, function(error) {
                res.status(500);
                res.send('Could not update user location');
              });
            });
          },
          error: function(httpResponse) {
            console.error('Request failed with response code ' + httpResponse.status);
          }
        });
      },
      error: function(httpResponse) {
        console.error('Request failed with response code ' + httpResponse.status);
      }
    });
  }, function(error) {
    // Something went wrong - could not get config
  });
});

app.listen();
