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

export default {
  in: {},
  out: {
    getPublicRooms,
  },
};
