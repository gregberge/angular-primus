/*! Angular primus v0.2.2 | (c) 2013 Greg Bergé | License MIT */

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
     * This event make an $rootScope.$apply on the listener.
     *
     * @param {String} event
     * @param {Function} listener
     * @returns {Function} Deregistration function for this listener.
     */

    primus.$on = function $on(event, listener) {
      // Wrap primus event with $rootScope.$apply.
      primus.on(event, applyListener);

      function applyListener() {
        var args = arguments;
        $rootScope.$apply(function () {
          listener.apply(null, args);
        });
      }

      // Return the deregistration function
      return function $off() {
        primus.removeListener(event, applyListener);
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