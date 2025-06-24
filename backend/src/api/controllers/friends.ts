import {
  CreateFriendRequest,
  CreateFriendResponse,
  FriendIdPathParams,
  GetFriendsQuery,
  GetFriendsResponse,
} from "@monkeytype/contracts/friends";
import { MonkeyRequest } from "../types";
import { MonkeyResponse } from "../../utils/monkey-response";
import { Friend } from "@monkeytype/contracts/schemas/friends";

export async function get(
  req: MonkeyRequest<GetFriendsQuery>
): Promise<GetFriendsResponse> {
  const _status = req.query.status;
  return new MonkeyResponse("Friends retrieved", []);
}

export async function create(
  req: MonkeyRequest<undefined, CreateFriendRequest>
): Promise<CreateFriendResponse> {
  const _friendUid = req.body.friendUid;
  const data: Friend = {
    _id: "id",
    friendUid: "uid1",
    friendName: "Bob",
    addedAt: Date.now(),
    initiatorName: "me",
    initiatorUid: "myUid",
    status: "pending",
  };
  return new MonkeyResponse("Friend created", data);
}

export async function deleteFriend(
  req: MonkeyRequest<undefined, undefined, FriendIdPathParams>
): Promise<MonkeyResponse> {
  const _id = req.params.id;
  return new MonkeyResponse("Friend deleted", null);
}
