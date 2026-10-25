import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to server (in production, targets VITE_SOCKET_URL, backend host from VITE_API_URL, or defaults to "/")
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      (import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "")
        : "/");

    const newSocket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("[SocketContext] Connected to live seat server with ID:", newSocket.id);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const joinShowRoom = (showId) => {
    if (socket && showId) {
      socket.emit("joinShow", showId);
    }
  };

  const leaveShowRoom = (showId) => {
    if (socket && showId) {
      socket.emit("leaveShow", showId);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, joinShowRoom, leaveShowRoom }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
