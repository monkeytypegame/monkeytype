declare namespace TribeSocket {
  interface GetPublicRoomsResponse {
    status?: string;
    rooms?: TribeTypes.Room[];
  }

  interface VersionCheckResponse {
    status: string;
    version: string;
  }
}
