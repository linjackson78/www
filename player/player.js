define(['butterfly/view', "main/util", "main/client", "main/parseLrc", "css!player/player",  "css!player/css/social.umeng"], function(View, Util, Client, lrcParser, CSS, UMCSS) {

    return View.extend({

        downloadQue: {},
        isDeviceReady: false,
        hasLrc: false,
        hasInit: false,
        query: {},
        currentChannel: 1,
        oldChannel: null,
        offlineArr: [],
        recordArr: [],
        curRecordIndex: null,
        shareOpt: {
               'data' : {
                      'content' : {
                             'text': "myDouban这个app不错，分享一下",
                             
                      }
               } 
        },

        events: {
            "click #next": "next",
            "click #cover": "togglePlay",
            "click .current-channel": "toChannels",
            "click .lrc-ctrl": "toggleLrc",
            "click .download-btn": "download",
            "click .download-list-btn": "toDownloadList",
            "click .auto-download": "toggleAutoDownload",
        },

        err: function(e) {
            console.log("error!!!!!!!:", e);
        },
        render: function() {
            window.umappkey = "54b4ba55fd98c55b36000f5a";
        },

        onShow: function() {
            var _this = this;
            _this.song = document.getElementById("song");
            _this.$song = $("#song")
            _this.$lrc = $("#lrc")
            _this.$tips = $(".tips")
            _this.$pauseMask = $(".pause-mask")
            _this.canvas = document.getElementById("progress")
            _this.context = _this.canvas.getContext("2d");
            var queryStr = location.hash.split("?")[1];
            var alreadyNext = false;
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
                    _this.recordArr = Util.getData("songRecord");
                    if (_this.query.target == "") break;
                    var hasNoRecord = true;
                    $(".current-channel").text("最近播放")
                    if (_this.recordArr) {
                        _this.recordArr.forEach(function(obj, index) {
                            if (obj.title == _this.query.target) {
                                _this.curRecordIndex = index;
                                _this.next(null, _this.query.mode, obj);

                                hasNoRecord = false;
                                history.pushState({
                                    test: "test"
                                }, null, location.pathname + "#player/player.html?record=")
                            }
                        })
                    }
                    if (hasNoRecord) {
                        _this.next(null, "channel", _this.currentChannel)
                    }
                    break;

                case "offline":
                    _this.currentChannel = 0;
                    _this.offlineArr = [];
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
                        entries.forEach(function(entry){
                            if (entry.name.indexOf("channelCache") == -1) {
                                _this.offlineArr.push(entry.name)
                            }
                        })
                    }
                    if (_this.currentChannel !== _this.oldChannel || _this.query.oldTarget !== _this.query.target) {
                        _this.next(null, _this.query.mode, _this.query.target)
                    }
                    alreadyNext = true;
            }

            if (_this.currentChannel && _this.query.mode != "record") {
                _this.requestChannelDetail(_this.currentChannel);
            } else if (_this.currentChannel === 0 && _this.query.mode != "record") {
                $(".current-channel").text("离线歌曲")
            }

            if (_this.currentChannel !== _this.oldChannel && !alreadyNext) {
                _this.next(null, _this.query.mode, _this.query.target)
            }

            if (!_this.hasInit) eventInit();

            function eventInit() {
                _this.hasInit = true;
                _this.song.ontimeupdate = onPlaying;
                _this.song.addEventListener("ended", function(){
                    _this.next();
                });
                _this.song.addEventListener("canplay", function(){
                    _this.canPlay = true;
                    _this.hideSpinner();
                })
                _this.song.addEventListener("loadstart", function(){
                    _this.canPlay = false;
                })
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
                                if (!_this.isTouchingLrc) {
                                    try {
                                        _this.lrcScroller.scrollToElement(curEl, 200, 0, true);
                                    } catch(e) {}
                                }
                            };
                        }
                    }
                }

                document.addEventListener("deviceready", function() {
                    _this.isDeviceReady = true;
                    _this.myRoot = cordova.file.externalRootDirectory + "myDouban/";
                    window.resolveLocalFileSystemURL(_this.myRoot, function(entry) {
                        _this.myRootEntry = entry;
                    }, function(){
                        window.resolveLocalFileSystemURL(cordova.file.externalRootDirectory, function(entry){
                            entry.getDirectory("myDouban", {create: true}, function(entry){
                                _this.myRootEntry = entry;
                            })
                        })
                    })
                    console.log("device is ready!")
                    shake.startWatch(function(){
                        console.log("shaking!!!!!")
                        _this.next();
                    })
                    console.log("start watching shaking!!!")
                    setInterval(onPlaying, 500)
                })

                document.addEventListener("backbutton", onBackKeyDown, false);
                function onBackKeyDown(e) {
                  e.preventDefault();
                }

                $("#lrc").get(0).addEventListener("touchstart", function() {
                    _this.isTouchingLrc = true;
                    if (_this.lrcTimer) clearTimeout(_this.lrcTimer);
                });
                $("#lrc").get(0).addEventListener("touchend", function() {
                    _this.isTouchingLrc = false;
                    _this.lrcTimer = setTimeout(function() {
                        if (_this.lrcScroller) {
                            try {
                                _this.lrcScroller.scrollToElement(_this.currentLrcEle, 200, 0, true)
                            } catch (e) {}
                        }
                    }, 1000)
                });
                $(".icon").each(function(){
                    if (!$(this).hasClass("auto-download")) {
                        this.addEventListener("touchstart", function(){
                            $(this).addClass("icon-active")
                        })
                        this.addEventListener("touchend", function(){
                            $(this).removeClass("icon-active")
                        })
                    }
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

        next: function(e, mode, target) {
            var _this = this;
            _this.progress(0);
            $(".spinner").show();
            _this.$pauseMask.hide();
            _this.xhr4Song ? _this.xhr4Song.abort() : null;
            _this.xhr4Lrc ? _this.xhr4Lrc.abort() : null;
            _this.xhr4LrcCheck ? _this.xhr4LrcCheck.abort() : null;
            $(".lrc-content").html("<p class='error-tip'>正在加载歌词</p>")
            _this.song ? _this.song.pause() : null;
            mode = mode || (_this.query ? _this.query.mode : "channel");
            target = target || _this.query.target || 1;
            switch (mode) {
                case "record":
                    if (target === "" || target === undefined || target ===1) target = _this.recordArr[_this.curRecordIndex || 0];
                    var song = target;
                    $(".current-channel").text("最近播放")
                    onSongChange(song.songSrc, song.coverSrc, song.title, song.artist.replace(/\s+\/\s+/g, "-"))
                    var curIndex = _this.curRecordIndex;
                    var nextIndex = curIndex == _this.recordArr.length - 1 ? 0 : curIndex + 1;
                    _this.query.target = _this.recordArr[nextIndex]
                    _this.curRecordIndex = nextIndex;
                    break;
                case "offline":
                    var offlineSongSrc, offlinePicSrc, offlineLrcSrc;
                    var title = target.match(/(.*)-/)[1];
                    var artist = target.match(/-(.*)/)[1]
                    _this.myRootEntry.getDirectory(target, {}, function(dirEntry) {
                        var dirReader = dirEntry.createReader();
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
                            entries.forEach(function(entry){
                                if (entry.name.indexOf(".mp3") != -1) {
                                    offlineSongSrc = entry.nativeURL;
                                } else if (entry.name.indexOf(".jpg") != -1) {
                                    offlinePicSrc = entry.nativeURL;
                                } else if (entry.name.indexOf(".lrc") != -1) {
                                    offlineLrcSrc = entry.nativeURL
                                }
                            })
                            onSongChange(offlineSongSrc, offlinePicSrc, title, artist, offlineLrcSrc);
                            history.pushState({}, null, location.pathname + "#player/player.html?offline=" + target)
                            var curIndex = _this.offlineArr.indexOf(_this.query.target);

                            var nextIndex = curIndex == _this.offlineArr.length - 1 ? 0 : curIndex + 1;
                            _this.query.oldTarget = _this.query.target;
                            _this.query.target = _this.offlineArr[nextIndex]
                        }
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
                            
                            onSongChange(song.url, song.picture, song.title, song.artist.replace(/\s+\/\s+/g, "-"), null, song.sid, song.ssid)
                        }
                    });
            }

            function onSongChange(src, cover, title, artist, lrc, sid, ssid) {
                
                $("#song").attr("src", _this.currentSongSrc = src).load()
                _this.song.play();
                _this.imgloaded = false;
                $('<img/>').attr('src', _this.currentSongPic = cover).load(function() {
                    $(this).remove(); // prevent memory leaks as @benweet suggested
                    $("#cover").css("background-image", "url(" + cover + ")");
                    _this.imgloaded = true;
                    _this.hideSpinner();
                });
                $("#title").text(_this.currentSongTitle = title);
                $("#artist").text(_this.currentSongArtist = artist);
                _this.sid = sid;
                _this.ssid = ssid;
                _this.shareOpt = {
                       'data' : {
                              'content' : {
                                     'text': "在myDouban上听到这首歌觉得不错，分享一下：" + _this.currentSongTitle + "-" + _this.currentSongArtist + "\n" + "http://douban.fm/?start=" + _this.sid + "g" + _this.ssid + "g" + 0 + "&cid=2" + _this.sid, 

                                     'furl': _this.currentSongPic,
                              }
                       } 
                }
                $(".share").umshare(_this.shareOpt);

                var songRecord = Util.getData("songRecord") || [];
                var song = {
                    title: _this.currentSongTitle,
                    artist: _this.currentSongArtist,
                    coverSrc: _this.currentSongPic,
                    songSrc: _this.currentSongSrc,
                }

                //非本地歌曲时
                if (song.songSrc.indexOf("http") != -1 && _this.query.mode != "record") {
                    //自动下载
                    if (_this.autoDownload) {
                        if (_this.autoDownloadTimer) clearTimeout(_this.autoDownloadTimer);
                        _this.autoDownloadTimer = setTimeout(function(){
                            _this.download();
                        }, 6000)
                    }
                    //保存收听纪录
                    songRecord.forEach(function(obj, index) {
                        if (song.title == obj.title && song.artist == obj.artist) {
                            songRecord.splice(index, 1)
                        }
                    })
                    songRecord.unshift(song);
                    Util.saveData("songRecord", songRecord)
                }
                if (!lrc) {
                    _this.searchBaidu(title, artist.replace("-", ""))
                } else {
                    _this.loadLrc(lrc)
                }
            }
        },

        hideSpinner: function(){
            var _this = this;
            if (_this.canPlay && _this.imgloaded ) $(".spinner").hide();
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
                    if (data.song && data.song[0]) {
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
            if (url.indexOf("http") != -1) {
                this.xhr4Lrc = Client.apiRequest({
                    url: {
                        host: url, //http://ting.baidu.com/data2/lrc/13757624/13757624.lrc//这个有很多重复
                        path: "",
                        hasQuery: false,
                    },
                    cache: true,
                    dataType: "text",
                    success: function(data){
                        _this.lrcDataHandler(data);
                    },
                    error: function() {
                        lrcErr();
                    }
                });
            } else {
                window.resolveLocalFileSystemURL(url, function(entry){
                    entry.file(function(file){
                        var reader = new FileReader();
                        reader.onloadend = function(e){
                            _this.lrcDataHandler(this.result)
                        }
                        reader.readAsText(file);
                    }, _this.err)
                })
            }

            function lrcErr() {
                console.log("没歌词！")
                $(".lrc-content").html("<span class='error-tip'>晕了又没有歌词</span>")
            }
        },

        lrcDataHandler: function(data){
            var _this = this;
            var result = lrcParser.toPLabel(data)
            var html = result.text;
            _this.timeStampArray = result.timeStampArray;
            if (_this.lrcScroller) _this.lrcScroller = null;
            $(".lrc-content").html(html)
            setTimeout(function() {
                _this.lrcScroller = new IScroll("#lrc", {});
                _this.lrcScroller.minScrollY = -400;
            }, 300)
            console.log("总算把歌词弄上去了真累")
        },

        download: function() {
            var _this = this;
            var isExist = false;
            var songId = _this.currentSongTitle + "-" + _this.currentSongArtist;
            var dirName = _this.myRoot + songId + "/";

            if (!_this.isDeviceReady) return;
            checkExist(songId);

            function checkExist(path) {
                _this.myRootEntry.getDirectory(path, {
                    create: true, exclusive: true
                }, function() {
                    _this.toggleTips("正在离线这首歌")
                    notExist()
                    console.log("downloading!!!!!")
                }, function(e){
                    _this.toggleTips("已经离线这首歌了")
                })
            }

            function notExist() {
                $('<progress max="1.0" value="0" class="progress-bar"></progress>').prependTo($(_this.el));
                mp3Downloader = downloadFile(_this.currentSongSrc,
                    dirName + songId + ".mp3",
                    function(){
                        if (_this.isShowingTips) {
                            setTimeout(function(){
                                _this.toggleTips("离线完了")
                            }, 2000);
                            console.log("timeout one")
                        } else {
                            _this.toggleTips("离线完了")
                            console.log("not timeout one")
                        }
                        $(".progress-bar").remove();
                    }, function(err){
                        if (err.code == 3) {
                            setTimeout(_this.toggleTips("网络出错了"), 4000);
                        }
                    })
                mp3Downloader.onprogress = function(e){
                    if (e.lengthComputable) {
                         var percentage = (e.loaded / e.total);
                         $(".progress-bar").attr("value", percentage)
                       }
                }
                downloadFile(_this.currentSongPic,
                    dirName + songId + ".jpg",
                    downloadSuccess)
                if (_this.currentLrcSrc) {
                    downloadFile(_this.currentLrcSrc,
                        dirName + songId + ".lrc",
                        downloadSuccess)
                }
            }
            function downloadFile(url, path, successCb, errCb) {
                var fileTransfer = new FileTransfer();
                var url = encodeURI(url);
                errCb = errCb || _this.err
                fileTransfer.download(url, path, successCb, errCb);
                return fileTransfer;
            }

            function downloadSuccess (entry){
                console.log("file-success!!!:", entry.name)
            }

        },

        toggleLrc: function() {
            var _this = this;
            $("#lrc").fadeToggle(200);
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
                _this.$pauseMask.hide();
            } else {
                _this.song.pause();
                _this.$pauseMask.show();
            }
        },

        toggleAutoDownload: function(){
            var _this = this;
            if (_this.isShowingTips) return;
            _this.autoDownload = _this.autoDownload ? false : true;
            if (_this.autoDownload) {
                $(".auto-download").addClass("icon-active");
                _this.toggleTips("已经打开自动缓存", function(){
                    _this.download();
                })
                //if (_this.autoDownloadTimer) clearTimeout(_this.autoDownloadTimer)
                //_this.autoDownloadTimer = setTimeout(_this.download, 4000)
            } else {
                $(".auto-download").removeClass("icon-active")
                _this.toggleTips("已经关闭自动缓存")
            }
        },

        toggleTips: function(text, callback, show, delay, hide){
            var _this = this;
            _this.isShowingTips = true;
            _this.$tips.text(text).fadeIn(show || 200).delay(delay || 2000).fadeOut(hide || 200, function(){
                _this.isShowingTips = false;
                if (!!callback) {
                    callback();
                    console.log("this shall show after cb")
                }
            })
        },

        toDownloadList: function() {
            butterfly.navigate("#download-list/download-list.html")
        },

        toChannels: function() {
            butterfly.navigate("#channels/channels.html")
        },

        progress: function(deg) {
            //console.log(this.song.played.length, this.song.currentTime, this.song.duration)
            var _this = this;
            if (deg !== 0 && (this.song.paused || this.song.currentTime == 0 || this.song.readyState != 4)) return;
            var percent = Math.ceil(this.song.currentTime / this.song.duration * 10000) / 100
            /*if (percent > 98) {
                console.log(this.song.currentTime, this.song.duration)
                _this.nearlyFinished = true;
                if (!_this.nextSongTimer) _this.nextSongTimer = setTimeout(_this.next, 1000)
            } else {
                _this.nearlyFinished = false;
                if (_this.nextSongTimer) clearTimeout(_this.nextSongTimer)
            }*/
            var deg = deg === 0 ? 0 :percent * 3.6;
            drawLoop(deg);

            function drawLoop (deg) {
                _this.canvas.width = _this.canvas.width;
                //_this.context.beginPath();
                _this.context.arc(100, 100, 95, -Math.PI * 0.5, deg / 360 * Math.PI * 2 - Math.PI * 0.5, false)
                _this.context.strokeStyle = "#87AE8B";
                _this.context.lineWidth = 10;
                _this.context.lineCap = "round";
                _this.context.stroke();
            }
        },

    });
});