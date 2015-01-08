define(['butterfly/view', "main/util", "main/client"], function(View, Util, Client){

  return View.extend({

    render: function(){
        if (location.hash == "") {
            butterfly.navigate("#player/player.html");
        }

        var query = location.hash.split("?")[1];
        if ( query && query.indexOf("channel") == -1 && query.indexOf("record") == -1 && query.indexOf("offline") == -1) {
            butterfly.navigate("#player/player.html")
        }
    },

    onShow: function(){
    
    },

  });
});
