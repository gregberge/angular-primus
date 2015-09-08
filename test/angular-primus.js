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

      this.emit = function (event, data) {
        if (self.listeners[event]) self.listeners[event](data);
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

  describe('#setDefaultMultiplex', function () {
    it('should define the default resource multiplex', function () {
      module(function (primusProvider) {
        primusProvider.setDefaultMultiplex(false);
      });

      inject(function (primus) {
        primus.$resource('myresource');
        expect(primus.resource).to.be.calledWith('myresource', false);
      });
    });

    it('should be the default option', function () {
      module(function (primusProvider) {
        primusProvider.setDefaultMultiplex(false);
      });

      inject(function (primus) {
        primus.$resource('myresource', true);
        expect(primus.resource).to.be.calledWith('myresource', true);
      });
    });

    it('should work without', function () {
      inject(function (primus) {
        primus.$resource('myresource');
        expect(primus.resource).to.be.calledWith('myresource', undefined);
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
      var myListener = sinon.spy();
      var off = primus.$on('customEvent', myListener);

      off();
      primus.emit('customEvent');

      expect(myListener).to.not.be.called;
    });
  });

  describe('#$filteredOn', function () {
    var $rootScope, primus, listenerSpy, watchSpy;
    var digestWasInProgress;

    beforeEach(function() {
    });

    beforeEach(inject(function ($injector) {
      $rootScope = $injector.get('$rootScope');
      primus = $injector.get('primus');

      digestWasInProgress = undefined;
      listenerSpy = sinon.spy(function () {
        digestWasInProgress = !!$rootScope.$$phase;
      });

      watchSpy = sinon.spy();
      $rootScope.$watch(watchSpy);
    }));

    describe("filtering", function () {

      describe("by properties passed as an object", function () {

        it('should match correctly', function () {
          primus.$filteredOn('customEvent', {itemId: 1}, listenerSpy);

          // base
          listenerSpy.reset();
          primus.emit('customEvent', {itemId: 1});
          expect(listenerSpy, 'listenerSpy').to.have.been.calledOnce;

          // variant
          listenerSpy.reset();
          primus.emit('customEvent', {
            itemId: 1,
            content: {
              foo: 42
            }
          });
          expect(listenerSpy, 'listenerSpy').to.have.been.calledOnce;
        });

        it('should filter correctly', function () {
          primus.$filteredOn('customEvent', {itemId: 1}, listenerSpy);

          // not the same value
          primus.emit('customEvent', {itemId: 11});
          expect(listenerSpy, 'listenerSpy').to.not.have.been.called;

          // not the same key / missing key
          primus.emit('customEvent', {id: 1});
          expect(listenerSpy, 'listenerSpy').to.not.have.been.called;

          // nothing at all
          primus.emit('customEvent', 42);
          expect(listenerSpy, 'listenerSpy').to.not.have.been.called;
        });

        it('should deep match correctly', function () {
          primus.$filteredOn('customEvent', {content: {id: 1}}, listenerSpy);

          // base
          listenerSpy.reset();
          primus.emit('customEvent', {content: {id: 1}});
          expect(listenerSpy, 'listenerSpy').to.have.been.calledOnce;

          // variant
          listenerSpy.reset();
          primus.emit('customEvent', {
            itemId: 1,
            content: {
              id: 1,
              foo: 42
            }
          });
          expect(listenerSpy, 'listenerSpy').to.have.been.calledOnce;
        });

        it('should deep filter correctly', function () {
          primus.$filteredOn('customEvent', {content: {id: 1}}, listenerSpy);

          // not the same value
          primus.emit('customEvent', {content: {id: 11}});
          expect(listenerSpy, 'listenerSpy').to.not.have.been.called;

          // not the same key / missing key
          primus.emit('customEvent', {content: {itemId: 1}});
          expect(listenerSpy, 'listenerSpy').to.not.have.been.called;

          // nothing at all
          primus.emit('customEvent', 42);
          expect(listenerSpy, 'listenerSpy').to.not.have.been.called;
        });

        it('should combo match correctly', function () {
          primus.$filteredOn('customEvent', {id: 1, content: {id: 1}}, listenerSpy);

          // base
          listenerSpy.reset();
          primus.emit('customEvent', {id: 1, content: {id: 1}});
          expect(listenerSpy, 'listenerSpy').to.have.been.calledOnce;

          // variant
          listenerSpy.reset();
          primus.emit('customEvent', {
            id: 1,
            foo: 42,
            content: {
              id: 1,
              bar: 33
            }
          });
          expect(listenerSpy, 'listenerSpy').to.have.been.calledOnce;
        });

        it('should combo filter correctly', function () {
          primus.$filteredOn('customEvent', {id: 1, content: {id: 1}}, listenerSpy);

          // not the same value - 1
          primus.emit('customEvent', {id: 11, content: {id: 1}});
          expect(listenerSpy, 'listenerSpy').to.not.have.been.called;

          // not the same value - 2
          primus.emit('customEvent', {id: 1, content: {id: 11}});
          expect(listenerSpy, 'listenerSpy').to.not.have.been.called;

          // missing key - 1
          primus.emit('customEvent', {id: 1});
          expect(listenerSpy, 'listenerSpy').to.not.have.been.called;

          // missing key - 2
          primus.emit('customEvent', {content: {id: 1}});
          expect(listenerSpy, 'listenerSpy').to.not.have.been.called;

          // nothing at all
          primus.emit('customEvent', 42);
          expect(listenerSpy, 'listenerSpy').to.not.have.been.called;
        });

      });

      describe("by function", function () {
        var testFunction = function(data) {
          return !!(data.id % 2);
        };

        it('should match correctly', function () {
          primus.$filteredOn('customEvent', testFunction, listenerSpy);

          listenerSpy.reset();
          primus.emit('customEvent', {id: 1});
          expect(listenerSpy, 'listenerSpy').to.have.been.calledOnce;

          listenerSpy.reset();
          primus.emit('customEvent', {id: 3});
          expect(listenerSpy, 'listenerSpy').to.have.been.calledOnce;
        });

        it('should filter correctly', function () {
          primus.$filteredOn('customEvent', testFunction, listenerSpy);

          primus.emit('customEvent', {id: 0});
          expect(listenerSpy, 'listenerSpy').to.not.have.been.called;

          primus.emit('customEvent', {id: 20});
          expect(listenerSpy, 'listenerSpy').to.not.have.been.called;
        });
      });

    });

    it('when calling callback, should wrap it in $rootScope.$apply', function () {
      expect(listenerSpy, 'listenerSpy').to.not.have.been.called;
      expect(watchSpy, 'watchSpy').to.not.have.been.called;

      primus.$filteredOn('customEvent', {id: 1}, listenerSpy);
      primus.emit('customEvent', {id: 1});

      expect(listenerSpy, 'listenerSpy').to.have.been.calledOnce;
      expect(digestWasInProgress).to.be.true;
      expect(watchSpy, 'watchSpy').to.have.been.calledTwice;
    });

    it('when NOT calling callback, should NOT call $rootScope.$apply', function () {
      expect(listenerSpy, 'listenerSpy').to.not.have.been.called;
      expect(watchSpy, 'watchSpy').to.not.have.been.called;

      primus.$filteredOn('customEvent', {id: 1}, listenerSpy);
      primus.emit('customEvent', {id: 2});

      expect(listenerSpy, 'listenerSpy').to.not.have.been.called;
      expect(watchSpy, 'watchSpy').to.not.have.been.called;
    });

    it('should return a working deregistration method', function () {
      var off = primus.$filteredOn('customEvent', {id: 1}, listenerSpy);

      off();
      primus.emit('customEvent', {id: 1});

      expect(listenerSpy, 'listenerSpy').to.not.have.been.called;
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
