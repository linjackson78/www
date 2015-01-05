define([
  'butterfly/view',
  '../editor/jquery.autosize'
  ], function(View){

  return View.extend({
    events: {
      "click a[data-action='back']": "goBack",
      "click #forward": "onForward",
      "click #callback": "onCallback"
    },

    render: function(){
      this.$('textarea').autosize();
    },

    goBack: function(){
      window.history.back();
    },

    onForward: function(){
      window.butterfly.navigate(
        'butterfly-framework/routing/forward.html',
        {message: this.$('textarea').val()}
      );
    },

    onCallback: function(){
      window.butterfly.navigate('butterfly-framework/routing/forward.html');
    },
  });
});
