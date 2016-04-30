# angular-primus [![Build Status](https://travis-ci.org/neoziro/angular-primus.svg?branch=master)](https://travis-ci.org/neoziro/angular-primus)

# This plugin is no longer actively maintained, you can still use it but issues will not be resolved. If you want the npm name, you can contact me by email.

Primus provider for Angular.

This plugin works with other Primus plugins like [primus-emitter](https://github.com/cayasso/primus-emitter) and [primus-resource](https://github.com/cayasso/primus-resource).

## Install

### Using bower

```js
bower install angular-primus
```

## Usage

```js
angular.module('controllers.primus', ['primus'])
.config(function (primusProvider) {
  primusProvider
  // Define Primus endpoint.
  .setEndpoint('http://mywebsite.com')
  // Define Primus options.
  .setOptions({
    reconnect: {
      minDelay: 100,
      maxDelay: 60000,
      retries: 100
    }
  })
  // Define default multiplex option for resources.
  .setDefaultMultiplex(false);
})
.controller('PrimusCtrl', function ($scope, primus) {

  // Listen "data" event.
  primus.$on('data', function (data) {
    $scope.data = data;
  });

  // Write data.
  primus.write('hello');


  // Listen custom event using primus-emitter.
  primus.$on('customEvent', function (customData) {
    $scope.customData = customData;
  });

  // Listen custom event with a filter (more details below)
  // ex. server broadcasting a user account update :
  primus.$on('account:update', {userId: 23}, function (account) {
    _.merge($scope.account, account);
  });

  // Send data using primus-emitter.
  primus.send('customEvent', { foo: 'bar' });


  // Use resource with primus-resource.
  primus.$resource('myResource').then(function (myResource) {
    myResource.myMethod();
  });
});
```

### about $on and $filteredOn

`$filteredOn` takes as filter either :
* an object, whom keys will be deep-matched for correspondance with the 1st param of received data, using [lodash matches(...)](https://lodash.com/docs#matches). Example of a deep matching :

  ```javascript
  primus.$on('node:update', {content: {id: 23, type: 'image'}}, …)
  ```
* a function, taking the received data as arguments and returning true/false = match/don't match

Both `$on` and `$filteredOn` will call the listener **in Angular context**, in an optimized way via [$evalAsync](http://www.bennadel.com/blog/2751-scope-applyasync-vs-scope-evalasync-in-angularjs-1-3.htm). So if you have several listeners on the same event, they will all get executed in the same $digest phase.

`$filteredOn` will not trigger any apply if the received data doesn't match the given filter. This is desirable if your Angular app is heavy.

## License

MIT
