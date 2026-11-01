import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const SOCKET_SERVER_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5001';

// Module-level singleton to prevent duplicate socket instances across renders/remounts
let socketInstance = null;

function getStoredHandshakeAuth() {
  if (typeof window === 'undefined') return {};
  try {
    return {
      conversationId: window.localStorage.getItem('taskpilot_conversation_id'),
      sessionId: window.localStorage.getItem('taskpilot_session_id'),
    };
  } catch {
    return {};
  }
}

export function getSocket() {
  if (typeof window === 'undefined') return null;
  if (!socketInstance) {
    socketInstance = io(SOCKET_SERVER_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      autoConnect: true,
      auth: getStoredHandshakeAuth(),
    });
  }
  return socketInstance;
}

export function updateSocketAuth(authData) {
  if (socketInstance) {
    socketInstance.auth = { ...(socketInstance.auth || {}), ...authData };
  }
}

export function SocketProvider({ children }) {
  const socket = getSocket();
  const [isConnected, setIsConnected] = useState(() => (socket ? socket.connected : false));

  useEffect(() => {
    if (!socket) return;

    const onConnect = () => {
      console.log('[Socket] Connected to server, socket ID:', socket.id);
      setIsConnected(true);
    };

    const onDisconnect = (reason) => {
      console.log('[Socket] Disconnected from server:', reason);
      setIsConnected(false);
    };

    const onConnectError = (err) => {
      console.warn('[Socket] Connection error:', err.message);
      setIsConnected(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, updateSocketAuth }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
