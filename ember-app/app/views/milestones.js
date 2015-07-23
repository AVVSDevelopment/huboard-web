import Ember from 'ember';

var MilestonesView = Ember.View.extend({
  classNameBindings: ["dragging:board-dragging:board-not-dragging"],
  dragging: false,
  setupDragging: function(){
    var that = this;
    this.$(".board").sortable({
      axis: 'x',
      tolerance: 'pointer',
      handle: 'h3',
      placeholder: "milestone-placeholder",
      items: ".milestone:gt(0)",
      over: function () {
        that.set("isHovering", true);
      },
      out: function () {
        that.set("isHovering", false);
      },
      start: function(){
        that.set('dragging', true);
      },
      stop: function() {
        that.set('dragging', false);
      },
      update: function (ev, ui) {

        var findViewData = function (element){
          return that.get("controller.registeredColumns").find(function(el){
            return el.$().is(element);
          });
        };

        var elements = Ember.$(".milestone:not(.no-milestone)", that.$()),
        index = elements.index(ui.item);

        if(index === -1) { return; }

        var first = index === 0,
        last = index === elements.size() - 1,
        currentElement = Ember.$(ui.item),
        currentData = findViewData(currentElement),
        beforeElement = elements.get(index ? index - 1 : index),
        beforeData = findViewData(beforeElement),
        afterElement = elements.get(elements.size() - 1 > index ? index + 1 : index),
        afterData = findViewData(afterElement),
        before = beforeData.get("model.milestone._data.order") || beforeData.get("model.milestone.number"),
        after = afterData.get("model.milestone._data.order") || afterData.get("model.milestone.number");

        if(first && last) {
          that.get("controller").milestoneMoved(currentData, currentData.get("model.milestone.number"));
          return;
        }
        
        if(first) {
          that.get("controller").milestoneMoved(currentData, (after || 1)/2);
          // dragged it to the top

        } else if (last) {
          // dragged to the bottom
          that.get("controller").milestoneMoved(currentData, (before + 1));

        }  else {
          that.get("controller").milestoneMoved(currentData, (((after + before) || 1)/2));
        }
      }
    });

  }.on("didInsertElement"),
});

export default MilestonesView;
