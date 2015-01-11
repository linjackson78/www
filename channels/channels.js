define(['butterfly/view', "main/util", "main/client", "css!channels/channels", "text!channels/channel-item.html"], function(View, Util, Client, CSS, channelItem){

  return View.extend({

    isLoading: false,
    itemSize: 36,
    lastItem: 0,

  	events:{
  		"click .back": "toMain",
        "click .channel": "changeChannel"
  	},

    err: function(e){
        console.log(e)
    },

    render: function(){
        console.log("channels on render ", this.firstTime)
    },

    onShow: function(){
        var _this = this;
        if (!this.myScroll) {
            this.myScroll = new IScroll(".my-wrapper", {
                probeType: 1,
                mouseWheel: true,
            });
            this.myScroll.on("scroll", function(){
                //console.log(this.y, this.maxScrollY)
                if (this.y < this.maxScrollY + 50 && !_this.isLoading) {
                    console.log("加载底部中");
                    _this.lastItem++;
                    _this.requestChannelsList(_this.lastItem, _this.itemSize)
                    _this.lastItem += _this.itemSize;
                }
            })
        }

        document.addEventListener("deviceready", function(){
            _this.isDeviceReady = true;
            console.log("device ready!")
            _this.myRoot = cordova.file.externalRootDirectory + "myDouban/";
            _this.coverRoot = _this.myRoot + "_channelCache/";
            window.resolveLocalFileSystemURL(_this.myRoot, function(entry){
                _this.myRootEntry = entry;
                entry.getDirectory("_channelCache", {create: true}, function(entry){
                    _this.coverRootEntry = entry;
                })
                
            }, _this.err);
            _this.requestChannelsList(++_this.lastItem, _this.itemSize)
            _this.lastItem += _this.itemSize;
        })
    },

    requestChannelsList: function(start, limit){
        var _this = this;
        _this.isLoading = true;
        var $channels = $("#channels")
        Client.apiRequest({
            url:{
                "path": "/j/explore/hot_channels",
                "start": start,
                "limit": limit
            },
            success: function(data){
                var channelArr = data.data.channels;
                var count = 0;
                channelArr.forEach(function(obj) {
                    checkExist(obj.name + ".jpg");
                    function checkExist (file) {
                        _this.coverRootEntry.getFile(file, {create: false}, function(entry){
                            obj.cover = entry.nativeURL;
                            var html = _.template(channelItem)(obj)
                            $(html).appendTo($channels)
                            count++;
                            if (count == channelArr.length) {
                                coverhandler()
                            }
                        }, function(){
                            downloadFile(obj.cover, _this.coverRoot + obj.name + ".jpg", function(entry){
                                obj.cover = entry.nativeURL;
                                var html = _.template(channelItem)(obj)
                                $(html).appendTo($channels)
                                count++;
                                if (count == channelArr.length) {
                                    coverhandler()
                                }
                            })
                        })
                    }
                    
                    function downloadFile(url, path, successCb) {
                        var fileTransfer = new FileTransfer();
                        var url = encodeURI(url);
                        fileTransfer.download(url, path, successCb, _this.err);
                        return fileTransfer;
                    }
                })

                function coverhandler (){
                    setTimeout(function(){
                        _this.myScroll.refresh();
                        _this.isLoading = false;
                    }, 500)
                }
            }
        })
    },

    changeChannel: function(e){
        var targetChannelId = $(e.target).closest("li").data("id");
        this.toMain(targetChannelId)
    },

    toMain: function(id){
        //像开头的events对象里绑定这个函数，如果不显示传入id的话，居然会默认传入jquery.events对象，所以这里不能用 id ? ... : ... 而用!id.currentTarget
        !id.currentTarget ? butterfly.navigate("player/player.html?channel=" + id ) : history.back();
    },

  });
});
