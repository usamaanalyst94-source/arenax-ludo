const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

io.on('connection', (socket) => {
  console.log('Player Connected:', socket.id);

  socket.on('join_room', (data) => {
    const { roomId, username } = data;
    socket.join(roomId);
    socket.to(roomId).emit('player_joined', { id: socket.id, username });
    console.log(`${username} joined room: ${roomId}`);
  });

  socket.on('send_message', (data) => {
    socket.to(data.room).emit('receive_message', { username: data.username, msg: data.msg });
  });

  // WebRTC Signaling for Real Voice Chat
  socket.on('webrtc_offer', (data) => {
    socket.to(data.room).emit('webrtc_offer', { offer: data.offer, sender: socket.id });
  });

  socket.on('webrtc_answer', (data) => {
    socket.to(data.room).emit('webrtc_answer', { answer: data.answer, sender: socket.id });
  });

  socket.on('webrtc_ice', (data) => {
    socket.to(data.room).emit('webrtc_ice', { candidate: data.candidate, sender: socket.id });
  });

  socket.on('disconnect', () => {
    console.log('Player Disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Ludo Premium Server Live on Port ${PORT}`);
});
