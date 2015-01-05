define(["main/util"], function(Util) {
  return {
    //可配置项有：cacheToLocalStorage、log、url、success、err、dataType、cacheExpire
    apiRequest: function(settings) {
      //如果在这里用jquery创建一个deferred对象的话，感觉应该不错，不过貌似暂时用不上的先
      var _this = this;
      if (settings.path && settings.path !== "/action/openapi/news_detail") {
        //目前只对文章做缓存
        settings.cacheToLocalStorage = false;
      }
      var defaultSettings = {
        "log": false,
        "cacheToLocalStorage": false,
        "dataType": "json", //由于使用localhost作服务器，默认数据类型设置为jsonp
        "cacheExpire": 10, //默认缓存10秒，供测试用
      }
      var customSuccessFunc = settings.success;
      var customErrFunc = settings.err; //暂时没有处理网络错误的情况，所以这句话是摆设嘛~_~
      var finalSettings = _.extend(defaultSettings, settings)
      if (finalSettings.log) {
        console.log("调用借口 " + finalSettings.url.path + "\n参数：", finalSettings.url);
      }

      finalSettings.url = Util.joinURL(finalSettings.url) //其实把url组装好后，这里才是真正的finalSettings

      if (finalSettings.cacheToLocalStorage) {
        finalSettings.success = function(data) {
          data.expires = Date.now() + 1000 * finalSettings.cacheExpire;
          //这里只是简单地根据调用的接口来存储，而不是根据单独的文章来存储，因此实际意义不大
          Util.saveData("article" + settings.url.id, data);
          if (finalSettings.log) console.log("获取到了！正缓存到", "article" + settings.url.id + "---将在这么多秒之后过期：" + finalSettings.cacheExpire);
          customSuccessFunc(data);
        }
        var cacheData = Util.getData("article" + settings.url.id)
        if (cacheData && Date.now() < cacheData.expires) {
          if (finalSettings.log) console.log("从缓存中读取:\n", cacheData);
          return customSuccessFunc(cacheData);
        } else if (cacheData && Date.now() > cacheData.expires) {
          if (finalSettings.log) console.log("缓存过期，正尝试重新获取的说")
          Util.deleteData("article" + settings.url.id);
          finalSettings.cacheToLocalStorage = false;
          finalSettings.url = settings.url;
          return this.apiRequest(finalSettings)
        }
      }
      //没设置缓存选项，当然只能再ajax获取了。还没考虑断网的情况。
      $.ajax(finalSettings);
    }
  }
})