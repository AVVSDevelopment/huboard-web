import SocketMixin from 'app/mixins/socket';
import Ember from 'ember';
import Repo from 'app/models/repo';
import animateModalClose from 'app/config/animate-modal-close';



var ApplicationRoute = Ember.Route.extend({
  actions: {
    sessionErrorHandler: function(){
      this.transitionTo("unauthorized");
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
    return new Ember.RSVP.Promise(function(resolve){
       Ember.run.once(function(){
        console.log("TODO: fix this call to App");
        var repo = App.get("repo");
        resolve(Repo.create(repo));
       });
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
