var expect = chai.expect;

describe('Primus provider', function () {

  beforeEach(function () {
    module('primus');

    window.Primus = sinon.spy(function () {
      var self = this;

      this.listeners = {};

      this.on = sinon.spy(function (event, listener) {
        self.listeners[event] = listener;
      });

      this.removeListener = sinon.spy(function (event, listener) {
        delete self.listeners[event];
      });

      this.emit = function (event) {
        if (self.listeners[event]) self.listeners[event]();
      };

      this._resource = {
        listeners: {},
        once: function (event, listener) {
          this.listeners[event] = listener;
        },
        trigger: function (event) {
          if (this.listeners[event]) this.listeners[event]();
        }
      };

      this.resource = sinon.spy(function () {
        return self._resource;
      });
    });
  });

  describe('#setOptions', function () {
    it('should define options', function () {
      module(function (primusProvider) {
        primusProvider.setOptions({ foo: 'bar' });
      });

      inject(function (primus) {
        expect(Primus).to.be.calledWith(undefined, { foo: 'bar' });
      });
    });
  });

  describe('#setEndpoint', function () {
    it('should define endpoint', function () {
      module(function (primusProvider) {
        primusProvider.setEndpoint('http://mywebsite.com/');
      });

      inject(function (primus) {
        expect(Primus).to.be.calledWith('http://mywebsite.com/');
      });
    });
  });

  describe('#$on', function () {
    var primus, $rootScope;

    beforeEach(inject(function ($injector) {
      $rootScope = $injector.get('$rootScope');
      primus = $injector.get('primus');
    }));

    it('should wrap method in $rootScope.$apply', function () {
      var watchSpy = sinon.spy();
      $rootScope.$watch(watchSpy);

      expect(watchSpy).to.not.be.called;

      var listener = sinon.spy();

      primus.$on('customEvent', listener);
      primus.emit('customEvent');

      expect(listener).to.be.called;
      expect(watchSpy).to.be.called;
    });

    it('should return a deregistration method', function () {
      var listener = sinon.spy();
      var off = primus.$on('customEvent', listener);

      off();
      primus.emit('customEvent');

      expect(listener).to.not.be.called;
    });
  });

  describe('#$resource', function () {
    var primus, $rootScope;

    beforeEach(inject(function ($injector) {
      primus = $injector.get('primus');
      $rootScope = $injector.get('$rootScope');
    }));

    it('should resolve resource only when ready', function () {
      var spy = sinon.spy();
      primus.$resource('myresource').then(spy);

      expect(spy).to.not.be.called;

      primus._resource.trigger('ready');

      $rootScope.$digest();
      expect(spy).to.be.calledWith(primus._resource);
    });

    it('should resolve resource if already ready', function () {
      primus.$resource('myresource');
      primus._resource.trigger('ready');

      var spy = sinon.spy();
      primus.$resource('myresource').then(spy);

      $rootScope.$digest();
      expect(spy).to.be.calledWith(primus._resource);
    });
  });
});