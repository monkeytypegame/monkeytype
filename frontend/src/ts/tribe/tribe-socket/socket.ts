import { io } from "socket.io-client";

export default io(
  window.location.hostname === "localhost"
    ? "http://localhost:3005"
    : "https://tribe.monkeytype.com",
  {
    // socket: io("http://localhost:3000", {
    autoConnect: false,
    secure: true,
    reconnectionAttempts: 0,
    reconnection: false,
    query: {
      name: "Guest",
    },
  },
);
