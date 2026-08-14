import { Socket } from "socket.io";
import { verifyIdToken } from "../utils/auth";
import Logger from "../utils/logger";
import { getErrorMessage } from "../utils/error";

export type SocketData = {
  uid: string;
  email: string;
  roomCode?: string;
};

export async function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void,
): Promise<void> {
  const token = socket.handshake.auth["token"] as string | undefined;

  if (token === undefined || token === "") {
    next(new Error("unauthorized"));
    return;
  }

  try {
    const decoded = await verifyIdToken(token);
    (socket.data as SocketData).uid = decoded.uid;
    (socket.data as SocketData).email = decoded.email ?? "";
    next();
  } catch (error) {
    Logger.warning(
      `Rejected socket auth: ${getErrorMessage(error) ?? "unknown error"}`,
    );
    next(new Error("unauthorized"));
  }
}
