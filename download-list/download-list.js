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
			    console.log("device ready!")
			    _this.myRoot = cordova.file.externalRootDirectory + "myDouban/";
			    window.resolveLocalFileSystemURL(_this.myRoot, function(entry){
			    	_this.myRootEntry = entry;
			    	
			    }, _this.err)
			})
			_this.showRecord();
		},

		toPlayer: function(e){
			var _this = this;
			var $target = $(e.target).closest("li")
			if ($(e.target).hasClass("back")) history.back();
			if ($target.hasClass("offline-li")) butterfly.navigate("#player/player.html?offline=" + $target.data("id"))
			if ($target.hasClass("record-li")) butterfly.navigate("#player/player.html?record=" + $target.data("id"))
		},

		showRecord: function(e){
			var _this = this;
			var songRecord = Util.getData("songRecord")
			var html = "";
			if (songRecord) {
				songRecord.forEach(function(record, index){
					html += "<li class='record-li' data-id='"+ record.title + "'><span class='li-title'>" + record.title + "</span><span class='li-artist'>" + record.artist + "</span></li>"
				})
			} else {
				html = "<li class='error-li'> 没有收听纪录的说~ </li>";
			}
			$(".record-song-list").html(html).show();
			$(".offline-song-list").hide();
			$("#offline").removeClass("song-nav-tab-active")
			$("#record").addClass("song-nav-tab-active")
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
				console.log("rendentries done", entries)
				var html = "";
				if (entries.length) {
					entries.sort();
					entries.forEach(function(entry){
						if (entry.name.indexOf("_channelCache") == -1) {
							var match = entry.name.match(/(.+?)-(.+)/);
							html += "<li class='offline-li' data-id='"+ entry.name + "'><span class='li-title'>" + match[1] + "</span><span class='li-artist'>" + match[2] + "</span></li>"
						}
					})
				} else {
					html = "<li class='error-li'> 还没下载过歌曲的说~ </li>";
				}
				$(".offline-song-list").html(html).show();
				$(".record-song-list").hide();
				$("#offline").addClass("song-nav-tab-active")
				$("#record").removeClass("song-nav-tab-active")
				_this.songListScroller.refresh();
			}
		},
	});
})