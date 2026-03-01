import { JSXElement } from "solid-js";

import { AnimeSwitch } from "../../common/anime";
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
      class="grid hover:[&_.level]:bg-text [&_svg]:transition-colors [&_svg]:duration-125 hover:[&_svg]:fill-text"
    >
      <AnimeSwitch>
        <AnimeMatch {...animeProps} when={props.showSpinner}>
          <Fa icon={"fa-circle-notch"} spin={true} />
        </AnimeMatch>
        <AnimeMatch {...animeProps} when={props.loggedIn}>
          <DiscordAvatar
            size={64}
            discordId={props.discordId}
            discordAvatar={props.discordAvatar}
          />
        </AnimeMatch>
        <AnimeMatch {...animeProps} when={!props.loggedIn}>
          <Fa
            icon="fa-user"
            variant="regular"
            fixedWidth={true}
            class="text-sub"
          />
        </AnimeMatch>
      </AnimeSwitch>
      <div class="grid grid-flow-col place-items-center gap-2">
        <div class="text-xs transition-colors duration-125">{props.name}</div>
        <div class="level rounded-half bg-sub px-[0.5em] py-[0.1em] text-[0.7em] text-bg transition-colors duration-125">
          {props.level}
        </div>
      </div>
    </Button>
  );

  // return (
  //   <div>
  //     <Conditional
  //       if={props.loggedIn}
  //       then={
  //         <Button type="text" onClick={props.onClick}>
  //           <AnimePresence exitBeforeEnter>
  //             <Show when={props.avatarUrl}>
  //               <Anime
  //                 initial={{ opacity: 0 }}
  //                 animate={{ opacity: 1, duration: 125 }}
  //                 exit={{ opacity: 0 }}
  //                 class="grid items-center"
  //               >
  //                 <DiscordAvatar
  //                   size={64}
  //                   discordId={getAuthenticatedUser()?.discordId}
  //                   discordAvatar={getAuthenticatedUser()?.discordAvatar}
  //                   fallbackIcon="user"
  //                 />
  //               </Anime>
  //             </Show>
  //             <Show when={!hasAvatar()}>
  //               <Anime
  //                 initial={{ opacity: 0 }}
  //                 animate={{ opacity: 1, duration: 125 }}
  //                 exit={{ opacity: 0 }}
  //                 class="grid items-center"
  //               >
  //                 <Fa icon="fa-user" />
  //               </Anime>
  //             </Show>
  //             <Show when={true}>
  //               <Anime
  //                 initial={{ opacity: 0 }}
  //                 animate={{ opacity: 1, duration: 125 }}
  //                 exit={{ opacity: 0 }}
  //               >
  //                 <Fa icon={"fa-circle-notch"} spin={true} />
  //               </Anime>
  //             </Show>
  //           </AnimePresence>
  //           <div class="text-xs">{getSnapshot()?.name}</div>
  //           <div class="level rounded-half bg-sub px-[0.5em] py-[0.1em] text-[0.7em] text-bg transition-colors duration-125 hover:bg-text">
  //             {getLevelFromTotalXp(getSnapshot()?.xp ?? 0)}
  //           </div>
  //         </Button>
  //       }
  //       else={
  //         <Button
  //           type="text"
  //           fa={{
  //             icon: "fa-user",
  //             variant: "regular",
  //             fixedWidth: true,
  //           }}
  //           router-link
  //           href="/login"
  //         />
  //       }
  //     />
  //   </div>
  // );
}
