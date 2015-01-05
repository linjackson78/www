define(["text!player/test.txt"], function(test){
	return {
		toPLabel: function(text){
			var timeStampArr = [];
			var resultHTML = "";
            var obj = {};
			var timeStamp = /(?:\[(\d{2})\:(\d{2})\.\d{2,3}\])/g,
				blankTimeStamp = /(?:\[\d{2}\:\d{2}\.\d{2,3}\])+\s+/g,
				otherTags = /\[\D+\]/g,
				dup = /((?:\[\d+\]){2,})(.+)/g,
        tagPlusWords = /\[(\d+)\](.+)/g;
                
			text = text.replace(/^\s*|\s*$/m, "")
				   .replace(blankTimeStamp, "")
				   .replace(otherTags, "")
				   //console.log(text)
				   .replace(timeStamp, function(match, p1, p2){
				       return "[" + (p1 * 60 + parseInt(p2) ) + "]";
				   })
				   //console.log(text)
				   .replace(dup, function(match, p1, p2){
				       var words = p2;
                       var timeTags = p1;
				       var arr = [];
				       while (timeTags != ""){
					       	timeTags = timeTags.replace(/\[\d+\]/, function(tag){
					       		arr.push(tag);
					       		return "";
					       	})
				       }
				       var result = ""
				       arr.forEach(function(tag){
				       	   result = result + tag + words + "\n";
				       })
               return result;
				   })
           .replace(tagPlusWords, function(match, p1, p2){
               obj[p1] = p2
               timeStampArr.push(parseInt(p1))
           });

            var resultText = "";
            timeStampArr.sort(function(a, b){
                return a-b
            }).forEach(function(time){
                resultText = resultText + "<p data-time='" + time + "'>" + obj[time] + "</p>"
            });
            return {
                "text": resultText,
                timeStampArray: timeStampArr
            };

			/*var timeStampArr = []
			var timeStamp = /(?:\[(\d{2})\:(\d{2})\.\d{2,3}\])+/g,
					useLessTime = /(?:\[\d{2}\:\d{2}\.\d{2,3}\])+\s*(\[)/g,
					tags = /\[\w*:[^:]*\]/g,
					words = /\[(\d{2})\:(\d{2})(?:\.(\d{2,3}))?\](.*)\[?/g,
					dupWrods = /((?:\[\d{2}\:\d{2}\.\d{2,3}\])+)(.+)(?=\[|\r|\n)/g;
			text = text.replace(/^\s*|\s*$/m, "").replace(useLessTime, function(substr,p1){
				return p1
			});
			text = text.replace(dupWrods, function(substr, p1, p2){
				var timeTags = p1;
				var words = p2;
				var tagsArray = [];
				while (timeTags != "") {
					timeTags = timeTags.replace(/\[\d{2}\:\d{2}\.\d{2,3}\]/, function(substr, whole){
						tagsArray.push(substr);
						return "";
					})
				}
				var result = "";
				tagsArray.forEach(function(tag){
					result = result + tag + words + "\r"
				})
				return result;
			})
			text = text.replace(words, function(substr){
				return substr + "</p>"
			})
			text = text.replace(timeStamp, function(time, p1, p2){
				var timeStamp = parseInt(p1) * 60 + parseInt(p2);
				timeStampArr.push(timeStamp)
				var html = "<p data-time='" + timeStamp + "'>"
				return html;
			});
			text = text.replace(tags, "")
			return {
				"text": text,
				timeStampArray: timeStampArr
			};*/
		},
	};
})