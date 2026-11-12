import { queryOptions } from "@tanstack/solid-query";
import { baseKey } from "./utils/keys";
import Ape from "../ape";
import { queryClient } from ".";
import { isAuthenticated } from "../states/core";

const queryKeys = {
  root: () => baseKey("friendsList", { isUserSpecific: true }),
};

// oxlint-disable-next-line typescript/explicit-function-return-type
export const getFriendsListQuery = () =>
  queryOptions({
    queryKey: queryKeys.root(),
    // The friends page is auth-gated; don't fetch for a signed-out user
    // (a sign out reset would otherwise refetch into a 401).
    enabled: isAuthenticated,
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
