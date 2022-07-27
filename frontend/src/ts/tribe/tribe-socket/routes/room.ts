import Socket from "../socket";

async function getPublicRooms(
  _page: number,
  search: string
): Promise<TribeSocket.GetPublicRoomsResponse> {
  return new Promise((resolve) => {
    Socket.emit(
      "room_get_public_rooms",
      {
        page: 0,
        search: search,
      },
      (e: TribeSocket.GetPublicRoomsResponse) => {
        resolve(e);
      }
    );
  });
}

async function join(
  roomId: string,
  fromBrowser: boolean
): Promise<TribeSocket.JoinRoomResponse> {
  return new Promise((resolve) => {
    Socket.emit(
      "room_join",
      { roomId, fromBrowser },
      (res: TribeSocket.JoinRoomResponse) => {
        resolve(res);
      }
    );
  });
}

function init(): void {
  Socket.emit("room_init_race");
}

function joined(callback: (data: { room: TribeTypes.Room }) => void): void {
  Socket.on("room_joined", callback);
}

function playerJoined(
  callback: (data: { user: TribeTypes.User }) => void
): void {
  Socket.on("room_player_joined", callback);
}

function playerLeft(callback: (data: { userId: string }) => void): void {
  Socket.on("room_player_left", callback);
}

function left(callback: () => void): void {
  Socket.on("room_left", callback);
}

export default {
  in: {
    joined,
    playerJoined,
    playerLeft,
    left,
  },
  out: {
    getPublicRooms,
    join,
    init,
  },
};
