Parse.Cloud.job('background', function(request, status) {
  var UserLocation = Parse.Object.extend('UserLocation');
  var now = new Date();
  var timeZoneQuery = (7 - ((now.getHours() + (now.getTimezoneOffset() / 60)) % 24)) * 3600; // TODO(kevin): put 7 in config

  var query = new Parse.Query(UserLocation);
  // TODO: only check for users where the time is 7 AM.
  // query.equalTo('timezoneoffset', timeZoneQuery);
  query.find().then(function(userLocations) {

    Parse.Config.get().then(function(config) {

      var numUserLocations = userLocations.length;
      userLocations.forEach(function(userLocation) {
        var query = 'SELECT item.forecast FROM weather.forecast WHERE woeid = ' +
          userLocation.get('woeid') + ' LIMIT 1'

        Parse.Cloud.httpRequest({
          url: 'https://query.yahooapis.com/v1/public/yql',
          params: {
            q: query,
            format: 'json',
            env: 'store://datatables.org/alltableswithkeys',
            appid: config.get('YAHOO_API_KEY')
          },
          success: function(httpResponse) {
            var data = httpResponse.data;
            if (data.query.results && data.query.results.channel &&
              data.query.results.channel.item && data.query.results.channel.item.forecast &&
              data.query.results.channel.item.forecast.code) {

              var code = parseInt(data.query.results.channel.item.forecast.code, 10);
              if ((code <= 17 || code == 35 || code >= 37) && code != 3200 && code != 0) {
                Parse.Cloud.httpRequest({
                  method: 'POST',
                  url: 'http://api.justyo.co/yo',
                  body: {
                    'api_token': config.get('YO_API_KEY'),
                    'username': userLocation.get('user'),
                    'link': config.get('YO_TO_USER_URL')
                  }
                });
              }
            }
            numUserLocations--;
            if (numUserLocations <= 0) {
              status.success('Success');
            }
          },
          error: function(httpResponse) {
            status.error("Uh oh, something went wrong.");
          }
        });
      });
    }, function(error) {
      // Something went wrong - could not get config
    });
  });
});
