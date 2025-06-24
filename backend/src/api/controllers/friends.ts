import {
  CreateFriendRequest,
  CreateFriendResponse,
  FriendIdPathParams,
  GetFriendsQuery,
  GetFriendsResponse,
} from "@monkeytype/contracts/friends";
import { MonkeyRequest } from "../types";
import { MonkeyResponse } from "../../utils/monkey-response";

import * as FriendsDal from "../../dal/friends";
import * as UserDal from "../../dal/user";
import { replaceObjectId, replaceObjectIds } from "../../utils/misc";
import MonkeyError from "../../utils/error";

import { buildMonkeyMail } from "../../utils/monkey-mail";

export async function get(
  req: MonkeyRequest<GetFriendsQuery>
): Promise<GetFriendsResponse> {
  const { uid } = req.ctx.decodedToken;
  const status = req.query.status;

  const results = await FriendsDal.get(uid, status);

  return new MonkeyResponse("Friends retrieved", replaceObjectIds(results));
}

export async function create(
  req: MonkeyRequest<undefined, CreateFriendRequest>
): Promise<CreateFriendResponse> {
  const { uid } = req.ctx.decodedToken;
  const friendName = req.body.friendName;

  const friend = await UserDal.getUserByName(friendName, "create friend");

  if (uid === friend.uid) {
    throw new MonkeyError(400, "You cannot be your own friend, sorry.");
  }

  const initiator = await UserDal.getPartialUser(uid, "create friend", [
    "uid",
    "name",
  ]);
  const result = await FriendsDal.create(initiator, friend);

  //notify user
  const mail = buildMonkeyMail({
    subject: "Friend request",
    body: `${initiator.name} wants to be your friend. You can accept/deny this request in [FRIEND_SETTINGS]`,
  });
  await UserDal.addToInbox(
    friend.uid,
    [mail],
    req.ctx.configuration.users.inbox
  );

  return new MonkeyResponse("Friend created", replaceObjectId(result));
}

export async function deleteFriend(
  req: MonkeyRequest<undefined, undefined, FriendIdPathParams>
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { id } = req.params;

  await FriendsDal.deleteFriend(uid, id);

  return new MonkeyResponse("Friend deleted", null);
}
