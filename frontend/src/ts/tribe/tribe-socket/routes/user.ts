import Socket from "../socket";

function setName(newName: string, confirm = false): void {
  Socket.emit("user_set_name", { name: newName, confirm });
}

export default {
  in: {},
  out: {
    setName,
  },
};
