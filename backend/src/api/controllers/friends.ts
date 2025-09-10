import {
  CreateFriendRequestRequest,
  CreateFriendRequestResponse,
  GetFriendRequestsQuery,
  GetFriendRequestsResponse,
  IdPathParams,
  UpdateFriendRequestsRequest,
} from "@monkeytype/contracts/friends";
import { MonkeyRequest } from "../types";
import { MonkeyResponse } from "../../utils/monkey-response";
import * as FriendsDal from "../../dal/friends";
import * as UserDal from "../../dal/user";
import { replaceObjectId } from "../../utils/misc";
import MonkeyError from "../../utils/error";
import { omit } from "lodash";
import { FriendRequest } from "@monkeytype/schemas/friends";

function convert(db: FriendsDal.DBFriendRequest): FriendRequest {
  return replaceObjectId(omit(db, "key"));
}
export async function getRequests(
  req: MonkeyRequest<GetFriendRequestsQuery>
): Promise<GetFriendRequestsResponse> {
  const { uid } = req.ctx.decodedToken;
  const { status, type } = req.query;

  const results = await FriendsDal.getRequests({
    initiatorUid:
      type === undefined || type.includes("outgoing") ? uid : undefined,
    friendUid:
      type === undefined || type?.includes("incoming") ? uid : undefined,
    status: status,
  });

  return new MonkeyResponse("Friend requests retrieved", results.map(convert));
}

export async function createRequest(
  req: MonkeyRequest<undefined, CreateFriendRequestRequest>
): Promise<CreateFriendRequestResponse> {
  const { uid } = req.ctx.decodedToken;
  const { friendName } = req.body;
  const { maxPerUser } = req.ctx.configuration.connections;

  const friend = await UserDal.getUserByName(friendName, "create friend");

  if (uid === friend.uid) {
    throw new MonkeyError(400, "You cannot be your own friend, sorry.");
  }

  const initiator = await UserDal.getPartialUser(uid, "create friend", [
    "uid",
    "name",
  ]);

  const result = await FriendsDal.create(initiator, friend, maxPerUser);

  return new MonkeyResponse("Friend created", convert(result));
}

export async function deleteRequest(
  req: MonkeyRequest<undefined, undefined, IdPathParams>
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { id } = req.params;

  await FriendsDal.deleteById(uid, id);

  return new MonkeyResponse("Friend deleted", null);
}

export async function updateRequest(
  req: MonkeyRequest<undefined, UpdateFriendRequestsRequest, IdPathParams>
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { id } = req.params;
  const { status } = req.body;

  await FriendsDal.updateStatus(uid, id, status);

  return new MonkeyResponse("Friend updated", null);
}
