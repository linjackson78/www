define(['butterfly/view', "main/util", "main/client", "main/parseLrc", "css!player/player"], function(View, Util, Client, lrcParser, CSS) {

    return View.extend({

        downloadQue: {},
        isDeviceReady: false,
        hasLrc: false,
        hasInit: false,
        query: {},
        currentChannel: 1,
        oldChannel: null,

        events: {
            "click #next": "next",
            "click #cover": "togglePlay",
            "click .current-channel": "toChannels",
            "click .lrc-ctrl": "toggleLrc",
            "click .download-pannel-ctrl": "toggleDownloadPannel",
            "click .download-btn": "download",
            "click .download-list-btn": "toDownloadList",
        },

        err: function(e) {
            console.log("error!!!!!!!:", e);
        },
        render: function() {
            var _this = this;
        },

        onShow: function() {
            var _this = this;
            _this.song = document.getElementById("song");
            _this.$song = $("#song")
            _this.$lrc = $("#lrc")
            _this.canvas = document.getElementById("progress")
            _this.context = _this.canvas.getContext("2d");
            var queryStr = location.hash.split("?")[1]
            if (!queryStr) {
                _this.query.mode = "channel";
                _this.query.target = 1;
            } else {
                _this.query.mode = queryStr.match(/(.*)=/)[1];
                _this.query.target = queryStr.match(/=(.*)/)[1];
            }

            switch (_this.query.mode) {
                case "channel":
                    _this.currentChannel = _this.query.target;
                    break;

                case "record":
                    _this.oldChannel = _this.currentChannel;
                    var hasNoRecord = true;
                    var songList = Util.getData("songRecord");
                    if (songList) {
                        songList.forEach(function(obj, index) {
                            if (obj.title == _this.query.target) {
                                _this.next(_this.query.mode, obj)
                                hasNoRecord = false;
                                history.pushState({
                                    test: "test"
                                }, null, location.pathname + "#player/player.html")
                            }
                        })
                    }
                    if (hasNoRecord) {
                        _this.next("channel", _this.currentChannel)
                    }
                    break;

                case "offline":
                    _this.currentChannel = 0;
            }

            if (_this.currentChannel) {
                _this.requestChannelDetail(_this.currentChannel);
            } else if (_this.currentChannel === 0) {
                $(".current-channel").text("本地歌曲")
            }

            if (_this.currentChannel !== _this.oldChannel) {
                _this.next(_this.query.mode, _this.query.target)
            }

            if (!_this.hasInit) eventInit();

            function eventInit() {
                _this.hasInit = true;
                _this.song.onended = function() {
                    _this.next();
                };

                _this.song.ontimeupdate = onPlaying;

                function onPlaying() {
                    _this.progress();
                    if (_this.timeStampArray) {
                        var index = _this.timeStampArray.indexOf(Math.floor(_this.song.currentTime))
                        if (_this.lrcScroller && index !== -1) {
                            var $lrcP = _this.$lrc.find("p").removeClass("current-lrc");
                            var curEl = $lrcP.get(index)
                            _this.currentLrcEle = curEl;
                            if (curEl) {
                                curEl.className = "current-lrc";
                                if (!_this.isTouchingLrc) _this.lrcScroller.scrollToElement(curEl, 200, 0, true);
                            };
                        }
                    }
                }

                document.addEventListener("deviceready", function() {
                    _this.isDeviceReady = true;
                    _this.myRoot = cordova.file.externalRootDirectory + "myDouban/";
                    window.resolveLocalFileSystemURL(_this.myRoot, function(entry) {
                        _this.myRootEntry = entry;
                    }, _this.err)
                    console.log("device is ready!")
                    setInterval(onPlaying, 500)
                })

                $("#lrc").get(0).addEventListener("touchstart", function() {
                    _this.isTouchingLrc = true;
                })
                $("#lrc").get(0).addEventListener("touchend", function() {
                    _this.isTouchingLrc = false;
                    try {
                        setTimeout(function() {
                            if (_this.lrcScroller) _this.lrcScroller.scrollToElement(_this.currentLrcEle, 200, 0, true)
                        }, 700)
                    } catch (e) {}
                })
            }
        },

        onHide: function() {
            this.oldChannel = this.currentChannel;
        },

        requestChannelDetail: function(id) {
            var _this = this;
            Client.apiRequest({
                url: {
                    "path": "/j/explore/channel_detail",
                    "channel_id": id
                },
                success: function(data) {
                    $(".current-channel").text(data.data.channel.name)
                }

            })
        },

        next: function(mode, target) {
            var _this = this;
            _this.xhr4Song ? _this.xhr4Song.abort() : null;
            _this.xhr4Lrc ? _this.xhr4Lrc.abort() : null;
            _this.xhr4LrcCheck ? _this.xhr4LrcCheck.abort() : null;
            $(".lrc-content").html("<p class='error-tip'>正在加载歌词</p>")
            console.log("正在请求这首新歌的信息")
            _this.song ? _this.song.pause() : null;

            switch (mode) {
                case "record":
                    var song = target;
                    onSongChange(song.songSrc, song.coverSrc, song.title, song.artist.replace(/\s+\/\s+/g, "-"))
                    break;
                case "offline":
                    var offlineSongSrc;
                    var title = target.match(/=(.*)-/)[1];
                    var artist = target.match(/-(.*)/)[1]
                    _this.myRootEntry.getFile(target + ".mp3", {}, function(fileEntry) {
                        offlineSongSrc = fileEntry.nativeURL;
                        onSongChange(offlineSongSrc, "http://img5.douban.com/lpic/s6988468.jpg", title, artist)
                    }, _this.err)
                    break;
                default:
                    _this.xhr4Song = Client.apiRequest({
                        url: {
                            "path": "/j/app/radio/people",
                            "app_name": "radio_desktop_win",
                            "version": 100,
                            "type": "n",
                            "channel": target || _this.currentChannel || 1,
                        },
                        success: function(data) {
                            //data = Util.fakeData
                            var song = data.song[0]
                            onSongChange(song.url, song.picture, song.title, song.artist.replace(/\s+\/\s+/g, "-"))
                        }
                    });
            }

            function onSongChange(src, cover, title, artist) {
                $("#song").attr("src", _this.currentSongSrc = src).load();
                $("#cover").css("background-image", "url(" + (_this.currentSongPic = cover) + ")");
                $("#title").text(_this.currentSongTitle = title);
                $("#artist").text(_this.currentSongArtist = artist);
                var songRecord = Util.getData("songRecord") || [];
                var song = {
                    title: _this.currentSongTitle,
                    artist: _this.currentSongArtist,
                    coverSrc: _this.currentSongPic,
                    songSrc: _this.currentSongSrc,
                }
                songRecord.forEach(function(obj, index) {
                    if (song.songSrc == obj.songSrc) {
                        songRecord.splice(index, 1)
                    }
                })

                songRecord.unshift(song);
                Util.saveData("songRecord", songRecord)
                _this.searchBaidu(title, artist)
            }
        },

        searchBaidu: function(title, artist) {
            var _this = this;
            console.log("正在找歌词中")
            this.xhr4LrcCheck = Client.apiRequest({
                url: {
                    host: "http://tingapi.ting.baidu.com",
                    path: "/v1/restserver/ting",
                    from: "webapp_music",
                    method: "baidu.ting.search.catalogSug",
                    query: title + artist,
                    format: "json",
                },
                dataType: "json",
                success: function(data) {
                    if (data.song[0]) {
                        console.log("百度有这歌，正在查歌曲信息")

                        _this.getSongInfo(data.song[0].songid)
                    } else {
                        _this.loadLrc(null)
                    }
                }
            })
        },

        getSongInfo: function(id) {
            var _this = this;
            if (!id) return;
            Client.apiRequest({
                url: {
                    host: "http://ting.baidu.com",
                    path: "/data/music/links",
                    songids: id,
                },
                success: function(data) {
                    var url = "http://ting.baidu.com" + data.data.songList[0].lrcLink;
                    _this.loadLrc(url)
                }
            })
        },

        loadLrc: function(url) {
            var _this = this;
            if (!url) {
                lrcErr();
                return;
            }
            _this.currentLrcSrc = url;
            this.xhr4Lrc = Client.apiRequest({
                url: {
                    host: url, //http://ting.baidu.com/data2/lrc/13757624/13757624.lrc//这个有很多重复
                    path: "",
                    hasQuery: false,
                },
                cache: true,
                dataType: "text",
                success: function(data) {
                    var result = lrcParser.toPLabel(data)
                    var html = result.text;
                    _this.timeStampArray = result.timeStampArray;
                    if (_this.lrcScroller) _this.lrcScroller = null;
                    $(".lrc-content").html(html)
                    setTimeout(function() {
                        _this.lrcScroller = new IScroll("#lrc", {});
                        _this.lrcScroller.minScrollY = -400;
                    }, 1000)
                    console.log("总算下载完了真累")
                    _this.hasLrc = true;
                },
                error: function() {
                    lrcErr();
                }
            });

            function lrcErr() {
                console.log("没歌词！")
                $(".lrc-content").html("<span class='error-tip'>晕了又没有歌词</span>")
            }


        },

        download: function() {
            //if (!_this.deviceready) return;
            var _this = this;
            var isExist = false;
            var dirName = _this.myRoot + _this.currentSongTitle + "-" + _this.currentSongArtist

            if (!_this.isDeviceReady) return;
            checkExist(path);

            console.log("downloadIng!!!!!")

            function checkExist(path) {
                _this.myRootEntry.getDirectory(path, {
                    create: false
                }, function() {}, notExist)
            }

            function notExist() {
                mp3Downloader = downloadFile(_this.currentSongSrc,
                    dirName + ".mp3",
                    downloadSuccess)
                mp3Downloader.onprogress = function(e){
                    if (e.lengthComputable) {
                         mp3Downloader.percentage = (e.loaded / e.total);
                       }
                }
                coverDownloader = downloadFile(_this.currentSongPic,
                    dirName + ".jpg",
                    downloadSuccess)
                if (_this.currentLrcSrc) {
                    lrcDownloader = downloadFile(_this.currentLrcSrc,
                        dirName + ".lrc",
                        downloadSuccess)
                }
            }
            function downloadFile(url, path, successCb) {
                var fileTransfer = new FileTransfer();
                var url = encodeURI(url);
                fileTransfer.download(url, path, successCb, _this.err);
                return fileTransfer;
            }

            function downloadSuccess (entry){
                console.log("file-success!!!:", entry.name)
            }

        },

        toggleLrc: function() {
            var _this = this;
            $("#lrc").toggle();
            if (_this.lrcScroller) setTimeout(function() {
                _this.lrcScroller.refresh();
                _this.isTouchingLrc = false;
                try {
                    _this.lrcScroller.scrollToElement(_this.currentLrcEle, 200, 0, true)
                } catch (e) {}
            }, 300);
        },

        togglePlay: function() {
            var _this = this;
            if (_this.song.paused) {
                _this.song.play();
            } else {
                _this.song.pause();
            }
        },

        toggleDownloadPannel: function() {
            var _this = this;
            $(".download-mask").toggle();
        },

        toDownloadList: function() {
            butterfly.navigate("#download-list/download-list.html")
        },

        toChannels: function() {
            butterfly.navigate("#channels/channels.html")
        },

        progress: function() {
            //console.log(this.song.played.length, this.song.currentTime, this.song.duration)
            var _this = this;
            if (this.song.readyState != 4 || this.song.paused || this.song.currentTime == 0) return;
            var percent = Math.ceil(this.song.currentTime / this.song.duration * 10000) / 100
            var deg = percent * 3.6;
            _this.canvas.width = _this.canvas.width;
            _this.context.beginPath();
            _this.context.arc(100, 100, 95, -Math.PI * 0.5, deg / 360 * Math.PI * 2 - Math.PI * 0.5, false)
            _this.context.strokeStyle = "#87AE8B";
            _this.context.lineWidth = 10;
            _this.context.lineCap = "round";
            _this.context.stroke();
        },

    });
});