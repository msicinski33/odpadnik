import { io } from "socket.io-client";

const socket = io(process.env.REACT_APP_API_URL || "http://192.168.1.7:3000", {
  transports: ["websocket"],
  autoConnect: true,
});

export default socket; 