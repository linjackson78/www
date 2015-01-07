define(['butterfly/view', "main/util", "main/client", "css!download-list/download-list.css"], function(View, Util, Client, CSS){
	return View.extend({

		events: {
			"click .back": "toPlayer",
			"click #offline": "toggleOffline",
			"click #record": "toggleRecord",
		},

		render: function(){

		},

		onShow: function(){
			var _this = this;
			if (!_this.songListScroller) {
				_this.songListScroller = new IScroll(".song-list-wrapper")
			}
		},

		toPlayer: function(){
			history.back();
		},

		toggleRecord: function(){
			var songRecord = Util.getData("songRecord") || null;
			songRecord.forEach(function(record, index){
				
			})
		},

		toggleOffline: function(){

		},
	});
})