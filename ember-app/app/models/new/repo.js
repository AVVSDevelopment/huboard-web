import Ember from 'ember';
import Model from '../model';
import Board from './board';
import Issue from './issue';

var PromiseObject = Ember.Object.extend(Ember.PromiseProxyMixin);
var Repo = Model.extend({
  parent: null,
  baseUrl: Ember.computed('data.full_name', function () {
    return `/api/v2/${this.get('data.repo.full_name')}`;
  }),
  userUrl :function () {
    return "/" + this.get("data.owner.login");
  }.property("owner.login"),
  repoUrl :function () {
    return `${this.get('userUrl')}/${this.get("data.repo.name")}`;
  }.property("data.repo.name",'userUrl'),
  issues: Ember.computed(function(){
    var self = this;
    return PromiseObject.create({
      promise: new Ember.RSVP.Promise(function(resolve, reject){
        self.get('ajax')(`${self.get('baseUrl')}/issues`).then(function(issues){
          var results = Ember.A();
          issues.data.forEach(function(i){
            var issue = Issue.create({data: i, repo: self}); 
            results.pushObject(issue);
          });
          resolve(results);
        }, reject);
      })
    });
  }),
  links: Ember.computed('data.links', function(){
    var self = this, 
      links = this.get('data.links');
    var response = Ember.A();
    links.forEach(function(link){
      var repo = Repo.create({ data: link });
      repo.set('parent', self);
      response.pushObject(repo);
    });
    return response;
  }),
  board: Ember.computed(function(){
    //fetch links first? ... no load them with the repo
    return Board.fetch(this);
  })
});

export default Repo;
