declare namespace TribeSocket {
  interface GetPublicRoomsResponse {
    status?: string;
    rooms?: any[];
  }
  interface JoinRoomResponse {
    status?: string;
    room?: TribeTypes.Room;
  }
}
