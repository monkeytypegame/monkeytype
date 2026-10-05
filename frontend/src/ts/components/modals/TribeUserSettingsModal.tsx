import { JSXElement } from "solid-js";

import { hideModal } from "../../states/modals";
import { getTribeUserSettingsUserId } from "../../states/tribe";
import tribeSocket from "../../tribe/tribe-socket";
import * as TribeState from "../../tribe/tribe-state";
import { AnimatedModal } from "../common/AnimatedModal";
import { Button } from "../common/Button";

const modalId = "TribeUserSettings";

export function TribeUserSettingsModal(): JSXElement {
  const userName = (): string | undefined => {
    const userId = getTribeUserSettingsUserId();
    if (userId === null) return undefined;
    return TribeState.getRoom()?.users[userId]?.name;
  };

  const run = (action: (userId: string) => void): void => {
    const userId = getTribeUserSettingsUserId();
    if (userId === null) return;
    action(userId);
    hideModal(modalId);
  };

  return (
    <AnimatedModal
      id={modalId}
      title={`User settings (${userName() ?? ""})`}
      modalClass="max-w-sm"
    >
      <div class="grid gap-4">
        <Button
          fa={{ icon: "fa-star", fixedWidth: true }}
          text="Give leader"
          onClick={() => run((id) => tribeSocket.out.room.giveLeader(id))}
        />
        <Button
          fa={{ icon: "fa-hammer", fixedWidth: true }}
          text="Ban"
          onClick={() => run((id) => tribeSocket.out.room.banUser(id))}
        />
      </div>
    </AnimatedModal>
  );
}
