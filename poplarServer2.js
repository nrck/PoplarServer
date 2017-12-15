/**
 * ジョブの制御関係
 */

// インスタンスからの接続を受けるサーバを立てる
var fs = require('fs');
var http = require('http');
var server = http.createServer();

server.on('request', function (req, res) {
    var stream = fs.createReadStream('index.html');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    stream.pipe(res);
});
//var io = require('socket.io').listen(server);
var io = require('socket.io').listen(8080);
server.listen(8000)

//どちら側でも、 socket.emit(eventname, data) でイベントを発火(=データの送信)をし、
//socket.on(eventname, callback) でイベントを検知(=データの受信)を行います。


io.sockets.on('connection', function (socket) {
    console.log('open:');
    socket.emit('greeting', { message: 'hello' }, function (data) {
        console.log('result: ' + data);
        console.log('sid: ' + socket.id);
    });
});



console.log('server open:');
 // インスタンスから接続があったとき、登録済みインスタンスか検証する

 // ジョブネットを読み込む部分

 // ジョブネットをタスク登録する

 // ジョブネットの実行結果をDBに保存する


 /**
  * まひるちゃんとの接続部分
  */

 // ジョブネットを登録する

 // ジョブを登録する

 // インスタンスを登録する

 // ジョブの実行結果を表示する

 // 