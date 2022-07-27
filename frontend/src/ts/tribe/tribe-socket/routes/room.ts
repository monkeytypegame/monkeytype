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

export default {
  in: {},
  out: {
    getPublicRooms,
    join,
    init,
  },
};
