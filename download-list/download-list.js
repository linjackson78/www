define(['butterfly/view', "main/util", "main/client", "css!download-list/download-list.css"], function(View, Util, Client, CSS){
	return View.extend({

		events: {
			"click .back": "toPlayer",
			"click #offline": "showOffline",
			"click #record": "showRecord",
			"click .offline-li": "toPlayer",
			"click .record-li": "toPlayer"
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
			    	
			    })
			})
			_this.showRecord();
		},

		toPlayer: function(e){
			var _this = this;
			var $target = $(e.target)
			if ($target.hasClass("back")) history.back();
			if ($target.hasClass("offline-li")) butterfly.navigate("#player/player.html?offline=" + $target.text())
			if ($target.hasClass("record-li")) butterfly.navigate("#player/player.html?record=" + $target.data("id"))
		},

		showRecord: function(){
			var _this = this;
			var songRecord = Util.getData("songRecord")
			var html = "";
			songRecord.forEach(function(record, index){
				html += "<li class='record-li' data-id='"+ record.title + "'>" + record.title + "-" + record.artist + "</li>"
			})
			$(".record-song-list").html(html).show();
			$(".offline-song-list").hide();
			_this.songListScroller.refresh();
		},

		showOffline: function(){
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
					if (entry.name.indexOf("channelCache") == -1) {
						html += "<li class='offline-li'>"
						+ "</li>";
					}

				})
				$(".offline-song-list").html(html).show();
				$(".record-song-list").hide();
				_this.songListScroller.refresh();
			}
		},
	});
})