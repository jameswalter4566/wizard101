import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface PlayerState {
  id: string;
  position: { x: number; y: number; z: number };
  rotation: number;
  username: string;
  isMoving: boolean;
  userId: string;
  modelId?: string;
  lastUpdate: number;
  chatMessage?: string;
  chatMessageTime?: number;
}

interface UseSocketMultiplayerProps {
  username: string;
  roomId: string;
  isSignedIn: boolean;
  userId?: string;
  modelId?: string;
  initialPosition?: { x: number; y: number; z: number };
  serverUrl?: string;
}

export function useSocketMultiplayer({
  username,
  roomId,
  isSignedIn,
  userId = '',
  modelId = 'fire-a',
  initialPosition = { x: 0, y: 0, z: 0 },
  serverUrl
}: UseSocketMultiplayerProps) {
  const [players, setPlayers] = useState<Map<string, PlayerState>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [latency, setLatency] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use refs for frequently changing values
  const usernameRef = useRef(username);
  const userIdRef = useRef(userId);
  const modelIdRef = useRef(modelId);
  const initialPositionRef = useRef(initialPosition);
  
  // Update refs when props change
  useEffect(() => {
    usernameRef.current = username;
    userIdRef.current = userId;
    modelIdRef.current = modelId;
    initialPositionRef.current = initialPosition;
  }, [username, userId, modelId, initialPosition]);

  // Get server URL - use provided URL or fallback to localhost
  const getServerUrl = () => {
    if (serverUrl) return serverUrl;
    return process.env.NODE_ENV === 'production' 
      ? 'https://wizard-wander-server.onrender.com'
      : 'http://localhost:3001';
  };

  // Update local player position
  const updateLocalPlayer = useCallback((position: { x: number; y: number; z: number }, rotation: number, isMoving: boolean) => {
    if (!socketRef.current?.connected) return;

    // Throttle updates to 30Hz
    const now = Date.now();
    if (now - lastUpdateRef.current < 33) return;
    lastUpdateRef.current = now;

    
    socketRef.current.emit('player-move', {
      position,
      rotation,
      isMoving,
      timestamp: now,
      username: usernameRef.current,
      userId: userIdRef.current,
      modelId: modelIdRef.current
    });
    
    // Log every 60th update (about once per second)
    if (Math.random() < 0.016) {
      console.log(`[SocketMultiplayer] 📤 Sending player update:`, {
        modelId: modelIdRef.current,
        username: usernameRef.current,
        position
      });
    }
  }, []);

  // Send chat message
  const sendChatMessage = useCallback((message: string) => {
    if (!socketRef.current?.connected || !message.trim()) return;
    
    socketRef.current.emit('chat-message', {
      message: message.trim()
    });
  }, []);

  useEffect(() => {
    // Prevent multiple connections
    if (socketRef.current?.connected) {
      console.log('[SocketMultiplayer] Already connected, skipping');
      return;
    }

    // Only connect if signed in
    if (!isSignedIn || !username || !roomId) {
      console.log('[SocketMultiplayer] Not connecting - missing requirements:', { isSignedIn, username: !!username, roomId: !!roomId });
      return;
    }

    const serverUrl = getServerUrl();
    console.log('[SocketMultiplayer] Initiating connection to:', serverUrl);

    // Create socket connection
    const socket = io(serverUrl, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[SocketMultiplayer] Connected successfully');
      setIsConnected(true);

      // Join room using refs for stable values
      console.log('[SocketMultiplayer] Joining room with:', {
        socketId: socket.id,
        username: usernameRef.current,
        userId: userIdRef.current,
        roomId
      });
      
      
      socket.emit('join-room', {
        roomId,
        username: usernameRef.current,
        userId: userIdRef.current,
        modelId: modelIdRef.current,
        position: initialPositionRef.current
      });

      // Start ping interval
      pingIntervalRef.current = setInterval(() => {
        const startTime = Date.now();
        socket.emit('ping');
        socket.once('pong', () => {
          setLatency(Date.now() - startTime);
        });
      }, 5000);
    });

    socket.on('disconnect', () => {
      console.log('[SocketMultiplayer] Disconnected from server');
      setIsConnected(false);
      setPlayers(new Map());
    });

    socket.on('room-state', (roomPlayers: PlayerState[]) => {
      console.log('[SocketMultiplayer] 📥 ROOM-STATE RECEIVED:', {
        playerCount: roomPlayers.length,
        mySocketId: socket.id,
        myUserId: userIdRef.current,
        myUsername: usernameRef.current,
        players: roomPlayers.map(p => ({
          id: p.id,
          userId: p.userId,
          username: p.username,
          position: p.position,
          modelId: p.modelId
        })),
        timestamp: new Date().toISOString()
      });
      
      const newPlayers = new Map();
      roomPlayers.forEach(player => {
        // Double-check that we're not adding ourselves
        if (player.id !== socket.id && player.userId !== userIdRef.current) {
          console.log(`[SocketMultiplayer] ✅ Adding player to map: ${player.username} (${player.id})`);
          newPlayers.set(player.id, player);
        } else {
          console.warn('[SocketMultiplayer] ⚠️ FILTERED OUT local player from room-state:', {
            player,
            reason: player.id === socket.id ? 'Socket ID match' : 'User ID match'
          });
        }
      });
      
      console.log(`[SocketMultiplayer] 📊 Final player map size: ${newPlayers.size}`);
      setPlayers(newPlayers);
    });

    socket.on('player-joined', (player: PlayerState) => {
      console.log('[SocketMultiplayer] 🚪 PLAYER-JOINED EVENT:', {
        playerId: player.id,
        playerUserId: player.userId,
        playerUsername: player.username,
        playerModelId: player.modelId,
        playerPosition: player.position,
        mySocketId: socket.id,
        myUserId: userIdRef.current,
        isSelf: player.id === socket.id || player.userId === userIdRef.current
      });
      
      // Ensure we don't add ourselves
      if (player.id === socket.id || player.userId === userIdRef.current) {
        console.warn('[SocketMultiplayer] ⚠️ Ignoring player-joined for local player');
        return;
      }
      
      setPlayers(prev => {
        const newMap = new Map(prev);
        newMap.set(player.id, player);
        console.log(`[SocketMultiplayer] ✅ Added player to map. Total players: ${newMap.size}`);
        return newMap;
      });
      console.log(`[SocketMultiplayer] 🎮 ${player.username} joined the game`);
    });

    socket.on('player-moved', (data: { id: string; position: any; rotation: number; isMoving: boolean; timestamp: number }) => {
      
      setPlayers(prev => {
        const newMap = new Map(prev);
        const player = newMap.get(data.id);
        if (player) {
          player.position = data.position;
          player.rotation = data.rotation;
          player.isMoving = data.isMoving;
          player.lastUpdate = data.timestamp;
          console.log(`[SocketMultiplayer] ✅ UPDATED PLAYER POSITION:`, {
            username: player.username,
            newY: data.position.y
          });
        }
        return newMap;
      });
    });

    socket.on('player-left', (playerId: string) => {
      console.log('[SocketMultiplayer] 🚪 PLAYER-LEFT EVENT:', {
        playerId,
        timestamp: new Date().toISOString()
      });
      
      setPlayers(prev => {
        const newMap = new Map(prev);
        const player = newMap.get(playerId);
        if (player) {
          console.log(`[SocketMultiplayer] 👋 ${player.username} left the game`);
        } else {
          console.warn(`[SocketMultiplayer] ⚠️ Unknown player left: ${playerId}`);
        }
        newMap.delete(playerId);
        console.log(`[SocketMultiplayer] 📊 Players remaining: ${newMap.size}`);
        return newMap;
      });
    });

    socket.on('player-chat', (data: { id: string; username: string; message: string; timestamp: number }) => {
      setPlayers(prev => {
        const newMap = new Map(prev);
        const player = newMap.get(data.id);
        if (player) {
          player.chatMessage = data.message;
          player.chatMessageTime = data.timestamp;
        }
        return newMap;
      });
      
      // Clear chat message after 5 seconds
      setTimeout(() => {
        setPlayers(prev => {
          const newMap = new Map(prev);
          const player = newMap.get(data.id);
          if (player && player.chatMessageTime === data.timestamp) {
            player.chatMessage = undefined;
            player.chatMessageTime = undefined;
          }
          return newMap;
        });
      }, 5000);
    });

    socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });

    socket.on('connect_error', (error: any) => {
      console.error('Connection error:', error.message);
      console.error('Error type:', error.type);
      console.error('Error details:', error);
    });

    socket.io.on('error', (error: any) => {
      console.error('Transport error:', error);
    });

    // Cleanup
    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      if (socket && socket.connected) {
        socket.disconnect();
      }
      socketRef.current = null;
      setIsConnected(false);
      setPlayers(new Map());
    };
  }, [isSignedIn, roomId]); // Only reconnect on sign-in state or room change

  return {
    players,
    isConnected,
    latency,
    updateLocalPlayer,
    sendChatMessage,
    playersCount: players.size
  };
}