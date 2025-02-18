import { useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  withCredentials: true,
});

const useSocket = () => {
  useEffect(() => {
    return () => {
      socket.disconnect();
    };
  }, []);

  const joinRoom = (roomId) => {
    socket.emit("join-room", roomId);
  };

  const sendCursorPosition = (roomId, cursorPosition) => {
    socket.emit("cursor-position", { roomId, cursorPosition });
  };

  const onCursorPosition = (callback) => {
    socket.on("cursor-position", callback);
  };

  return { socket, joinRoom, sendCursorPosition, onCursorPosition };
};

export default useSocket;

