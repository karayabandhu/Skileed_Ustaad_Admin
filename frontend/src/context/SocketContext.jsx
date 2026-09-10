import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children, isAuthenticated }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem("token");
      const newSocket = io(SOCKET_URL, {
        withCredentials: true,
        auth: { token },
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      newSocket.on("connect", () => {
        // console.log("Admin Socket connected:", newSocket.id);
        setIsConnected(true);
        newSocket.emit("join_admin");
      });

      newSocket.on("disconnect", () => {
        // console.log("Admin Socket disconnected");
        setIsConnected(false);
      });

      newSocket.on("new_payout_request", () => playNotificationSound());
      newSocket.on("newTransaction", () => playNotificationSound());
      newSocket.on("new_provider", () => playNotificationSound());
      newSocket.on("new_booking", () => playNotificationSound());

      setSocket(newSocket);
      return () => {
        newSocket.close();
      };

    } else {
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [isAuthenticated]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audio.play().catch(e => console.warn("Autoplay blocked: user must interact first."));
    } catch (err) {
      console.warn("Sound play error:", err);
    }
  };


  const emit = useCallback((event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    }
  }, [socket, isConnected]);

  const on = useCallback((event, callback) => {
    if (socket) {
      socket.on(event, callback);
      return () => socket.off(event, callback);
    }
    return () => { };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, emit, on }}>
      {children}
    </SocketContext.Provider>
  );
};
