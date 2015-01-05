define([], function() {
	return {
		saveData: function(key, value) {
			localStorage.setItem(key, JSON.stringify(value))
		},

		getData: function(key) {
			return JSON.parse(localStorage.getItem(key))
		},

		deleteData: function(key) {
			localStorage.removeItem(key)
		},
		//这个joinURL常用，所以放util里，不过考虑到涉及网络的内容，可能放client里更好？
		joinURL: function(settings) {
			var defaultSettings = {
				"host": "http://douban.fm",
				"path": "/",
				"hasQuery": true,
			}
			settings = settings ? settings : {};
			var finalSettings = _.extend(defaultSettings, settings);
			var result = "";
			result = finalSettings["host"] + finalSettings["path"]
				//由于for...in...遍历对象没有顺序，而host和path必须排前面，所以上一句将这两个东西单独先拿出来组装
			if (finalSettings.hasQuery) {
				result = result + "?"
				for (var key in finalSettings) {
					if (key != "host" && key != "path" && key != "hasQuery") {
						result = result + key + "=" + finalSettings[key] + "&"
					}
				}
			} 			
			return result;
		},

		isLogin: function() {
			//先从localstorage里有没有client这个东西判断有没登陆
			if (!this.getData("client")) {
				return false;
				//有client，说明有access_token，但必须保证没过期，所以下面判断有没过期	
			} else {
				var result = this.getData("client").expires_time > Date.now() ? true : false;
				if (!result) this.deleteData("client");
				return result;
			}
		},

		fakeData: {"r":0,"version_max":100,"is_show_quick_start":0,"song":[{"album":"\/subject\/5907398\/","picture":"http:\/\/img3.douban.com\/lpic\/s4601814.jpg","ssid":"60bf","artist":"黄小琥","url":"http:\/\/mr4.douban.com\/201501032053\/0c20ceafe260cf15294b576d7c6f8ae5\/view\/song\/small\/p1639126_1v.mp3","company":"Warner","title":"重来","rating_avg":3.8168,"length":280,"subtype":"","public_time":"2011","songlists_count":68,"sid":"1639126","aid":"5907398","sha256":"a03a174c4d75eb343e24b38e7874339658ba0c62cbad9e0d711586ea09a69c60","kbps":"64","albumtitle":"如果能…重来","like":0},{"album":"\/subject\/5960889\/","picture":"http:\/\/img5.douban.com\/lpic\/s4622097.jpg","ssid":"f6d6","artist":"吕方","url":"http:\/\/mr3.douban.com\/201501032053\/025c4f1f7bd9b2c59c3a9ccac9f5e530\/view\/song\/small\/p1563537.mp3","company":"168 Production","title":"听说爱情回来过","rating_avg":3.29544,"length":288,"subtype":"","public_time":"2011","songlists_count":7,"sid":"1563537","aid":"5960889","sha256":"4ea1e1d4217f1ff9f5ca2189b474c0a2f6c3425f35ced47fe51be565452aaec3","kbps":"64","albumtitle":"Touching Moment","like":0},{"album":"\/subject\/6555674\/","picture":"http:\/\/img3.douban.com\/lpic\/s4609654.jpg","ssid":"3a28","artist":"王筝","url":"http:\/\/mr4.douban.com\/201501032053\/6b06ec0b6599334ada1c929228d76c34\/view\/song\/small\/p1637853.mp3","company":"银基一帮行","title":"影子","rating_avg":3.71075,"length":254,"subtype":"","public_time":"2011","songlists_count":9,"sid":"1637853","aid":"6555674","sha256":"5d12e3e6c7fe17215b75ec9626f8ebf225df6e8835b322685d0e6169944266ab","kbps":"64","albumtitle":"钝悟","like":0},{"album":"\/subject\/5945852\/","picture":"http:\/\/img3.douban.com\/lpic\/s4610464.jpg","ssid":"59d4","artist":"陈洁仪","url":"http:\/\/mr4.douban.com\/201501032053\/6fcc1bee04b640fd463c2a2bfc2d5944\/view\/song\/small\/p1563404.mp3","company":"Universal","title":"追 & 今生今世","rating_avg":4.0699,"length":312,"subtype":"","public_time":"2011","songlists_count":48,"sid":"1563404","aid":"5945852","sha256":"4a50317871a5d4ddeb8f2379b2bf7ea28a1f67caf9ad513ad54a2e376ecfd832","kbps":"64","albumtitle":"重译","like":0},{"album":"\/subject\/7047121\/","picture":"http:\/\/img3.douban.com\/lpic\/s7033824.jpg","ssid":"b14d","artist":"林俊杰","url":"http:\/\/mr4.douban.com\/201501032053\/673592fd84c74cb3bf16144baf278398\/view\/song\/small\/p1772384.mp3","company":"Warner","title":"不存在的情人","rating_avg":3.81681,"length":247,"subtype":"","public_time":"2011","songlists_count":28,"sid":"1772384","aid":"7047121","sha256":"05d0458ec22c4f726dbea69cafa32c8e07ceb0941dbb8f272fa7e91771c82bdf","kbps":"64","albumtitle":"學不會","like":0}]}
		,
	}
})