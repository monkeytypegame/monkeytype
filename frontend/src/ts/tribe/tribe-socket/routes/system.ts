import Socket from "../socket";

async function versionCheck(
  expectedVersion: string
): Promise<TribeSocket.VersionCheckResponse> {
  return new Promise((resolve) => {
    Socket.emit(
      "system_version_check",
      { version: expectedVersion },
      (response: TribeSocket.VersionCheckResponse) => {
        resolve(response);
      }
    );
  });
}

function connect(callback: () => void): void {
  Socket.on("connect", callback);
}

export default {
  in: {
    connect,
  },
  out: {
    versionCheck,
  },
};
