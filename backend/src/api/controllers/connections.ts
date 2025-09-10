import {
  CreateConnectionRequest,
  CreateConnectionResponse,
  GetConnectionsQuery,
  GetConnectionsResponse,
  IdPathParams,
  UpdateConnectionRequest,
} from "@monkeytype/contracts/connections";
import { MonkeyRequest } from "../types";
import { MonkeyResponse } from "../../utils/monkey-response";
import * as ConnectionsDal from "../../dal/connections";
import * as UserDal from "../../dal/user";
import { replaceObjectId } from "../../utils/misc";
import MonkeyError from "../../utils/error";
import { omit } from "lodash";
import { Connection } from "@monkeytype/schemas/connections";

function convert(db: ConnectionsDal.DBConnection): Connection {
  return replaceObjectId(omit(db, "key"));
}
export async function getRequests(
  req: MonkeyRequest<GetConnectionsQuery>
): Promise<GetConnectionsResponse> {
  const { uid } = req.ctx.decodedToken;
  const { status, type } = req.query;

  const results = await ConnectionsDal.getConnections({
    initiatorUid:
      type === undefined || type.includes("outgoing") ? uid : undefined,
    friendUid:
      type === undefined || type?.includes("incoming") ? uid : undefined,
    status: status,
  });

  return new MonkeyResponse("Connections retrieved", results.map(convert));
}

export async function createRequest(
  req: MonkeyRequest<undefined, CreateConnectionRequest>
): Promise<CreateConnectionResponse> {
  const { uid } = req.ctx.decodedToken;
  const { friendName } = req.body;
  const { maxPerUser } = req.ctx.configuration.connections;

  const friend = await UserDal.getUserByName(friendName, "create connection");

  if (uid === friend.uid) {
    throw new MonkeyError(400, "You cannot be your own friend, sorry.");
  }

  const initiator = await UserDal.getPartialUser(uid, "create connection", [
    "uid",
    "name",
  ]);

  const result = await ConnectionsDal.create(initiator, friend, maxPerUser);

  return new MonkeyResponse("Connection created", convert(result));
}

export async function deleteRequest(
  req: MonkeyRequest<undefined, undefined, IdPathParams>
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { id } = req.params;

  await ConnectionsDal.deleteById(uid, id);

  return new MonkeyResponse("Connection deleted", null);
}

export async function updateRequest(
  req: MonkeyRequest<undefined, UpdateConnectionRequest, IdPathParams>
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { id } = req.params;
  const { status } = req.body;

  await ConnectionsDal.updateStatus(uid, id, status);

  return new MonkeyResponse("Connection updated", null);
}
