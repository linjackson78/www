define(['butterfly/view'], function(View){

  return View.extend({
    events: {
      "click #close": "close"
    },

    close: function(){
      this.dismiss();
    }
  });
});
