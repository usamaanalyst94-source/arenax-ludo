const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 10000;

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const rooms = {};

io.on('connection', (socket) => {
  socket.on('create_or_join_room', ({ roomId, maxPlayers, username }) => {
    socket.join(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = {
        maxPlayers: parseInt(maxPlayers) || 4,
        players: [],
        gameState: { turn: 0, dice: 1 }
      };
    }

    const room = rooms[roomId];

    if (room.players.length < room.maxPlayers) {
      const playerColors = ['Red', 'Green', 'Yellow', 'Blue'];
      const playerColor = playerColors[room.players.length];
      
      room.players.push({ id: socket.id, username, color: playerColor });
      
      io.to(roomId).emit('room_update', {
        players: room.players,
        maxPlayers: room.maxPlayers,
        roomId
      });

      socket.on('send_message', (msg) => {
        io.to(roomId).emit('receive_message', { username, msg });
      });

      socket.on('roll_dice', () => {
        const diceValue = Math.floor(Math.random() * 6) + 1;
        room.gameState.dice = diceValue;
        if (diceValue !== 6) {
          room.gameState.turn = (room.gameState.turn + 1) % room.players.length;
        }
        io.to(roomId).emit('dice_rolled', {
          diceValue,
          nextTurnPlayer: room.players[room.gameState.turn]
        });
      });

    } else {
      socket.emit('room_full');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Ludo Server Live on Port ${PORT}`);
});
