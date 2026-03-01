import { JSXElement } from "solid-js";

import { Snapshot } from "../../../constants/default-snapshot";
import { getLevelFromTotalXp } from "../../../utils/levels";
import { AnimeConditional } from "../../common/anime";
import { Button } from "../../common/Button";
import { DiscordAvatar } from "../../common/DiscordAvatar";
import { Fa } from "../../common/Fa";
import { UserFlags } from "../../common/UserFlags";

type Props = {
  user: Pick<
    Snapshot,
    | "discordId"
    | "discordAvatar"
    | "name"
    | "xp"
    | "banned"
    | "lbOptOut"
    | "isPremium"
  >;
  loggedIn: boolean;
  showSpinner: boolean;
  onClick: () => void;
};

export function UserButton(props: Props): JSXElement {
  const animeProps = {
    initial: { opacity: 0 },
    animate: { opacity: 1, duration: 125 },
    exit: { opacity: 0, duration: 125 },
  };
  return (
    <Button
      type="text"
      onClick={props.onClick}
      class="hover:[&_.level]:bg-text hover:[&_svg]:fill-text"
    >
      <div class="grid place-items-center">
        <div class="grid grid-flow-col place-items-center gap-2">
          <div class="w-[1.25em]">
            <AnimeConditional
              {...animeProps}
              exitBeforeEnter
              if={props.showSpinner}
              then={<Fa icon={"fa-circle-notch"} spin={true} />}
              else={
                <DiscordAvatar
                  size={64}
                  discordId={props.user.discordId}
                  discordAvatar={props.user.discordAvatar}
                  fallbackIcon="user"
                />
              }
            />
          </div>
          <div class="text-xs transition-colors duration-125">
            {props.user.name ?? "Unknown User"}
          </div>
          <UserFlags
            class="transition-colors duration-125"
            {...props.user}
            iconsOnly={true}
          />
          <div class="level rounded-half bg-sub px-[0.5em] py-[0.1em] text-[0.7em] text-bg transition-colors duration-125">
            {getLevelFromTotalXp(props.user.xp ?? 0)}
          </div>
        </div>
      </div>
    </Button>
  );
}
