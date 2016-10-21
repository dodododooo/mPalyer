#mPlayer
预览![界面预览](http://git.oschina.net/uploads/images/2016/1021/232224_95cd94fd_1052484.png "mPlayer")
#API说明
```
pl.init(Object);//初始化入口
```
参数：

```
Object:
    {  
    listHeight : 210,   //歌曲列表最大高度，决定滚动条的显示隐藏
	loop : false,    //是否循环播放
	autoplay : false,    //页面加载完成后是否自动播放
	listPlay : true,    //列表添加完成后是都自动播放
	isDelete : false,    //歌曲链接错误时是否移出列表
	songUrl : "./php/musicPlay.php",    //歌曲请求地址(接受歌曲URL)
	listUrl : "./list.php",    //列表请求地址(接受列表JSON数据  {"songList":[{"songId":19,"songTitle":"Who Are You","artist":"Scarlett Johansson","songImg":"http://83660.jpg"},{"songId":406,"songTitle":"牛仔很忙","artist":"周杰伦","songImg":"http://7181.jpg"},{"songId":40,"songTitle":"热河","artist":"李志","songImg":"http://032786.jpg"}]}  )
	showMsg : function(msg){
            //弹出框提示信息函数
	},

```




```
pl.addTo($.parseJSON(data-mus),1);//添加歌曲到列表
```


 
```
mus-data = '{"songId":49783,"songTitle":"当我想你的时候","artist":"汪峰","songImg":"http://pic.jpg"}';
```


参数1:歌曲信息JSON数据;
参数2:添加到列表后是否播放;//true 播放,false 不播放