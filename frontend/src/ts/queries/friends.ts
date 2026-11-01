import { queryOptions } from "@tanstack/solid-query";
import { baseKey } from "./utils/keys";
import Ape from "../ape";
import { queryClient } from ".";

const queryKeys = {
  root: () => baseKey("friendsList", { isUserSpecific: true }),
};

// oxlint-disable-next-line typescript/explicit-function-return-type
export const getFriendsListQuery = () =>
  queryOptions({
    queryKey: queryKeys.root(),
    queryFn: async () => {
      const response = await Ape.users.getFriends();
      if (response.status !== 200) {
        throw new Error(
          `Failed to load friends list: ${response.body.message}`,
        );
      }
      return response.body.data;
    },
  });

export async function invalidateFriendsList(): Promise<void> {
  await queryClient.invalidateQueries({
    queryKey: queryKeys.root(),
  });
}
