;
window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;

window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

;(function(win,doc,$){
	'use strict';
	if(!window.indexedDB){
		alert("什么年代了啊啊啊，还不升级浏览器！");
		window.open("http://www.google.cn/intl/zh-CN/chrome/browser/desktop/index.html");
		return false;
	}
	var defaults = {
		audio : new Audio,
		lrc : null,
		canScroll : true,
		timeOut : null,
		playingId : null,
	};

	var opt = {
		listHeight : 210,
		loop : false,
		autoplay : false,
		listPlay : true,
		isDelete : false,
		songUrl : "./php/musicPlay.php",
		listUrl : "./test.php",

		showMsg : function(msg){
			if($(".musMsg:last").length){
				$(".musMsg:last").prev().hide();
				var msgTop =($(".musMsg:last").offset().top -60) < 100 ? $("#player").offset().top-60 : ($(".musMsg:last").offset().top -60);
			}else{
				var msgTop = $("#player").offset().top-60;
			}
			var msgStr = "<div class='musMsg' style='position:fixed;left:-400px;top:"+msgTop+"px;height:50px;font: normal normal 16px/16px \"Microsoft YaHei\",Helvetica;padding:17px 20px;color:#fff;background-color:rgba(0,0,0,0.7)'>"+msg+"</div>";
			$(doc.body).append(msgStr);
			$(".musMsg:last").animate({left:0}, 300, "linear", function(){
				var _this = $(this);
				setTimeout(function() {
					_this.animate({left:-400}, 300, "linear", function(){
						_this.remove();
					});
				}, 2000);
			});
		},
	};

	

	var mPlay = {

		init : function(options){

			options && $.type(options)=="object" ? $.extend(true, opt, options, defaults) : $.extend(true, opt, defaults);

			opt.audio.loop = false;
			opt.audio.autoplay = true;

			$("#player").length===0 ? mPlay.layout() : mDb.getAll(opt.autoplay);

		},

		layout : function(){
			var playerStr="<div id='player'><div id='mus-info'><div id='bgimg'></div><div id='close' title='隐藏'></div><div id='mus-title' class='mus-info'></div><div id='mus-artist' class='mus-info'></div><div id='mus-time' class='mus-info'></div><div id='lrc'></div></div><div id='list-box'><div id='list-total'>Musics ( <span id='total-num'>0</span> )<span id='list-remove' title='清空列表'></span></div><div id='mus-list'></div><div id='scrollbox'><div id='scrollbar'></div></div></div><ul id='list-bar'><li class='gedan'>Hot</li><li class='gedan'>歌单</li><li class='gedan'>推荐</li></ul><div id='mus-bottom'><div id='timebar'></div><div id='btns'><span id='mode' class='play-mode btn-bottom'></span><span id='show-list' class='btn-bottom' title='播放列表'></span><a href='javascript:;' id='prev' class='mus-btn' title='上一首'></a><a href='javascript:;' id='play' class='mus-btn pause' title='播放/暂停(p)'></a><a href='javascript:;' id='next' class='mus-btn' title='下一首'></a></div></div></div><div id='musicbar'><canvas id='myCanvas' width='48px' height='48px'></canvas></div>";
			$(doc.body).append(playerStr);
			$("#mus-list").css("max-height", opt.listHeight);
			mDb.getAll(opt.autoplay);
			mPlay.event();
		},

		setList : function(data){
			var songListStr = "";

			if(data[0]){
				$.each(data, function(index, tag){
					var tagStr = JSON.stringify(tag);
					songListStr +="<li class='song-list' songId='"+tag.songId+"'><span class='song-title' title=\""+tag.songTitle+" By "+tag.artist+"\" data='"+tagStr+"'>"+tag.songTitle+"</span><span class='song-remove' title='删除'></span></li>";
				});
				$("#mus-list").html(songListStr);
				$("#list-box").slideDown(100,"swing");
			}else{
				$("#mus-list").empty();
			}
			$("#total-num").html($("#mus-list li").length);
		},

		addSong : function(songObject, isPlay){
			var songListStr,
				tag = songObject;
			var tagStr = JSON.stringify(tag);
				songListStr ="<li class='song-list' songId='"+tag.songId+"'><span class='song-title' title=\""+tag.songTitle+" By "+tag.artist+"\" data='"+tagStr+"'>"+tag.songTitle+"</span><span class='song-remove' title='删除'></span></li>";
			$("#mus-list").append(songListStr);
			$("#total-num").html($("#mus-list li").length);
			isPlay ? mPlay.doPlay($("#mus-list li:last-of-type")) : opt.showMsg("歌曲已添加到播放列表");
		},

		addedPlay : function(songId){
			$("#mus-list li").each(function(){
				$(this).attr("songId") == songId ? mPlay.doPlay($(this)) : null;
			});
		},

		doPlay : function(ele){
			if(ele.length ==0) return false;
			var data = $.parseJSON(ele.find("span.song-title").attr("data"));
			opt.audio.muted = true;
			$("#lrc").empty();
			$.post(opt.songUrl, {song:data.songId}, function(res){
				if(res.songUrl == "h"){
					opt.showMsg("歌曲链接不存在！");
					opt.isDelete ? mPlay.playNext() || mDb.deleteOne(ele): mPlay.playNext();
				}else{
					opt.audio.src = res.songUrl;
					opt.audio.muted = false;
					opt.lrc = res.lrc;
					opt.playingId = data.songId;
					opt.audio.onloadedmetadata = function(){
						mPlay.audioEvent();
					}
				}
			});
			$("#mus-title").html(data.songTitle);
			$("#mus-artist").html(data.artist);
			$("#mus-time").html("-- / --");
			ele.addClass("playing").siblings().removeClass("playing");
			$("#bgimg").css("background-image","url("+data.songImg+")").fadeIn();

		},

		removeSong : function(ele){
			ele.remove();
			opt.showMsg("歌曲已删除");
			$("#mus-list li").length == 0 ? $("#total-num").html(0) : $("#total-num").html($("#mus-list li").length);
		},

		playNext : function(){
			var nextSong = $("#mus-list li.playing").next("li");
			nextSong.length > 0 ? mPlay.doPlay(nextSong) : !$("#mus-list li:first-of-type").length || mPlay.doPlay($("#mus-list li:first-of-type"));
		},

		playPrev : function(){
			var prevSong = $("#mus-list li.playing").prev("li");
			prevSong.length > 0 ? mPlay.doPlay(prevSong) : !$("#mus-list li:last-of-type").length || mPlay.doPlay($("#mus-list li:last-of-type"));
		},

		showPlayer : function(show){
			if(show){
				$("#musicbar").hide();
				$("#player").animate({left:0},400,"linear");
			}else{
				$("#player").animate({left:-400},400,"linear",function(){
					$("#musicbar").fadeIn();
				});
			}
		},

		toScroll : function(delta){
			var musList = $("#mus-list"),
				scrollbox = $("#scrollbox"),
				scrollbar = $("#scrollbar"),
				totalHeight = musList.find("li").length * 20 + 10;

			if(totalHeight>opt.listHeight){
				scrollbox.height(opt.listHeight);
				scrollbar.height(opt.listHeight*opt.listHeight/totalHeight);
				scrollbox.fadeIn();

				if(opt.canScroll){
					opt.canScroll = false;

					var scrollbarTop, listScrollTop, scrollbarHeight = scrollbar.height();

					scrollbarTop = (scrollbar.position().top+delta)<0 ? 0 : ((scrollbar.position().top+delta)>(opt.listHeight-scrollbarHeight) ? (opt.listHeight-scrollbarHeight) : (scrollbar.position().top+delta));

					listScrollTop = (totalHeight-opt.listHeight)*scrollbarTop/(opt.listHeight-scrollbarHeight);

					musList.scrollTop(listScrollTop);

					scrollbar.animate({top:scrollbarTop},50,"linear",function(){
						opt.canScroll = true;
					});
				}
			}else{
				scrollbox.fadeOut();
			}

		},

		drawProcess : function(barWidth, text){
			var c=document.getElementById("myCanvas");
			var context=c.getContext("2d");
			context.clearRect(0, 0, 48, 48);
			
			// ***开始画一个灰色的圆  
			context.beginPath();
			// 坐标移动到圆心  
			context.moveTo(24, 24);
			// 画圆,圆心是24,24,半径24,从角度0开始,画到2PI结束,最后一个参数是方向顺时针还是逆时针  
			context.arc(24, 24, 24, 0, Math.PI * 2, false);
			context.closePath();
			// 填充颜色  
			context.fillStyle = '#ddd';
			context.fill();
			// ***灰色的圆画完  

			// 画进度  
			context.beginPath();
			// 画扇形的时候这步很重要,画笔不在圆心画出来的不是扇形  
			context.moveTo(24, 24);
			// 跟上面的圆唯一的区别在这里,不画满圆,画个扇形  
			context.arc(24, 24, 24, 0, barWidth, false);
			context.closePath();
			context.fillStyle = '#999';
			context.fill();

			// 画内部空白
			context.beginPath();
			context.moveTo(24, 24);
			context.arc(24, 24, 21, 0, Math.PI * 2, true);
			context.closePath();
			context.fillStyle = 'rgba(255,255,255,1)';
			context.fill();

			context.font = "bold 9pt Arial";  
			context.fillStyle = '#999';  
			context.textAlign = 'center';  
			context.textBaseline = 'middle';  
			context.moveTo(24, 25);  
			context.fillText(text, 25, 25);  
		},

		secondsToMinutes : function(seconds){
			var MM = Math.floor(seconds/60),
				SS = Math.floor(seconds%60);
				MM<10 ? (MM="0"+MM) : MM;
				SS<10 ? (SS="0"+SS) : SS;
			var time = MM+":"+SS;
			return time;
		},

		event : function(){
			$(".gedan").click(function(){
				var data = $(this).text();
				$.post(opt.listUrl, data, function(res){
					mDb.addTo(res, opt.listPlay);
					$("#list-box").slideDown(100,"swing");
				});
			});

			$("#mus-list").on("click", ".song-title", function(){
				mPlay.doPlay($(this).parent());
			});

			$("#mus-list").on("click", ".song-remove",function(){
				if($(this).parent().hasClass("playing")) mPlay.playNext();
				mDb.deleteOne($(this).parent());
			});

			$("#next").click(function(){
				mPlay.playNext();
			});

			$("#prev").click(function(){
				mPlay.playPrev();
			});

			$("#play").click(function(){
				if($("#mus-list li.playing").length == 0){
					mPlay.playNext();
				}else{
					opt.audio.paused ? opt.audio.play() : opt.showMsg("已暂停："+$("#mus-title").text()) || opt.audio.pause();
				}
			});

			$("#mode").click(function(){
				opt.loop = !opt.loop;
				opt.loop ? opt.showMsg("单曲循环") || $(this).removeClass("play-mode").addClass("play-mode-loop") : opt.showMsg("列表循环") || $(this).removeClass("play-mode-loop").addClass("play-mode");
			});

			$("#show-list").click(function(){
				$("#list-box").slideToggle(100,"swing");
			});

			$("#musicbar").click(function(){
				mPlay.showPlayer(true);
			});
			$("#close").click(function(){
				mPlay.showPlayer(false);
			});

			$("#list-remove").click(function(){
				$("#list-box").slideUp(100,"swing");
				mDb.deleteAll();
				opt.showMsg("播放列表已清空！");
			});

			$("#mus-list").on("mouseenter", function(){

				mPlay.toScroll( 0 );

			}).on("mousewheel DOMMouseScroll", function(e){

				e.preventDefault();
				e.stopPropagation();

				var delta = -e.originalEvent.wheelDelta/12 || e.originalEvent.detail/3*20;

				mPlay.toScroll(delta);

			}).on("mouseleave", function(){
				$("#scrollbox").fadeOut();
			});

		},

		audioEvent : function(){
			var timeBar = $("#timebar"),
				musTime = $("#mus-time"),
				musBar = $("#musicbar"),
				musLrc = $("#lrc");

			var duration = opt.audio.duration,
				durationTime = mPlay.secondsToMinutes(duration);

			opt.audio.onended = function(){
				opt.loop ? !$(".playing").length || mPlay.doPlay($(".playing")) : mPlay.playNext();
			};

			opt.audio.onpause = function(){
				$("#play").removeClass("play").addClass("pause");
			};

			opt.audio.onplay = function(){
				$("#play").removeClass("pause").addClass("play");
				opt.showMsg("正在播放："+$("#mus-title").text());
			};

			opt.audio.onwaiting = function(){
				opt.showMsg("正在缓冲！");
			};
			opt.audio.onerror = function(){
				mPlay.playNext();
				opt.showMsg("资源加载失败！");
			};

			opt.audio.ontimeupdate = function(){
				var currentTime = opt.audio.currentTime,
					playTime = mPlay.secondsToMinutes(currentTime);

				var bar = 2*Math.PI*currentTime/duration,
					barWidth = 100*Math.floor(currentTime)/Math.floor(duration) +"%";

				timeBar.width(barWidth);
				mPlay.drawProcess(bar, playTime);
				musTime.html(playTime+" / "+durationTime);

				if(opt.lrc !==0){
					$.each(opt.lrc, function(index,value){
					if(index>Math.floor(currentTime*1000-300) && index<Math.floor(currentTime*1000+300)){
							musLrc.html(value);
							delete opt.lrc[index];
							return false;
						}
					});
				}else{
					musLrc.html("No Lyrics");
				}
			}

		},


	};


	var mDb = {
		version: 1, // important: only use whole numbers!

		objectStoreName: 'mPlay',

		objectIndex: 'songId',

		instance: {},

		upgrade: function (e) {

			var _mDb = e.target.result,
				names = _mDb.objectStoreNames,
				name = mDb.objectStoreName,
				storeIndex = mDb.objectIndex;

			if (!names.contains(name)) {

				var objectStore = _mDb.createObjectStore( name,{ keyPath: 'id', autoIncrement: true, unique: true});
				objectStore.createIndex(storeIndex,storeIndex,{unique:true});
			}
		},

		errorHandler: function (error) {
			console.log('error: ' + error.target.error);
			//debugger;
		},

		open: function (callback) {

			var request = win.indexedDB.open(mDb.objectStoreName, mDb.version);

			request.onerror = mDb.errorHandler;

			request.onupgradeneeded = mDb.upgrade;

			request.onsuccess = function (e) {

				mDb.instance = request.result;

				mDb.instance.onerror = mDb.errorHandler;

				callback();
			};
		},

		getObjectStore: function (mode) {

			mode = mode || 'readonly';
			var txn, store,

				txn = mDb.instance.transaction([mDb.objectStoreName], mode),

				store = txn.objectStore(mDb.objectStoreName);

			return store;
		},

		addTo : function(musData, isPlay){

			var isPlay = isPlay || false;
			

			mDb.open(function () {

				var txn = mDb.instance.transaction([mDb.objectStoreName], 'readwrite'),

					store = txn.objectStore(mDb.objectStoreName);

				var songObject,data = musData;

				if(!data.songList){
					if(data.songId && $.type(data.songId)=="number"){
						var index = store.index("songId").get(data.songId);
						index.onsuccess = function(e){
							if (!e.target.result) {
								store.put(data).onsuccess = function(e){
									songObject = data;
									songObject.id = e.target.result;
								};
							}
						}

						txn.oncomplete = function(e){
							if(songObject){
								mPlay.addSong(songObject, isPlay);
							}else if(isPlay){
								opt.playingId != data.songId ? mPlay.addedPlay(data.songId) : opt.showMsg("歌曲已添加到播放列表");
							}else{
								opt.showMsg("歌曲已添加到播放列表");
							}
						}

					}else{
						opt.showMsg("歌曲数据错误");
					}
				}else{
					store.clear().onsuccess = function(){
						$.each(data.songList, function(index, value){
							if(value.songId && $.type(value.songId)=="number"){
								store.put(value);

								txn.oncomplete = function(e){
									mDb.getAll(isPlay);
									opt.showMsg("歌曲已添加到播放列表");
								}
							}else{
								opt.showMsg("第"+(index+1)+" 首歌曲数据错误");
							}
						});
					};
				}

				

			});
		},

		getAll: function (isPlay) {

			var isPlay = isPlay || false;
			mDb.open(function () {

				var store = mDb.getObjectStore(),
					cursor = store.openCursor(),
					data = [];

				cursor.onsuccess = function (e) {

					var result = e.target.result;

					if (result && result !== null) {

						data.push(result.value);
						result.continue();

					} else {
						mPlay.setList(data);
						isPlay ? mPlay.playNext() : null;
					}
				};

			});
		},

		deleteOne: function (ele) {

			var id = parseInt($.parseJSON(ele.find("span.song-title").attr("data")).id);

			mDb.open(function () {

				var mode = 'readwrite', store, request;

				store = mDb.getObjectStore(mode);

				request = store.delete(id);

				request.onsuccess = mPlay.removeSong(ele);

			});
		},

		deleteAll: function () {

			mDb.open(function () {

				var mode, store, request;

				mode = 'readwrite';
				store = mDb.getObjectStore(mode);
				request = store.clear();

				request.onsuccess = mPlay.setList([]);
			});

		}
	};

	win.pl = win.pl || {};
	win.pl.init = mPlay.init;
	win.pl.addTo = mDb.addTo;
	$(function(){
		win.pl.init({
			showMsg : function(msg){
				$(".musMsg").length ? $(".musMsg").hide() : null;
				var msgBottom = $("#player").height() + 10;
			var msgStr = "<div class='musMsg' style='position:fixed;left:-400px;bottom:"+msgBottom+"px;height:50px;font: normal normal 16px/16px \"Microsoft YaHei\",Helvetica;padding:17px 20px;color:#fff;background-color:rgba(0,0,0,0.7)'>"+msg+"</div>";
			$(doc.body).append(msgStr);
			$(".musMsg:last").animate({left:0}, 300, "linear", function(){
				var _this = $(this);
				setTimeout(function() {
					_this.animate({left:-400}, 300, "linear", function(){
						_this.remove();
					});
				}, 2000);
			});
		},
		});
	});




})(window,document,jQuery);