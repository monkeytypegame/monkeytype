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
import { replaceObjectId, omit } from "../../utils/misc";
import MonkeyError from "../../utils/error";

import { Connection } from "@monkeytype/schemas/connections";

function convert(db: ConnectionsDal.DBConnection): Connection {
  return replaceObjectId(omit(db, ["key"]));
}
export async function getConnections(
  req: MonkeyRequest<GetConnectionsQuery>,
): Promise<GetConnectionsResponse> {
  const { uid } = req.ctx.decodedToken;
  const { status, type } = req.query;

  const results = await ConnectionsDal.getConnections({
    initiatorUid:
      type === undefined || type.includes("outgoing") ? uid : undefined,
    receiverUid:
      type === undefined || type?.includes("incoming") ? uid : undefined,
    status: status,
  });

  return new MonkeyResponse("Connections retrieved", results.map(convert));
}

export async function createConnection(
  req: MonkeyRequest<undefined, CreateConnectionRequest>,
): Promise<CreateConnectionResponse> {
  const { uid } = req.ctx.decodedToken;
  const { receiverName } = req.body;
  const { maxPerUser } = req.ctx.configuration.connections;

  const receiver = await UserDal.getUserByName(
    receiverName,
    "create connection",
  );

  if (uid === receiver.uid) {
    throw new MonkeyError(400, "You cannot be your own friend, sorry.");
  }

  const initiator = await UserDal.getPartialUser(uid, "create connection", [
    "uid",
    "name",
  ]);

  const result = await ConnectionsDal.create(initiator, receiver, maxPerUser);

  return new MonkeyResponse("Connection created", convert(result));
}

export async function deleteConnection(
  req: MonkeyRequest<undefined, undefined, IdPathParams>,
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { id } = req.params;

  await ConnectionsDal.deleteById(uid, id);

  return new MonkeyResponse("Connection deleted", null);
}

export async function updateConnection(
  req: MonkeyRequest<undefined, UpdateConnectionRequest, IdPathParams>,
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { id } = req.params;
  const { status } = req.body;

  await ConnectionsDal.updateStatus(uid, id, status);

  return new MonkeyResponse("Connection updated", null);
}
