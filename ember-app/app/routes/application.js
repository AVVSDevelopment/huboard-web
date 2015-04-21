import SocketMixin from 'app/mixins/socket';
import Ember from 'ember';
import Repo from 'app/models/new/repo';
import animateModalClose from 'app/config/animate-modal-close';
import ajax from 'ic-ajax';



var ApplicationRoute = Ember.Route.extend({
  actions: {
    sessionErrorHandler: function(){
      this.render("login", { into: 'application', outlet: 'modal' });
    },
    loading: function(){
      if(this.router._activeViews.application){
        this.render("loading",{ "into" : "application", "outlet" : "loading"});
        this.router.one('didTransition', function() {
          this.render("empty",{ "into" : "application", "outlet" : "loading"});
        }.bind(this));
        return true;
      }
      this.render("loading");
    },
    toggleSidebar: function(){
      this.controllerFor("application").toggleProperty("isSidebarOpen");
    },
    openModal: function (view){
      this.render(view, {
        into: "application",
        outlet: "modal"
      });
    },
    closeModal: function() {
      animateModalClose().then(function() {
        this.render('empty', {
          into: 'application',
          outlet: 'modal'
        });
      }.bind(this));
    },
    clearFilters: function(){
      this.controllerFor("filters").send("clearFilters");
      this.controllerFor("assignee").send("clearFilters");
      this.controllerFor("search").send("clearFilters");
    }
  },
  model: function () {
    var socket = this.get("socket");
    return ajax(`/api/v2/${App.get('repo.full_name')}`).then(function(result){
      socket.subscribeTo(result.data.repo.full_name);
      result.data.links.forEach((link) => socket.subscribeTo(link.repo.full_name)); 
      return Repo.create(result);
    });
  },
  setupController: function(controller){
    this._super.apply(this, arguments);
    SocketMixin.apply(controller);
    controller.setUpSocketEvents();
    Ember.$(document).ajaxError(function(event, xhr){
      if(App.get('loggedIn') && xhr.status === 404){
        this.send("sessionErrorHandler");
      }
      if(App.get('loggedIn') && xhr.status === 422){
        var contentType = xhr.getResponseHeader("Content-Type"),
            isJson = contentType.indexOf("application/json") === 0;

        if(isJson) {
          var message = JSON.parse(xhr.responseText);
          if(message.error === "CSRF token is expired") {
            this.send("sessionErrorHandler");
          }
        }
      }
    }.bind(this));
  }
});

export default ApplicationRoute;
