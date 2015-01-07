define(['butterfly/view', "main/util", "main/client", "main/parseLrc", "css!player/player"], function(View, Util, Client, lrcParser, CSS) {

    return View.extend({

        iScrollCount: 0,
        iScrollArr: [],
        downloadQue: {},

        events: {
            "click #next": "next",
            "click #cover": "togglePlay",
            "click .current-channel": "toChannels",
            "click .lrc-ctrl": "toggleLrc",
            "click .download-pannel-ctrl": "toggleDownloadPannel",
            "click .download-btn": "download",
            "click .download-list-btn": "toDownloadList",
        },

        err: function(e){
            console.log("error!!!!!!!:", e);
        },
        render: function() {
            var _this = this;
            //get myRoot
            window.webkitRequestFileSystem(window.TEMPORARY, 100*1024*1024, function(fs){
                fs.root.getDirectory("myDouban", {create:true}, function(dirEntry){
                    _this.myRoot = dirEntry;
                }, _this.err)
            }, _this.err)
        },

        onShow: function() {
            var _this = this;
            _this.song = document.getElementById("song");
            _this.$song = $("#song")
            _this.$lrc = $("#lrc")
            _this.currentChannel = location.hash.split("id=")[1] || Util.getData("currentChannel") || 1;

            _this.requestChannelDetail(_this.currentChannel);

            _this.song.onended = function() {
                _this.next();
            };
            _this.song.ontimeupdate = function() {
                _this.progress();
                //console.log("first two condition are ", _this.timeStampArray, _this.isTouchingLrc)
                //console.log(Math.floor(_this.song.currentTime))
                if (_this.timeStampArray && !_this.isTouchingLrc) {
                    var index = _this.timeStampArray.indexOf(Math.floor(_this.song.currentTime))
                    if (index !== -1) {
                        if (_this.lrcScroller && _this.$lrc.has("p") && !_this.isTouchingLrc) {
                            _this.$lrc.find("p").removeClass("current-lrc").eq(index).addClass("current-lrc")
                            try {
                                _this.lrcScroller.goToPage(0, index, 1000)
                                    //console.log("gotopage is ", index)
                            } catch (err) {}
                            /*console.log(_this.lrcScroller.minScrollY)
                            var $lrcP = _this.$lrc.find("p").removeClass("current-lrc");
                            var curEl = $lrcP.get(index)
                            curEl.className = "current-lrc";
                            _this.lrcScroller.scrollToElement(curEl, 200, 0, true)*/
                        }
                    }
                }
            }

            if (!_this.$song.attr("src") || _this.oldChannel != _this.currentChannel) _this.next();

            $("#lrc").get(0).addEventListener("touchstart", function() {
                console.log("touch start!")
                _this.isTouchingLrc = true;
                _this.touchIsEnd = false;
            })
            $("#lrc").get(0).addEventListener("touchend", function() {
                    console.log("touch end!")
                    _this.touchIsEnd = true;
                })
                /*document.addEventListener("deviceready", function(){
                    _this.deviceReady = true;
                })*/
        },

        onHide: function() {
            this.oldChannel = this.currentChannel;
        },

        requestChannelDetail: function(id) {
            var _this = this;
            console.log("request channel id is ", id)
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

        next: function() {
            var _this = this;
            _this.xhr4Song ? _this.xhr4Song.abort() : null;
            _this.xhr4Lrc ? _this.xhr4Lrc.abort() : null;
            _this.xhr4LrcCheck ? _this.xhr4LrcCheck.abort() : null;
            $(".lrc-content").html("<p class='error-tip'>正在加载歌词</p>")
            console.log("正在请求这首新歌的信息")
            _this.song ? _this.song.pause() : null;
            _this.xhr4Song = Client.apiRequest({
                url: {
                    "path": "/j/app/radio/people",
                    "app_name": "radio_desktop_win",
                    "version": 100,
                    "type": "n",
                    "channel": _this.currentChannel
                },
                success: function(data) {
                    //data = Util.fakeData
                    var song = data.song[0]
                    $("#song").attr("src", _this.currentSongSrc = song.url).load();
                    $("#cover").css("background-image", "url(" + (_this.currentSongPic = song.picture) + ")");
                    $("#title").text(_this.currentSongTitle = song.title);
                    $("#artist").text(_this.currentSongArtist = song.artist);
                    _this.searchBaidu(song.title, song.artist)
                }
            })
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
                    _this.iScrollArr[_this.iScrollCount] = null;
                    //if (_this.lrcScroller) _this.lrcScroller = null;
                    $(".lrc-content").html(html)
                    setTimeout(function() {
                        _this.iScrollCount++;
                        _this.lrcScroller = _this.iScrollArr[_this.iScrollCount] = new IScroll("#lrc", {
                            snap: "p",
                        })
                        _this.iScrollArr[_this.iScrollCount].on("scrollEnd", function() {
                            console.log("scroll End!!", _this.lrcScroller.currentPage.pageY)
                            if (_this.isTouchingLrc && _this.touchIsEnd) {
                                _this.song.currentTime = _this.timeStampArray[_this.lrcScroller.currentPage.pageY]
                                _this.isTouchingLrc = false;
                                /*_this.timer = null
                                _this.timer = setTimeout(function(){
                                    
                                    console.log("timeout!")
                                },500)*/
                            }
                        })

                        /*$("#lrc").get(0).addEventListener("touchend", function(){
                            console.log("touch end~", _this.lrcScroller.currentPage.pageY)
                            _this.isTouchingLrc = false;
                            _this.lrcScroller.goToPage(0, _this.lrcScroller.currentPage.pageY, 0)
                        })*/

                    }, 1000)
                    console.log("总算下载完了真累")
                },
                error: function() {
                    lrcErr();
                }
            });

            function lrcErr() {
                console.log("没歌词！")
                $(".lrc-content").html("<span class='error-tip'>晕了又没有歌词</span>")
                    //_this.lrcScroller.refresh();
            }


        },

        download: function() {
            //if (!_this.deviceready) return;
            var _this = this;
            console.log("downloadIng!!!!!")
            _this.myRoot.getDirectory("test1", {create: true}, function(dirEntry){
                dirEntry.getFile("test1.mp3", {create:true}, function(fileEntry){

                    fileEntry.createWriter(function(writer){

                    }, _this.err)
                }, _this.err)
            }, _this.err)
        },

        toggleLrc: function() {
            var _this = this;
            $("#lrc").toggle();
            if (_this.lrcScroller) setTimeout(function() {
                _this.lrcScroller.refresh();
                _this.isTouchingLrc = false;
            }, 300);
        },

        togglePlay: function() {
            var _this = this;
            if (song.paused) {
                song.play();
            } else {
                song.pause();
            }
        },

        toggleDownloadPannel: function() {
            var _this = this;
            $(".download-mask").toggle();
        },

        toDownloadList: function(){
            butterfly.navigate("#download-list/download-list.html")
        },

        toChannels: function() {
            butterfly.navigate("#channels/channels.html")
        },

        progress: function() {
            //console.log(this.song.played.length, this.song.currentTime, this.song.duration)
            if (this.song.readyState != 4 || this.song.paused || this.song.currentTime == 0) return;
            var percent = Math.ceil(this.song.currentTime / this.song.duration * 10000) / 100
            var deg = percent * 3.6;
            if (deg <= 180) {
                $(".progress").find('.left').css('transform', "rotate(0deg)");
                $(".progress").find('.right').css('transform', "rotate(" + deg + "deg)");
            } else {
                $(".progress").find('.right').css('transform', "rotate(180deg)");
                $(".progress").find('.left').css('transform', "rotate(" + (deg - 180) + "deg)");
            };
        },

    });
});