import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export default function useSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const SOCKET_URL = import.meta.env.VITE_API_BASE;
    const s = io(SOCKET_URL, {
      transports: ["websocket"],
    });

    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));

    socketRef.current = s;

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, []);

  return { socketRef, connected };
}
