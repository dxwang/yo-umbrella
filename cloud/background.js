var YAHOO_API_KEY='dj0yJmk9bllNNVEzSjYydTJHJmQ9WVdrOVJVMUVhRTVCTlRBbWNHbzlNQS0tJnM9Y29uc3VtZXJzZWNyZXQmeD0xYw--' // TODO(kevin): put in config

Parse.Cloud.job('background', function(request, status) {
  var UserLocation = Parse.Object.extend('UserLocation');
  var date = new Date
  var timeZoneQuery = 7 - ((date.getHours() + (date.getTimezoneOffset() / 60)) % 24); // TODO(kevin): put 7 in config

  var query = new Parse.Query(UserLocation);
  query.equalTo('timezoneoffset', timeZoneQuery);
  query.find().then(function(userLocations) {
    userLocations.forEach(function(userLocation) {
      isGonRain(userLocation, status);
    });
  }).then(function() {
    
  }, function(error) {
    status.error("Uh oh, something went wrong.");
  });
});

function isGonRain(userLocation, status) {
  var url = 'https://query.yahooapis.com/v1/public/yql';
  var url_params = {
    q: 'select item.condition from weather.forecast where woeid = ' + userLocation.get('woeid') + ' and (item.condition.code <= 17 or item.condition.code >= 37 or item.condition.code = 35) and item.condition.code != 3200',
    format: 'json',
    env: 'store://datatables.org/alltableswithkeys',
    appid: YAHOO_API_KEY
  };

  Parse.Cloud.httpRequest({
    url: url,
    params: url_params,
    success: function(httpResponse) {
      var data = httpResponse.data;
      if (data.query.results) {
        notifyIsGonRain(userLocation);
      }
      status.success('Success');
    },
    error: function(httpResponse) {
      console.error('Request failed with response code ' + httpResponse.status);
    }
  });
}

function notifyIsGonRain(userLocation) {
  Parse.Cloud.httpRequest({
    method: 'POST',
    url: 'http://api.justyo.co/yo',
    body: {
      'api_token': '8ffebfcf-8349-40a3-9b02-de10c01e56f4', // TODO(kevin): put in config
      'username': userLocation.get('user'),
      'link': 'https://www.youtube.com/watch?v=qnG85nI6TTU' // TODO(kevin): put in config
    }
  });
}

