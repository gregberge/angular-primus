/*! Angular primus v1.0.1 | (c) 2013 Greg Bergé | License MIT */

angular
.module('primus', [])
.provider('primus', primusProvider);

function primusProvider() {
  var provider = this;

  /**
   * Expose primus service.
   */

  this.$get = ['$rootScope', '$q', primusService];

  /**
   * Create a new Primus service.
   */

  function primusService($rootScope, $q) {
    var primus = new Primus(this.endpoint, this.options);
    var resourceDefers = {};

    /**
     * Listen on events of a given type.
     * Calls the listener inside in Angular context ($evalAsync)
     *
     * @param {String} event
     * @param {Function} listener
     * @returns {Function} Deregistration function for this listener.
     */

    primus.$on = function $on(event, listener) {
      // run the listener in Angular context
      primus.on(event, listenerInAngularContext);

      function listenerInAngularContext() {
        var args = arguments;
        $rootScope.$evalAsync(function () {
          listener.apply(null, args);
        });
      }

      // Return the deregistration function
      return function $off() {
        primus.removeListener(event, listenerInAngularContext);
      };
    };

    /**
     * Listen on events of a given type, with a filtering pattern.
     * If the pattern matches, calls the listener in Angular context ($evalAsync)
     *
     * @param {String} event
     * @param {Object|Function} matchPattern
     *                          - as a function returning true/false
     *                          - as an object used as lodash _.matches param
     * @param {Function} listener
     * @returns {Function} Deregistration function for this listener.
     */

    primus.$filteredOn = function $filteredOn(event, matchPattern, listener) {

      var checkMatch;
      if (_.isFunction(matchPattern))
        checkMatch = matchPattern;
      else if (_.isObject(matchPattern))
        checkMatch = _.matches(matchPattern);
      else
        throw new Error('angular-primus $filteredOn() : matchPattern must be a function or an object !');

      // run the listener in Angular context
      primus.on(event, filteredListenerInAngularContext);

      function filteredListenerInAngularContext() {
        var args = arguments;
        var isMatching = checkMatch(args[0]);
        if (! isMatching) return;

        $rootScope.$evalAsync(function () {
          listener.apply(null, args);
        });
      }

      // Return the deregistration function
      return function $off() {
        primus.removeListener(event, filteredListenerInAngularContext);
      };
    };

    /**
     * Get a resource with promise.
     * Promise is resolved with resource when the resource is ready.
     *
     * @param {String} name
     * @param {Boolean} multiplex
     * @returns {Promise}
     */

    primus.$resource = function $resource(name, multiplex) {
      multiplex = typeof multiplex === 'undefined' ? provider.multiplex : multiplex;

      // If already defined, return promise.
      if (resourceDefers[name]) return resourceDefers[name].promise;

      // Register a new deferred.
      resourceDefers[name] = $q.defer();

      // Create a new resource.
      var resource = primus.resource(name, multiplex);

      // Resolve promise when resource is ready.
      resource.once('ready', function onReady() {
        resourceDefers[name].resolve(resource);
        $rootScope.$apply();
      });

      // Return promise.
      return resourceDefers[name].promise;
    };

    return primus;
  }

  /**
   * Define options.
   *
   * @param {Object} options
   * @returns {primusProvider}
   */

  this.setOptions = function setOptions(options) {
    this.options = options;
    return this;
  };

  /**
   * Define endpoint.
   *
   * @param {String} endpoint
   * @returns {primusProvider}
   */

  this.setEndpoint = function setEndpoint(endpoint) {
    this.endpoint = endpoint;
    return this;
  };

  /**
   * Set the default multiplex option for resource.
   *
   * @param {Boolean} multiplex
   * @returns {primusProvider}
   */

  this.setDefaultMultiplex = function setDefaultMultiplex(multiplex) {
    this.multiplex = multiplex;
    return this;
  };
}
