define(['butterfly/view', "main/util", "main/client", "css!channels/channels", "text!channels/channel-item.html"], function(View, Util, Client, CSS, channelItem){

  return View.extend({

    firstTime: true,
    isLoading: false,
    itemSize: 36,
    lastItem: 0,

  	events:{
  		"click .back": "toMain",
        "click .channel": "changeChannel"
  	},

    render: function(){
        console.log("channels on render ", this.firstTime)
        
    },

    onShow: function(){
        var _this = this;
        console.log("is first time?: ", _this.firstTime)

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
    	
    	if (_this.firstTime) {
            _this.requestChannelsList(++_this.lastItem, _this.itemSize)
            _this.lastItem += _this.itemSize;
            _this.firstTime = false;
        };
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
                data.data.channels.forEach(function(obj) {
                    var html = _.template(channelItem)(obj)
                    $(html).appendTo($channels)
                    _this.isLoading = false;
                })
                setTimeout(function(){
                    _this.myScroll.refresh();
                }, 500)
            }
        })
    },

    changeChannel: function(e){
        var targetChannelId = $(e.target).closest("li").data("id");
        console.log("click: ", targetChannelId)
        this.toMain(targetChannelId)
    },

    toMain: function(id){
        //像开头的events对象里绑定这个函数，如果不显示传入id的话，居然会默认传入jquery.events对象，所以这里不能用 id ? ... : ... 而用!id.currentTarget
        !id.currentTarget ? butterfly.navigate("player/player.html?channel=" + id ) : history.back();
    },

  });
});
