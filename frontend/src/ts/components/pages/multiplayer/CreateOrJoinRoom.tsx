import type { RaceConfig } from "@monkeytype/schemas/multiplayer";

import { useQuery } from "@tanstack/solid-query";
import { createSignal, Show } from "solid-js";

import { navigate } from "../../../controllers/route-controller";
import { createAndJoinRoom } from "../../../multiplayer/actions";
import { getFriendsListQuery } from "../../../queries/friends";
import { showErrorNotification } from "../../../states/notifications";
import { Button } from "../../common/Button";
import { H2, H3 } from "../../common/Headers";

const DEFAULT_RACE_CONFIG: RaceConfig = {
  mode: "words",
  words: 25,
  time: 30,
  language: "english",
  punctuation: false,
  numbers: false,
  difficulty: "normal",
};

export function CreateOrJoinRoom() {
  const [joinCode, setJoinCode] = createSignal("");
  const [isCreating, setIsCreating] = createSignal(false);

  const friendsQuery = useQuery(() => getFriendsListQuery());

  const create = async (): Promise<void> => {
    setIsCreating(true);
    try {
      await createAndJoinRoom(DEFAULT_RACE_CONFIG);
    } finally {
      setIsCreating(false);
    }
  };

  const join = async (): Promise<void> => {
    const code = joinCode().trim().toUpperCase();
    if (code.length === 0) {
      showErrorNotification("Enter a room code");
      return;
    }
    await navigate(`/multiplayer/${code}`);
  };

  return (
    <div class="content-grid grid gap-8">
      <div>
        <H2 text="Multiplayer" fa={{ icon: "fa-bolt", fixedWidth: true }} />
        <div class="flex flex-wrap gap-4">
          <Button
            text="Create a room"
            fa={{ icon: "fa-plus", fixedWidth: true }}
            onClick={() => void create()}
            disabled={isCreating()}
          />
          <div class="flex items-center gap-2">
            <input
              class="rounded bg-sub-alt p-[0.5em] text-text"
              placeholder="room code"
              value={joinCode()}
              maxLength={6}
              onInput={(e) => setJoinCode(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void join();
              }}
            />
            <Button
              text="Join"
              fa={{ icon: "fa-sign-in-alt", fixedWidth: true }}
              onClick={() => void join()}
            />
          </div>
        </div>
      </div>

      <Show when={(friendsQuery.data?.length ?? 0) > 0}>
        <div>
          <H3
            text="Racing tip"
            fa={{ icon: "fa-user-friends", fixedWidth: true }}
          />
          <div class="text-sub">
            Create a room, then share the room code or link with your friends
            from the friends list to invite them to race.
          </div>
        </div>
      </Show>
    </div>
  );
}
