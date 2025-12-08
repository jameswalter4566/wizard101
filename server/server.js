import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['polling', 'websocket'],
  pingTimeout: 60000,
  pingInterval: 25000,
  allowEIO3: true
});

const PORT = process.env.PORT || 3001;

// Store players by room
const rooms = new Map();

// Player state interface
class Player {
  constructor(id, data) {
    this.id = id;
    this.position = data.position || { x: 0, y: 0, z: 0 };
    this.rotation = data.rotation || 0;
    this.username = data.username || 'Anonymous';
    this.isMoving = data.isMoving || false;
    this.userId = data.userId || '';
    this.modelId = data.modelId || 'fire-a'; // Add modelId support
    this.lastUpdate = Date.now();
    this.chatMessage = '';
    this.chatMessageTime = 0;
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Get room info endpoint
app.get('/rooms/:roomId', (req, res) => {
  const room = rooms.get(req.params.roomId);
  if (room) {
    res.json({
      roomId: req.params.roomId,
      playerCount: room.size,
      players: Array.from(room.values()).map(p => ({
        id: p.id,
        username: p.username
      }))
    });
  } else {
    res.status(404).json({ error: 'Room not found' });
  }
});

io.on('connection', (socket) => {
  console.log('[Server] 🔌 New connection:', socket.id);
  
  let currentRoom = null;
  let currentPlayer = null;

  socket.on('join-room', (data) => {
    try {
      const { roomId, username, userId, modelId, position } = data;
      
      console.log(`[Server] 🎮 JOIN-ROOM REQUEST:`, {
        socketId: socket.id,
        roomId,
        username,
        userId,
        modelId,
        position,
        timestamp: new Date().toISOString()
      });
      
      // Leave previous room if any
      if (currentRoom) {
        socket.leave(currentRoom);
        const room = rooms.get(currentRoom);
        if (room) {
          room.delete(socket.id);
          socket.to(currentRoom).emit('player-left', socket.id);
          
          // Clean up empty rooms
          if (room.size === 0) {
            rooms.delete(currentRoom);
            console.log(`[Server] 🗑️ Room ${currentRoom} deleted (empty)`);
          }
        }
      }

      // Join new room
      currentRoom = roomId;
      socket.join(roomId);
      
      // Create room if it doesn't exist
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Map());
        console.log(`[Server] 📁 Room ${roomId} created`);
      }

      // Create player
      currentPlayer = new Player(socket.id, {
        username,
        userId,
        modelId,
        position,
        rotation: 0
      });

      const room = rooms.get(roomId);
      room.set(socket.id, currentPlayer);

      // Send current room state to joining player
      const roomState = Array.from(room.values()).filter(p => p.id !== socket.id);
      console.log(`[Server] 📤 Sending room-state to ${username} (${socket.id}):`, {
        playerCount: roomState.length,
        players: roomState.map(p => ({
          id: p.id,
          username: p.username,
          userId: p.userId,
          position: p.position
        }))
      });
      socket.emit('room-state', roomState);

      // Notify others in room
      socket.to(roomId).emit('player-joined', currentPlayer);
      console.log(`[Server] 📢 Broadcasting player-joined to other players in room ${roomId}`);

      console.log(`[Server] ✅ ${username} (${userId}) joined room ${roomId}. Room now has ${room.size} players`);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  socket.on('player-move', (data) => {
    if (!currentRoom || !currentPlayer) return;

    try {
      const { position, rotation, isMoving } = data;
      
      // Update player state
      currentPlayer.position = position;
      currentPlayer.rotation = rotation;
      currentPlayer.isMoving = isMoving;
      currentPlayer.lastUpdate = Date.now();

      // Broadcast to others in room
      socket.to(currentRoom).emit('player-moved', {
        id: socket.id,
        position,
        rotation,
        isMoving,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error handling player move:', error);
    }
  });

  socket.on('chat-message', (data) => {
    if (!currentRoom || !currentPlayer) return;

    try {
      const { message } = data;
      
      // Update player's chat message
      currentPlayer.chatMessage = message;
      currentPlayer.chatMessageTime = Date.now();

      // Broadcast to all in room (including sender)
      io.to(currentRoom).emit('player-chat', {
        id: socket.id,
        username: currentPlayer.username,
        message,
        timestamp: Date.now()
      });

      console.log(`Chat from ${currentPlayer.username}: ${message}`);
    } catch (error) {
      console.error('Error handling chat message:', error);
    }
  });

  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });

  socket.on('disconnect', () => {
    console.log('[Server] 🔌 Disconnected:', socket.id);
    
    if (currentRoom) {
      const room = rooms.get(currentRoom);
      if (room) {
        room.delete(socket.id);
        socket.to(currentRoom).emit('player-left', socket.id);
        
        // Clean up empty rooms
        if (room.size === 0) {
          rooms.delete(currentRoom);
          console.log(`Room ${currentRoom} deleted (empty)`);
        } else {
          console.log(`Player left room ${currentRoom}. Room now has ${room.size} players`);
        }
      }
    }
  });
});

// Server-side game loop for physics (60 FPS)
const TICK_RATE = 1000 / 60;
setInterval(() => {
  // Update physics for all rooms if needed
  for (const [roomId, room] of rooms) {
    // Add server-authoritative physics here if needed
  }
}, TICK_RATE);

// Cleanup stale rooms periodically
setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of rooms) {
    if (room.size === 0) {
      rooms.delete(roomId);
      console.log(`Cleaned up empty room: ${roomId}`);
    }
  }
}, 300000); // Every 5 minutes

httpServer.listen(PORT, () => {
  console.log(`Wizard Wander server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});