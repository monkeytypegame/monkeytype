import Socket from "../socket";

function setName(newName: string, confirm = false): void {
  Socket.emit("user_set_name", { name: newName, confirm });
}

function updateName(callback: (data: { name: string }) => void): void {
  Socket.on("user_update_name", callback);
}

export default {
  in: {
    updateName,
  },
  out: {
    setName,
  },
};
