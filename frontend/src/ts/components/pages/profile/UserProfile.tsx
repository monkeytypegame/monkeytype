import { PersonalBest, PersonalBests } from "@monkeytype/schemas/shared";
import {
  RankAndCount,
  UserProfile as UserProfileType,
} from "@monkeytype/schemas/users";
import { formatDate } from "date-fns/format";
import { createMemo, For, JSXElement, Show } from "solid-js";

import * as PbTablesModal from "../../../modals/pb-tables";
import { getConfig } from "../../../signals/config";
import { Formatting } from "../../../utils/format";
import { formatTopPercentage } from "../../../utils/misc";
import { Button } from "../../common/Button";
import { ActivityCalendar } from "./ActivityCalendar";
import { UserDetails } from "./UserDetails";

export function UserProfile(props: {
  profile: UserProfileType;
  isAccountPage?: true;
}): JSXElement {
  return (
    <div class="flex w-full flex-col gap-8">
      <UserDetails
        profile={props.profile}
        isAccountPage={props.isAccountPage}
      />
      <Show when={!props.profile.banned && !props.profile.lbOptOut}>
        <LeaderboardPosition
          top15={props.profile.allTimeLbs?.time?.["15"]?.["english"]}
          top60={props.profile.allTimeLbs?.time?.["60"]?.["english"]}
        />
      </Show>
      <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <PbTable
          mode="time"
          mode2={["15", "30", "60", "120"]}
          pbs={props.profile.personalBests.time}
          isAccountPage={props.isAccountPage}
        />
        <PbTable
          mode="words"
          mode2={["10", "25", "50", "100"]}
          pbs={props.profile.personalBests.words}
          isAccountPage={props.isAccountPage}
        />
      </div>
      <Show when={props.profile.lbOptOut}>
        <span class="text-center text-xs text-sub">
          Note: This account has opted out of the leaderboards, meaning their
          results aren&apos;t verified by the anticheat system and may not be
          legitimate.
        </span>
      </Show>

      <ActivityCalendar
        testActivity={props.profile.testActivity}
        isAccountPage={props.isAccountPage}
      />
    </div>
  );
}

function LeaderboardPosition(props: {
  top15?: RankAndCount;
  top60?: RankAndCount;
}): JSXElement {
  const format = createMemo(() => new Formatting(getConfig));

  return (
    <div class="grid w-full grid-cols-1 items-center gap-4 rounded bg-sub-alt p-4 text-sub md:grid-cols-2 lg:grid-cols-3">
      <span class="text-center md:col-span-2 lg:col-span-1">
        All-Time English Leaderboards
      </span>
      <Show when={props.top15 !== undefined}>
        <div class="grid grid-cols-2 gap-x-4">
          <div class="justify-self-end">15 seconds</div>
          <div class="row-span-2 text-3xl text-text">
            {format().rank(props.top15?.rank)}
          </div>
          <div class="justify-self-end text-xs">
            {formatTopPercentage(props.top15)}
          </div>
        </div>
      </Show>
      <Show when={props.top60 !== undefined}>
        <div class="grid grid-cols-2 gap-x-4">
          <div class="justify-self-end">60 seconds</div>
          <div class="row-span-2 text-3xl text-text">
            {format().rank(props.top60?.rank)}
          </div>
          <div class="justify-self-end text-xs">
            {formatTopPercentage(props.top60)}
          </div>
        </div>
      </Show>
    </div>
  );
}

function PbTable<M extends "time" | "words">(props: {
  mode: M;
  mode2: string[];
  pbs: PersonalBests[M];
  isAccountPage?: true;
}): JSXElement {
  const format = createMemo(() => new Formatting(getConfig));

  const bests = createMemo(() =>
    props.mode2.map((mode) => {
      const pbArray = props.pbs[mode] ?? [];

      const best = pbArray.reduce<PersonalBest | undefined>(
        (max, current) => (current.wpm > (max?.wpm ?? 0) ? current : max),
        undefined,
      );

      return {
        mode2: mode,
        pb: best,
      };
    }),
  );

  return (
    <div class="grid grid-cols-[1fr_minmax(0,2rem)] rounded bg-sub-alt">
      <div class="grid grid-cols-2 gap-8 p-4 md:grid-cols-4">
        <For each={bests()}>
          {(item) => (
            <div class="grid items-center">
              <div class="col-start-1 row-start-1 text-center">
                <div class="text-xs text-sub">
                  {item.mode2} {props.mode === "time" ? "seconds" : "words"}
                </div>
                <div class="text-4xl">
                  {format().typingSpeed(item.pb?.wpm, {
                    showDecimalPlaces: false,
                  })}
                </div>
                <div class="text-xl">
                  {format().accuracy(item.pb?.acc, {
                    showDecimalPlaces: false,
                  })}
                </div>
              </div>
              <Show when={item.pb !== undefined}>
                <div class="col-start-1 row-start-1 grid bg-sub-alt text-center text-xs opacity-0 transition-opacity hover:opacity-100">
                  <div class="text-sub">
                    {item.mode2} {props.mode === "time" ? "seconds" : "words"}
                  </div>
                  <div>
                    {format().typingSpeed(item.pb?.wpm)}{" "}
                    {format().typingSpeedUnit}
                  </div>
                  <div>{format().typingSpeed(item.pb?.raw)} raw</div>
                  <div>{format().accuracy(item.pb?.acc)} acc</div>
                  <div>{format().percentage(item.pb?.consistency)} con</div>
                  <div class="text-sub">
                    {formatDate(item.pb?.timestamp ?? 0, "dd MMM yyyy")}
                  </div>
                </div>
              </Show>
            </div>
          )}
        </For>
      </div>
      <Show when={props.isAccountPage}>
        <div class="flex h-full flex-col">
          <Button
            ariaLabel={{ text: "Show all personal bests", position: "left" }}
            class="h-full rounded-none rounded-r text-sub hover:text-bg"
            fa={{ icon: "fa-ellipsis-v" }}
            onClick={() => PbTablesModal.show(props.mode)}
          />
        </div>
      </Show>
    </div>
  );
}
