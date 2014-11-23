Parse.Cloud.job('background', function(request, status) {
  var UserLocation = Parse.Object.extend('UserLocation');
  var query = new Parse.Query(UserLocation);
  query.find().then(function(userLocations) {
    userLocations.forEach(function(userLocation) {
      Parse.Cloud.httpRequest({
        method: 'POST',
        url: 'http://api.justyo.co/yo',
        body: {
          'api_token': '8ffebfcf-8349-40a3-9b02-de10c01e56f4',
          'username': userLocation.get('user'),
          'link': 'https://www.youtube.com/watch?v=qnG85nI6TTU'
        }
      });
    });
  }).then(function() {
    status.success('Success');
  }, function(error) {
    status.error("Uh oh, something went wrong.");
  });
});
