import Ember from 'ember';

var IssueSocketMixin = Ember.Mixin.create({
  sockets: {
    config: {
      messagePath: "issueNumber",
      channelPath: "repositoryName"
    },
    milestone_changed: function(message) {
       this.get("issue").set("milestone", message.issue.milestone);
    },
    issue_status_changed: function(message){
       this.get("issue").set("_data", message.issue._data);
    },
    issue_archived: function(){
      this.get('issue').set('isArchived', true);
    },
    issue_closed: function(message) {
       this.get("issue").set("state", message.issue.state);
    },
    assigned: function(message) {
       this.get("issue").set("assignee", message.issue.assignee);
    },
    moved: function (message) {
      this.get('issue').setProperties({
        current_state : message.issue.current_state,
        _data: message.issue._data
      });
    },
    reordered: function (message) {
       this.get("issue").set("current_state", message.issue.current_state);
       this.get("issue").set("_data", message.issue._data);
    }
  }
});

export default IssueSocketMixin;
