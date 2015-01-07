define(['butterfly/view', "main/util", "main/client", "css!download-list/download-list.css"], function(View, Util, Client, CSS){
	return View.extend({

		events: {
			"click .back": "toPlayer",
			"click #offline": "toggleOffline",
			"click #record": "toggleRecord",
			"click .offline-li": "toPlayer"
		},

		err: function(e){
			console.log(e)
		},

		render: function(){

		},

		onShow: function(){
			var _this = this;
			if (!_this.songListScroller) {
				_this.songListScroller = new IScroll(".song-list-wrapper")
			}

			document.addEventListener("deviceready", function(){
			    _this.isDeviceReady = true;
			    _this.myRoot = cordova.file.externalRootDirectory + "myDouban/";
			    window.resolveLocalFileSystemURL(_this.myRoot, function(entry){
			    	_this.myRootEntry = entry;
			    	_this.toggleOffline();
			    })
			})
		},

		toPlayer: function(e){
			var _this = this;
			var $target = $(e.target)
			if ($target.hasClass("back")) history.back();
			if ($target.hasClass("offline-li")) butterfly.navigate("#player/player.html?offline=" + $target.text())
		},

		toggleRecord: function(){
			var songRecord = Util.getData("songRecord") || null;
			songRecord.forEach(function(record, index){
				
			})
		},

		toggleOffline: function(){
			var _this = this;
			var dirReader = _this.myRootEntry.createReader();
			var entries = [];
			var readEntries = function(){
				dirReader.readEntries(function(result){
					if (!result.length) {
						readEntriesDone(entries);
						return;
					};
					entries = entries.concat(toArray(result));
					readEntries();
				}, _this.err)
			}
			readEntries();

			function toArray(list) {
			  return Array.prototype.slice.call(list || [], 0);
			}

			function readEntriesDone(entries){
				var html = "";
				entries.forEach(function(entry){
					html += "<li class='offline-li'>" 
					+ entry.name.replace(".mp3", "")
					+ "</li>";

				})
				$(".offline-song-list").html(html)

			}
		},
	});
})