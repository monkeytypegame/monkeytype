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

async function stats(pingStart: number): Promise<TribeTypes.SystemStats> {
  return new Promise((resolve) => {
    Socket.emit(
      "system_stats",
      { pingStart },
      (response: TribeTypes.SystemStats) => {
        resolve(response);
      }
    );
  });
}

function connect(callback: () => void): void {
  Socket.on("connect", () => {
    const engine = Socket.io.engine;

    engine.on("packet", ({ type, data }) => {
      // called for each packet received

      if (type === "message" && data) {
        const matches = data.match(/\[.*?\]$/g);
        // match digits at the beginning of data string up to [ without matching [
        const matches2 = data.match(/^\d+(?=\[)/g);
        if (matches) {
          const dat = JSON.parse(matches[0]);
          console.log(
            "%cTI",
            "background:red;padding:0 5px;border-radius:10px",
            matches2[0] ?? "?",
            dat[0]
          );
        }
      } else {
        console.log(
          "%cTI",
          "background:red;padding:0 5px;border-radius:10px",
          type,
          data
        );
      }
    });

    engine.on("packetCreate", ({ type, data }) => {
      // called for each packet sent
      if (type === "message" && data) {
        const matches = data.match(/\[.*?\]$/g);
        const matches2 = data.match(/^\d+(?=\[)/g);
        if (matches) {
          const dat = JSON.parse(matches[0]);
          console.log(
            "%cTO",
            "background:blue;padding:0 5px;border-radius:10px",
            matches2[0] ?? "?",
            dat[0],
            dat[1]
          );
        }
      } else {
        console.log(
          "%cTO",
          "background:blue;padding:0 5px;border-radius:10px",
          type,
          data
        );
      }
    });

    callback();
  });
}

function disconnect(callback: () => void): void {
  Socket.on("disconnect", callback);
}

function connectFailed(callback: (err: Error) => void): void {
  Socket.on("connect_failed", callback);
}

function connectError(callback: (err: Error) => void): void {
  Socket.on("connect_error", callback);
}

function notification(
  callback: (data: { message: string; level?: number }) => void
): void {
  Socket.on("system_notification", callback);
}

export default {
  in: {
    connect,
    disconnect,
    connectFailed,
    connectError,
    notification,
  },
  out: {
    versionCheck,
    stats,
  },
};
