define(['butterfly/view', "main/util", "main/client"], function(View, Util, Client){

  return View.extend({

    render: function(){
    	console.log("main on render");
    	if (location.hash.indexOf("channel") != -1){
    		butterfly.navigate("#channels/channels.html")
    	} else if (location.hash.indexOf("list") != -1) {
            butterfly.navigate("#download-list/download-list.html")
        } else {
    		butterfly.navigate("#player/player.html")
    	}
    },

    onShow: function(){
    
    },

  });
});
