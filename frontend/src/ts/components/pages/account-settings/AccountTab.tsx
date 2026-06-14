import { Show } from "solid-js";

import Ape from "../../../ape";
import * as StreakHourOffsetModal from "../../../modals/streak-hour-offset";
import { showLoaderBar } from "../../../states/loader-bar";
import { showErrorNotification } from "../../../states/notifications";
import { getSnapshot } from "../../../states/snapshot";
import { Fa } from "../../common/Fa";
import {
  showOptOutOfLeaderboardsModal,
  showResetPersonalBestsModal,
} from "../../modals/account-settings/ReauthConfirmModals";
import { showUpdateNameModal } from "../../modals/account-settings/UpdateNameModal";
import { Section } from "./utils";

export function AccountTab() {
  return (
    <>
      <Show
        when={getSnapshot()?.discordId !== undefined}
        fallback={<DiscordNotConnected />}
      >
        <DiscordConnected />
      </Show>

      <UpdateAccountName />
      <UpdateStreakOffset />
      <OptOutLeaderboard />
      <ResetPersonalBests />
    </>
  );
}

function DiscordNotConnected() {
  return (
    <Section
      title="discord integration"
      fa={{ variant: "brand", icon: "fa-discord" }}
      description=<>
        When you connect your monkeytype account to your Discord account, you
        will be automatically assigned a new role every time you achieve a new
        personal best in a 60 second test. If you link your accounts before
        joining the Discord server, the bot <i>will not</i> give you a role.
      </>
      button={{
        text: "link",
        onClick: () => {
          showLoaderBar();
          void Ape.users.getDiscordOAuth().then((response) => {
            if (response.status === 200) {
              window.open(response.body.data.url, "_self");
            } else {
              showErrorNotification(
                `Failed to get OAuth from discord: ${response.body.message}`,
              );
            }
          });
        },
      }}
    />
  );
}

function DiscordConnected() {
  //TODO
  return (
    <Section
      title="discord integration"
      fa={{ variant: "brand", icon: "fa-discord" }}
      description=<>t.b.d</>
    />
  );
}

function UpdateAccountName() {
  return (
    <Section
      title="update account name"
      fa={{ icon: "fa-user" }}
      description=<>
        Change the name of your account.{" "}
        <span class="text-error">You can only do this once every 30 days.</span>
      </>
      button={{
        text: "update name",
        onClick: () => showUpdateNameModal(),
      }}
    />
  );
}

function UpdateStreakOffset() {
  return (
    <Section
      title="set streak hour offset"
      fa={{ icon: "fa-clock" }}
      description=<>
        Streaks reset at midnight UTC by default. If this is not convenient for
        you (for example if it means that streaks reset in the middle of the
        day), you can change the hour offset here.{" "}
        <span class="text-error">You can only do this once!</span>
      </>
      button={{
        text: "update hour offset",
        onClick: () => StreakHourOffsetModal.show(),
      }}
      disabled={getSnapshot()?.streakHourOffset !== undefined}
      disabledText=<>
        <Fa icon="fa-exclamation-triangle" /> You have already set your streak
        hour offset to{" "}
        {`${(getSnapshot()?.streakHourOffset ?? 0) > 0 ? "+" : ""} ${getSnapshot()?.streakHourOffset}`}
        .
      </>
    />
  );
}

function OptOutLeaderboard() {
  return (
    <Section
      title="opt out of leaderboards"
      fa={{ icon: "fa-crown" }}
      description=<>
        Use this if you frequently trigger the anticheat (for example if using
        stenography) to opt out of leaderboards.{" "}
        <span class="text-error">You can&apos;t undo this action!</span>
      </>
      button={{
        text: "opt out",
        onClick: () => showOptOutOfLeaderboardsModal(),
      }}
      disabled={getSnapshot()?.lbOptOut === true}
      disabledText=<>
        <Fa icon="fa-exclamation-triangle" />
        You have opted out of leaderboards.
      </>
    />
  );
}

function ResetPersonalBests() {
  return (
    <Section
      title="reset personal bests"
      fa={{ icon: "fa-crown" }}
      description=<>
        Resets all your personal bests (but doesn&apos;t delete any tests from
        your history). <span class="text-error">You can&apos;t undo this!</span>
      </>
      button={{
        text: "reset personal bests",
        onClick: () => showResetPersonalBestsModal(),
      }}
    />
  );
}
