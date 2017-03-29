/*  總體來說path我還不知道使用的意思 (Q_Q )

	import基本上都要用npm install 去安裝這些套件

	可以上網爬一下這些套件的相關文本 -.-!

	用到http的原因是因為socket.io需要用到

	還有 html 需要引用他自己寫的js模組 --> 這個在 socket.io 的 client 資料夾中 前提你必須裝好再說
*/

/* import */
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var socket_io = require('socket.io');


/* 宣告 */
var app = express();
var router = express.Router();
var server = http.Server(app);
var io = socket_io(server);

//使用json套件
app.use(bodyParser.json());

//使用public資料夾
app.use(express.static(path.join(__dirname, 'public')));

//使用views資料夾 <-- 通常拿來放網頁 .ejs .hbs .html
app.set('views', path.join(__dirname, 'views'));

//拿ejs 充當 html <-- 網路爬的 目前還不懂意思
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

var room = [];

/* connectioned */
io.sockets.on('connection', function(socket){

	var room_pointer;

	var new_room = [];

	/* 掃描等待房 */
	for(var i = 0 ; i < room.length ; i++)
	{
		if(room[i].status == false)
		{
			new_room.push(room[i]);
		}
	}

	/* 如果有找到就加入隨機一間 */
	if(new_room.length != 0)
	{	
		var random = Math.floor(Math.random() * new_room.length);

		socket.join(new String(new_room[random].socket.id));

		new_room[random].number += 1;

		new_room[random].status = true;

		room_pointer = new_room[random];

		console.log("status-2");

		io.to(new String(room_pointer.socket.id)).emit('start');
	}
	else //沒有就自己開一間等吧
	{
		//用object存資料 類似資料結構
		var object = {};
		object.socket = socket;
		object.status = false;
		object.number = 1;

		room.push(object);

		socket.join(new String(socket.id));

		room_pointer = object;

		console.log("status-1");
	}

	socket.on('message', function(data){
		socket.to(new String(room_pointer.socket.id)).broadcast.emit('message', {'message': data.message});
	});

	/* disconnect 監聽 */
	socket.on('disconnect', function(){

		var room_index = room.indexOf(room_pointer);

		socket.to(new String(room_pointer.socket.id)).broadcast.emit('leave');

		socket.leave(new String(room_pointer.socket.id));

		room[room_index].number -= 1;

		if(room[room_index].number == 0)
		{
			room.splice(room_index, 1);
		}

		console.log("leave");
	});
});


/* router /room:get  --> url: localhost/room */
router.get('/room', function(request, response){

	//渲染檔案 - 把檔案灌到/room 這個路徑上
	response.render('socket.html');
});

//把router的路由放到上面
app.use('/', router);

/* server start */
server.listen(80, function(){
	console.log("localhost:80 server start");
});