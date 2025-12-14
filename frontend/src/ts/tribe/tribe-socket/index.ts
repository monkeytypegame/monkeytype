import { isDevEnvironment } from "../../utils/misc";
import RoomRoutes from "./routes/room";
import SystemRoutes from "./routes/system";
import UserRoutes from "./routes/user";
import DevRoutes from "./routes/dev";
import Socket from "./socket";

function updateName(newName: string): void {
  if (Socket.io.opts.query) {
    Socket.io.opts.query["name"] = newName;
  }
}

function connect(): void {
  Socket.connect();
}

function disconnect(): void {
  Socket.disconnect();
}

function getId(): string {
  return Socket.id;
}

export default {
  in: {
    room: RoomRoutes.in,
    system: SystemRoutes.in,
    user: UserRoutes.in,
  },
  out: {
    room: RoomRoutes.out,
    system: SystemRoutes.out,
    user: UserRoutes.out,
    ...(isDevEnvironment()
      ? {
          dev: DevRoutes.out,
        }
      : {}),
  },
  updateName,
  connect,
  getId,
  disconnect,
};
