define([
  'butterfly/view'
  ], function(View){

  return View.extend({
    events: {
      "click a[data-action='back']": "goBack",
    },

    onShow: function(options){
      if (options) this.$('#result').html(options.message);
    },

    goBack: function(){
      window.history.back();
    }
  });
});
