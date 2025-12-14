/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import Socket from "../socket";
import * as TribeTypes from "../../types";

type VersionCheckResponse = {
  status: string;
  version: string;
};

async function versionCheck(
  expectedVersion: string,
): Promise<VersionCheckResponse> {
  return new Promise((resolve) => {
    Socket.emit(
      "system_version_check",
      { version: expectedVersion },
      (response: VersionCheckResponse) => {
        resolve(response);
      },
    );
  });
}

async function stats(): Promise<TribeTypes.SystemStats> {
  return new Promise((resolve) => {
    Socket.emit("system_stats", (response: TribeTypes.SystemStats) => {
      resolve(response);
    });
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
          if (dat[1]) {
            console.log(
              "%cTI",
              "background:red;padding:0 5px;border-radius:10px",
              matches2[0] ?? "?",
              dat[0],
              dat[1],
            );
          } else {
            console.log(
              "%cTI",
              "background:red;padding:0 5px;border-radius:10px",
              matches2[0] ?? "?",
              dat[0],
            );
          }
        }
      } else {
        console.log(
          "%cTI",
          "background:red;padding:0 5px;border-radius:10px",
          type,
          data,
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
          if (dat[1]) {
            console.log(
              "%cTO",
              "background:blue;padding:0 5px;border-radius:10px",
              matches2[0] ?? "?",
              dat[0],
              dat[1],
            );
          } else {
            console.log(
              "%cTO",
              "background:blue;padding:0 5px;border-radius:10px",
              matches2[0] ?? "?",
              dat[0],
            );
          }
        }
      } else {
        console.log(
          "%cTO",
          "background:blue;padding:0 5px;border-radius:10px",
          type,
          data,
        );
      }
    });

    callback();
  });
}

function disconnect(
  callback: (reason: string, details?: unknown) => void,
): void {
  Socket.on("disconnect", callback);
}

function connectFailed(callback: (err: Error) => void): void {
  Socket.on("connect_failed", callback);
}

function connectError(callback: (err: Error) => void): void {
  Socket.on("connect_error", callback);
}

function reconnect(callback: (attempt: number) => void): void {
  Socket.on("reconnect", callback);
}

function reconnectAttempt(callback: (attempt: number) => void): void {
  Socket.on("reconnect_attempt", callback);
}

function notification(
  callback: (data: { message: string; level?: number }) => void,
): void {
  Socket.on("system_notification", callback);
}

export default {
  in: {
    connect,
    reconnect,
    reconnectAttempt,
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
