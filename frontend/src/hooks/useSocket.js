import { useEffect, useRef, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';

let socketInstance = null; // module-level singleton

export const useSocket = (user) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    // Create socket connection once, reuse it everywhere
    if (!socketInstance) {
      socketInstance = io(
        import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
        {
          auth: { token: localStorage.getItem('token') },
          // ↑ this is how we send the JWT during the WS handshake
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        }
      );
    }

    socketRef.current = socketInstance;

    socketInstance.on('connect', () => {
      console.log('🟢 Socket connected:', socketInstance.id);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('❌ Socket error:', err.message);
    });

    return () => {
      // Don't disconnect on component unmount — the connection
      // is shared across the whole app. Only disconnect on logout.
    };
  }, [user]);

  // Join a room or DM
  const joinRoom = useCallback((roomId) => {
    socketRef.current?.emit('room:join', { roomId });
  }, []);

  const joinDM = useCallback((conversationId) => {
    socketRef.current?.emit('dm:join', { conversationId });
  }, []);

  // Send messages
  const sendRoomMessage = useCallback((roomId, content) => {
    socketRef.current?.emit('message:send_room', { roomId, content });
  }, []);

  const sendDM = useCallback((conversationId, content) => {
    socketRef.current?.emit('message:send_dm', { conversationId, content });
  }, []);

  // Typing indicators
  const startTyping = useCallback((roomId) => {
    socketRef.current?.emit('typing:start', { roomId });
  }, []);

  const stopTyping = useCallback((roomId) => {
    socketRef.current?.emit('typing:stop', { roomId });
  }, []);

  const startDMTyping = useCallback((conversationId) => {
    socketRef.current?.emit('dm:typing:start', { conversationId });
  }, []);

  const stopDMTyping = useCallback((conversationId) => {
    socketRef.current?.emit('dm:typing:stop', { conversationId });
  }, []);

  // Listen for events — returns a cleanup function
  const onMessage = useCallback((callback) => {
    const s = socketRef.current;
    s?.on('message:new', callback);
    return () => s?.off('message:new', callback);
  }, []);

  const onTyping = useCallback((callback) => {
    const s = socketRef.current;
    s?.on('typing:update', callback);
    return () => s?.off('typing:update', callback);
  }, []);

  const disconnect = useCallback(() => {
    socketInstance?.disconnect();
    socketInstance = null;
  }, []);

  return useMemo(() => ({
    socket: socketInstance,
    joinRoom, joinDM,
    sendRoomMessage, sendDM,
    startTyping, stopTyping,
    startDMTyping, stopDMTyping,
    onMessage, onTyping,
    disconnect,
  }), [
    joinRoom, joinDM, sendRoomMessage, sendDM, 
    startTyping, stopTyping, startDMTyping, stopDMTyping, 
    onMessage, onTyping, disconnect
  ]);
};