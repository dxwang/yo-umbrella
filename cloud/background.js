Parse.Cloud.job('background', function(request, status) {
  var UserLocation = Parse.Object.extend('UserLocation');
  var date = new Date
  var timeZoneQuery = (7 - ((date.getHours() + (date.getTimezoneOffset() / 60)) % 24)) * 3600; // TODO(kevin): put 7 in config

  var query = new Parse.Query(UserLocation);
  query.equalTo('timezoneoffset', timeZoneQuery);
  query.find().then(function(userLocations) {
    userLocations.forEach(function(userLocation) {
      isGonRain(userLocation, status);
    });
  }).then(function() {
    status.success('Success');
  }, function(error) {
    status.error("Uh oh, something went wrong.");
  });
});

function isGonRain(userLocation, status) {
  Parse.Config.get().then(function(config) {
    var monthMap = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var date = new Date;
    var today = ([date.getDate(), monthMap[date.getMonth()], date.getFullYear()]).join(' ');
    var url = 'https://query.yahooapis.com/v1/public/yql';
    var url_params = {
      q: 'select item.forecast from weather.forecast where woeid = ' + userLocation.get('woeid') + ' and item.forecast.date = ' + today + ' and (item.forecast.code <= 17 or item.forecast.code >= 37 or item.forecast.code = 35) and item.forecast.code != 3200',
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
  }, function(error) {
    // Something went wrong - could not get config
  });
}

function notifyIsGonRain(userLocation) {
  Parse.Config.get().then(function(config) {
    Parse.Cloud.httpRequest({
      method: 'POST',
      url: 'http://api.justyo.co/yo',
      body: {
        'api_token': config.get('YAHOO_API_KEY'),
        'username': userLocation.get('user'),
        'link': config.get('YO_TO_USER_URL')
      }
    });
  }, function(error) {
    // Something went wrong - could not get config
  });
}

