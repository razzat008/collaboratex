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

  return socket;
};

export default useSocket;

