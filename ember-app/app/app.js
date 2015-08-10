import Ember from 'ember';
import Resolver from 'ember/resolver';
import loadInitializers from 'ember/load-initializers';
import config from './config/environment';
import correlationId from './utilities/correlation-id';
import Settings from 'app/models/settings';
import Global from 'app/models/global';

Ember.MODEL_FACTORY_INJECTIONS = true;

Ember.LinkView.reopen({
  init: function(){
    this._super.apply(this, arguments);

    this.on("click", this, this._closeDropdown);
  },
  tearDownEvent: function(){
    this.off("click");
  }.on("willDestroyElement"),
  _closeDropdown : function() {
    this.$().parents(".dropdown").removeClass("open");
  }
});

Ember.onLoad("Ember.Application", function ($app) {
  $app.initializer({
    name: 'deferReadiness',
    initialize: function(container, application){
      application.deferReadiness();
    }
  });
  $app.initializer({
    name: "sockets",
    initialize : function (container, application){

      let socket = Ember.Object.extend({
        correlationId : correlationId,
        sockets: {},
        subscribe: Ember.K,
        unsubscribe: Ember.K,
        subscribeTo: Ember.K
      });

      if(application.get("socketBackend")){
        socket = Ember.Object.extend({
          correlationId : correlationId,
          sockets: {},
          client: new Faye.Client(application.get('socketBackend')),
          publish: function(message){
            var channel = message.meta.channel.toLowerCase();
            this.get('sockets')[channel].callbacks.fire(message);
          },
          subscribe: function (channel, callback) {
            channel = channel.toLowerCase();
            if(!this.get("sockets")[channel]){
              this.subscribeTo(channel);
            }
            this.get("sockets")[channel].callbacks.add(callback);
            return callback;
          },
          unsubscribe: function(channel, callback) {
            channel = channel.toLowerCase();
            this.get("sockets")[channel].callbacks.remove(callback);
          },
          subscribeTo: function(channel) {
            channel = channel.toLowerCase();
            var client = this.get('client'), 
            callbacks = Ember.$.Callbacks();
            client.disable("eventsource");
            var source = client.subscribe("/" + channel, function(event){
              callbacks.fire(event);
            });
            this.get("sockets")[channel] = {
              source: source,
              callbacks: callbacks
            };
          }
        });
      } 
      application.set("Socket", socket);

      application.register('socket:main',application.Socket, {singleton: true});
      application.inject('socket:main', 'repo', 'repo:main');

      application.inject("controller","socket", "socket:main");
      application.inject("component","socket", "socket:main");
      application.inject("model", "socket", "socket:main");
      application.inject("route", "socket", "socket:main");
      application.inject("service", "socket", "socket:main");
    }
  });
  $app.initializer({
    name: "settings",
    before: "sockets",
    after: 'advanceReadiness',
    initialize: function(container, application) {
      application.register('repo:main', application.get("repo"), {instantiate: false});
      application.register('settings:main', Settings);
      application.inject('settings:main', 'repo', 'repo:main');
      application.inject('controller', 'settings', 'settings:main');
      application.inject('view', 'settings', 'settings:main');
      application.inject('component', 'settings', 'settings:main');

      application.register('global:main', Global);
      application.inject('controller', 'global', 'global:main');
      application.inject('view', 'global', 'global:main');
    }
  });
});

var HuBoard = Ember.Application.extend({
  modulePrefix: config.modulePrefix,
  podModulePrefix: config.podModulePrefix,
  Resolver: Resolver,
  rootElement: "#application",
  dimFilters: [],
  hideFilters: [],
  searchFilter: null,
  memberFilter: null,
  eventReceived: 0
});

loadInitializers(HuBoard, config.modulePrefix);

export default HuBoard;
