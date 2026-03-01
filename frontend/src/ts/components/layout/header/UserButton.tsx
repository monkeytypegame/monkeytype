import { JSXElement } from "solid-js";

import { AnimeConditional, AnimeSwitch } from "../../common/anime";
import { AnimeMatch } from "../../common/anime/AnimeMatch";
import { Button } from "../../common/Button";
import { DiscordAvatar } from "../../common/DiscordAvatar";
import { Fa } from "../../common/Fa";

type Props = {
  loggedIn: boolean;
  discordId?: string;
  discordAvatar?: string;
  name: string;
  level: number;
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
      class="hover:[&_.level]:bg-text [&_svg]:transition-colors [&_svg]:duration-125 hover:[&_svg]:fill-text"
    >
      <div class="grid place-items-center">
        <AnimeConditional
          exitBeforeEnter
          {...animeProps}
          if={props.loggedIn}
          then={
            <div class="grid grid-flow-col place-items-center gap-2">
              <div class="w-[1.25em]">
                <AnimeSwitch exitBeforeEnter animeProps={animeProps}>
                  <AnimeMatch when={props.showSpinner}>
                    <Fa icon={"fa-circle-notch"} spin={true} />
                  </AnimeMatch>
                  <AnimeMatch when={props.loggedIn}>
                    <DiscordAvatar
                      size={64}
                      discordId={props.discordId}
                      discordAvatar={props.discordAvatar}
                      fallbackIcon="user"
                    />
                  </AnimeMatch>
                </AnimeSwitch>
              </div>
              <div class="text-xs transition-colors duration-125">
                {props.name}
              </div>
              <div class="level rounded-half bg-sub px-[0.5em] py-[0.1em] text-[0.7em] text-bg transition-colors duration-125">
                {props.level}
              </div>
            </div>
          }
          else={
            <Fa
              icon="fa-user"
              variant="regular"
              fixedWidth={true}
              class="text-sub"
            />
          }
        />
      </div>
    </Button>
  );
}
