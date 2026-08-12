import type { RaceConfig } from "@monkeytype/schemas/multiplayer";

import { useQuery } from "@tanstack/solid-query";
import { createMemo, For, Show } from "solid-js";

import { getAuthenticatedUser } from "../../../firebase";
import {
  setReady,
  updateRaceConfig,
  startRace,
  leaveCurrentRoom,
} from "../../../multiplayer/actions";
import { getFriendsListQuery } from "../../../queries/friends";
import { getRoom } from "../../../states/multiplayer";
import {
  showSuccessNotification,
  showErrorNotification,
} from "../../../states/notifications";
import { Button } from "../../common/Button";
import { H2, H3 } from "../../common/Headers";

export function RoomLobby() {
  const room = createMemo(() => getRoom());
  const myUid = () => getAuthenticatedUser()?.uid;
  const isHost = () => room()?.hostUid === myUid();
  const me = () => room()?.players.find((player) => player.uid === myUid());

  const friendsQuery = useQuery(() => getFriendsListQuery());

  const shareLink = (): string =>
    `${window.location.origin}/multiplayer/${room()?.roomCode ?? ""}`;

  const copyLink = async (): Promise<void> => {
    await navigator.clipboard.writeText(shareLink());
    showSuccessNotification("Room link copied to clipboard", {
      durationMs: 2000,
    });
  };

  const connectedPlayers = createMemo(
    () =>
      room()?.players.filter((player) => player.status === "connected") ?? [],
  );
  const allReady = createMemo(
    () =>
      connectedPlayers().length > 0 &&
      connectedPlayers().every((player) => player.isReady),
  );

  const setConfigField = <K extends keyof RaceConfig>(
    key: K,
    value: RaceConfig[K],
  ): void => {
    const current = room()?.config;
    if (current === undefined) return;
    updateRaceConfig({ ...current, [key]: value });
  };

  return (
    <div class="content-grid grid gap-8">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <H2
          text={`Room ${room()?.roomCode ?? ""}`}
          fa={{ icon: "fa-bolt", fixedWidth: true }}
        />
        <div class="flex gap-2">
          <Button
            text="Copy invite link"
            fa={{ icon: "fa-link", fixedWidth: true }}
            onClick={() => void copyLink()}
          />
          <Button
            text="Leave room"
            fa={{ icon: "fa-door-open", fixedWidth: true }}
            danger
            onClick={() => leaveCurrentRoom()}
          />
        </div>
      </div>

      <div>
        <H3 text="Players" fa={{ icon: "fa-users", fixedWidth: true }} />
        <div class="grid gap-2">
          <For each={room()?.players ?? []}>
            {(player) => (
              <div class="flex items-center gap-2 rounded bg-sub-alt p-[0.5em]">
                <span class="flex-1">
                  {player.name}
                  <Show when={player.isHost}> (host)</Show>
                  <Show when={player.status === "disconnected"}>
                    {" "}
                    (disconnected)
                  </Show>
                </span>
                <span class={player.isReady ? "text-main" : "text-sub"}>
                  {player.isReady ? "ready" : "not ready"}
                </span>
              </div>
            )}
          </For>
        </div>
      </div>

      <Show when={isHost()}>
        <div>
          <H3 text="Race settings" fa={{ icon: "fa-cog", fixedWidth: true }} />
          <div class="flex flex-wrap items-center gap-4">
            <Button
              text="words"
              active={room()?.config.mode === "words"}
              onClick={() => setConfigField("mode", "words")}
            />
            <Button
              text="time"
              active={room()?.config.mode === "time"}
              onClick={() => setConfigField("mode", "time")}
            />
            <Show when={room()?.config.mode === "words"}>
              <input
                type="number"
                class="w-20 rounded bg-sub-alt p-[0.5em] text-text"
                value={room()?.config.words ?? 25}
                min={10}
                max={200}
                onChange={(e) =>
                  setConfigField("words", Number(e.currentTarget.value))
                }
              />
            </Show>
            <Show when={room()?.config.mode === "time"}>
              <input
                type="number"
                class="w-20 rounded bg-sub-alt p-[0.5em] text-text"
                value={room()?.config.time ?? 30}
                min={15}
                max={300}
                onChange={(e) =>
                  setConfigField("time", Number(e.currentTarget.value))
                }
              />
            </Show>
            <label class="flex items-center gap-1">
              <input
                type="checkbox"
                checked={room()?.config.punctuation ?? false}
                onChange={(e) =>
                  setConfigField("punctuation", e.currentTarget.checked)
                }
              />
              punctuation
            </label>
            <label class="flex items-center gap-1">
              <input
                type="checkbox"
                checked={room()?.config.numbers ?? false}
                onChange={(e) =>
                  setConfigField("numbers", e.currentTarget.checked)
                }
              />
              numbers
            </label>
          </div>
        </div>
      </Show>

      <div class="flex flex-wrap gap-4">
        <Button
          text={me()?.isReady ? "not ready" : "ready"}
          fa={{ icon: "fa-check", fixedWidth: true }}
          onClick={() => setReady(!(me()?.isReady ?? false))}
        />
        <Show when={isHost()}>
          <Button
            text="Start race"
            fa={{ icon: "fa-play", fixedWidth: true }}
            disabled={!allReady()}
            onClick={() => {
              void startRace().catch(() =>
                showErrorNotification("Failed to start race"),
              );
            }}
          />
        </Show>
      </div>

      <Show when={(friendsQuery.data?.length ?? 0) > 0}>
        <div>
          <H3
            text="Invite friends"
            fa={{ icon: "fa-user-friends", fixedWidth: true }}
          />
          <div class="grid gap-2">
            <For each={friendsQuery.data ?? []}>
              {(friend) => (
                <div class="flex items-center gap-2 rounded bg-sub-alt p-[0.5em]">
                  <span class="flex-1">{friend.name}</span>
                  <Button
                    text="copy link"
                    fa={{ icon: "fa-link", fixedWidth: true }}
                    onClick={() => void copyLink()}
                  />
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>
    </div>
  );
}
