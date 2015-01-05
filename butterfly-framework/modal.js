define([
  'butterfly/view',
  'view!butterfly-framework/modal-content.html'
  ], function(View, ModalView){

  return View.extend({
    events: {
      "click #open": "onOpen",
      "click a[data-action='back']": "goBack"
    },

    goBack: function(){
      window.history.back();
    },

    onOpen: function(){
      new ModalView().doModal();
    }
  });
});
