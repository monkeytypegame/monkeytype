import { Show } from "solid-js";

import { getRoom, getRaceResults } from "../../../states/multiplayer";
import { Page } from "../../common/Page";
import { CreateOrJoinRoom } from "./CreateOrJoinRoom";
import { RaceResultsPage } from "./RaceResultsPage";
import { RoomLobby } from "./RoomLobby";

export function MultiplayerPage() {
  return (
    <Page id="multiplayer" needsAuthentication>
      <Show
        when={getRaceResults() !== null}
        fallback={
          <Show when={getRoom() !== null} fallback={<CreateOrJoinRoom />}>
            <RoomLobby />
          </Show>
        }
      >
        <RaceResultsPage />
      </Show>
    </Page>
  );
}
