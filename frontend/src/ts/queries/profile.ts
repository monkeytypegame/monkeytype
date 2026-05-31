import { queryOptions } from "@tanstack/solid-query";
import { baseKey } from "./utils/keys";
import Ape from "../ape";
import { queryClient } from ".";
import { getSnapshot } from "../states/snapshot";

const queryKeys = {
  root: () => baseKey("profiles"),
  profile: (username: string) => [...queryKeys.root(), username],
};

const staleTime = 1000 * 60 * 60;

// oxlint-disable-next-line typescript/explicit-function-return-type
export const getUserProfile = (username: string) =>
  queryOptions({
    queryKey: queryKeys.profile(username),
    queryFn: async () => {
      const response = await Ape.users.getProfile({
        params: { uidOrName: username },
        query: { isUid: false },
      });
      if (response.status !== 200) {
        throw new Error(`Could not fetch profile: ${response.body.message}`);
      }
      return response.body.data;
    },
    staleTime,
    retry: (failureCount, error) => {
      if (error.message.includes("User not found")) return false;
      return failureCount < 3;
    },
  });

export async function invalidateMyProfile(): Promise<void> {
  const username = getSnapshot()?.name;
  if (username !== undefined) {
    await queryClient.resetQueries({ queryKey: queryKeys.profile(username) });
  }
}
