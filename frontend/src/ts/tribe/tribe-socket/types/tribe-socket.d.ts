declare namespace TribeSocket {
  interface GetPublicRoomsResponse {
    status?: string;
    rooms?: TribeTypes.Room[];
  }
  interface JoinRoomResponse {
    status?: string;
    room?: TribeTypes.Room;
  }
  interface VersionCheckResponse {
    status: string;
    version: string;
  }
}
