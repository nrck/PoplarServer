const io = require('socket.io-client');
const socket = io('127.0.0.1:8080');

console.log(`state`);
socket.on('connect', () => {
    console.log(`aaa`);
    socket.emit("message", 'send message.');

    socket.on('chat message', (msg) => {
        // io.emit('chat message', msg);
        console.log(`message: ${msg}`);
    });
});