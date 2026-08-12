import {
  CreateRoomRequest,
  CreateRoomResponse,
  GetRoomPath,
  GetRoomResponse,
} from "@monkeytype/contracts/multiplayer";
import { MonkeyRequest } from "../types";
import { MonkeyResponse } from "../../utils/monkey-response";
import MonkeyError from "../../utils/error";
import * as UserDAL from "../../dal/user";
import * as Multiplayer from "../../utils/multiplayer";

export async function createRoom(
  req: MonkeyRequest<undefined, CreateRoomRequest>,
): Promise<CreateRoomResponse> {
  const { uid } = req.ctx.decodedToken;
  const { config } = req.body;

  const { name } = await UserDAL.getPartialUser(
    uid,
    "create multiplayer room",
    ["name"],
  );

  const room = await Multiplayer.createRoom(uid, name, config);

  return new MonkeyResponse("Room created", room);
}

export async function getRoom(
  req: MonkeyRequest<undefined, undefined, GetRoomPath>,
): Promise<GetRoomResponse> {
  const { roomCode } = req.params;

  const room = await Multiplayer.getRoom(roomCode);
  if (room === null) {
    throw new MonkeyError(404, "Room not found");
  }

  return new MonkeyResponse("Room found", room);
}
