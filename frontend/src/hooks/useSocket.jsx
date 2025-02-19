import { useEffect, useCallback } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", { withCredentials: true });

const useSocket = (roomId, userId) => {
  useEffect(() => {
    if (roomId) {
      socket.emit("join-room", roomId);
    }

    return () => {
      socket.disconnect(); // Disconnect on unmount
    };
  }, [roomId]);

  // Send cursor position (with userId)
  const sendCursorPosition = useCallback((cursorPosition) => {
    if (roomId && userId) {
      socket.emit("cursor-position", { roomId, userId, cursorPosition });
    }
  }, [roomId, userId]);

  // Listen for cursor updates
  const onCursorPosition = useCallback((callback) => {
    socket.on("cursor-position", callback);
    return () => socket.off("cursor-position", callback); // Clean up event listener
  }, []);

  return { socket, sendCursorPosition, onCursorPosition };
};

export default useSocket;

