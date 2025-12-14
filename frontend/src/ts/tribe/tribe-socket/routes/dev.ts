import Socket from "../socket";

export default {
  out: {
    room: () => Socket.emit("dev_room"),
  },
};
