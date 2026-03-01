import {
  TypingStats as TypingStatsType,
  UserProfile,
  UserProfileDetails,
} from "@monkeytype/schemas/users";
import {
  getCurrentDayTimestamp,
  isToday as dateIsToday,
  isYesterday as dateIsYesterday,
} from "@monkeytype/util/date-and-time";
import { isSafeNumber } from "@monkeytype/util/numbers";
import { differenceInDays } from "date-fns/differenceInDays";
import { formatDate } from "date-fns/format";
import { formatDistanceToNowStrict } from "date-fns/formatDistanceToNowStrict";
import { createEffect, createSignal, For, JSXElement, Show } from "solid-js";

import { Snapshot } from "../../../constants/default-snapshot";
import { isFriend } from "../../../db";
import * as Notifications from "../../../elements/notifications";
import * as EditProfileModal from "../../../modals/edit-profile";
import * as UserReportModal from "../../../modals/user-report";
import { addFriend } from "../../../pages/friends";
import { getUserId, isLoggedIn } from "../../../signals/core";
import { getLastResult, getSnapshot } from "../../../stores/snapshot";
import { cn } from "../../../utils/cn";
import { secondsToString } from "../../../utils/date-and-time";
import { formatXp, getXpDetails } from "../../../utils/levels";
import { AutoShrink } from "../../common/AutoShrink";
import { Button } from "../../common/Button";
import { Conditional } from "../../common/Conditional";
import { DiscordAvatar } from "../../common/DiscordAvatar";
import { UserBadge } from "../../common/UserBadge";
import { UserFlags } from "../../common/UserFlags";

type Variant = "basic" | "hasSocials" | "hasBioOrKeyboard" | "full";

export function UserDetails(props: {
  profile: UserProfile;
  isAccountPage?: true;
}): JSXElement {
  const variant = () => {
    if (props.profile.banned) return "basic";

    const hasSocials = props.profile.details?.socialProfiles !== undefined;
    const hasBioOrKeyboard =
      (props.profile.details?.bio !== undefined &&
        props.profile.details?.bio !== "") ||
      (props.profile.details?.keyboard !== undefined &&
        props.profile.details?.keyboard !== "");
    if (!hasSocials && !hasBioOrKeyboard) return "basic";
    if (hasSocials && !hasBioOrKeyboard) return "hasSocials";
    if (!hasSocials && hasBioOrKeyboard) return "hasBioOrKeyboard";
    return "full";
  };

  return (
    <div class="grid grid-cols-[1fr_minmax(0,2rem)] rounded bg-sub-alt">
      <div
        class={cn(
          "grid items-center gap-4 p-4",
          variant() === "basic" && "md:grid-cols-[17.5rem_auto_1fr]",
          variant() === "hasBioOrKeyboard" &&
            "sm:grid-cols-2 md:grid-cols-[17.5rem_auto_auto_auto_1fr] lg:grid-cols-[17.5rem_auto_1fr_auto_2fr]",
          variant() === "hasSocials" &&
            "sm:grid-cols-2 md:grid-cols-[17.5rem_auto_1fr_auto_auto]",
          variant() === "full" &&
            "sm:grid-cols-2 md:grid-cols-[1fr_auto_1fr_auto] lg:grid-cols-[17.5rem_auto_auto_auto_1fr_auto_auto] xl:lg:grid-cols-[17.5rem_auto_1fr_auto_2fr_auto_auto]",
        )}
      >
        <AvatarAndName
          profile={props.profile}
          variant={variant()}
          isAccountPage={props.isAccountPage}
        />
        <Show when={variant() === "full" || variant() === "hasBioOrKeyboard"}>
          <BioAndKeyboard details={props.profile.details} variant={variant()} />
        </Show>
        <TypingStats
          typingStats={props.profile.typingStats}
          variant={variant()}
        />
        <Show when={variant() === "full" || variant() === "hasSocials"}>
          <Socials
            socials={props.profile.details?.socialProfiles}
            variant={variant()}
          />
        </Show>
      </div>

      <div class="flex h-full flex-col">
        <ActionButtons
          profile={props.profile}
          isAccountPage={props.isAccountPage}
        />
      </div>
    </div>
  );
}

function ActionButtons(props: {
  profile: UserProfile;
  isAccountPage?: true;
}): JSXElement {
  const isUsersProfile = () =>
    props.profile.uid !== undefined &&
    props.profile.uid === (getUserId() ?? "");

  const [hasFriendRequest, setHasFriendRequest] = createSignal(false);
  const showFriendsButton = () =>
    isLoggedIn() && !isUsersProfile() && !hasFriendRequest();

  createEffect(() => {
    setHasFriendRequest(
      !isUsersProfile() &&
        getSnapshot()?.connections[props.profile.uid ?? ""] !== undefined,
    );
  });

  const handleAddFriend = () => {
    const friendName = props.profile.name;
    void addFriend(friendName).then((result) => {
      if (result === true) {
        Notifications.add(`Request sent to ${friendName}`);
        setHasFriendRequest(true);
      } else {
        Notifications.add(result, -1);
      }
    });
  };

  return (
    <Conditional
      if={props.isAccountPage === true}
      then={
        <>
          <Button
            ariaLabel={{ text: "Edit profile", position: "left" }}
            class="h-full rounded-none rounded-tr text-sub hover:text-bg"
            fa={{ icon: "fa-pen", fixedWidth: true }}
            onClick={() => {
              if (props.profile.banned === true) {
                Notifications.add("Banned users cannot edit their profile", 0);
                return;
              }
              EditProfileModal.show();
            }}
          />
          <Button
            ariaLabel={{ text: "Copy public link", position: "left" }}
            class="h-full rounded-none rounded-br text-sub hover:text-bg"
            fa={{ icon: "fa-link", fixedWidth: true }}
            onClick={() => {
              const url = `${location.origin}/profile/${props.profile.name}`;

              navigator.clipboard.writeText(url).then(
                function () {
                  Notifications.add("URL Copied to clipboard", 0);
                },
                function () {
                  alert(
                    "Failed to copy using the Clipboard API. Here's the link: " +
                      url,
                  );
                },
              );
            }}
          />
        </>
      }
      else={
        <>
          <Show when={!isUsersProfile()}>
            <Button
              ariaLabel={{ text: "Report user", position: "left" }}
              class={cn(
                "h-full rounded-none rounded-tr text-sub hover:text-bg",
                {
                  "rounded-br": !showFriendsButton(),
                },
              )}
              fa={{ icon: "fa-flag", fixedWidth: true }}
              onClick={() =>
                void UserReportModal.show({
                  uid: props.profile.uid as string,
                  name: props.profile.name,
                  lbOptOut: props.profile.lbOptOut ?? false,
                })
              }
            />
          </Show>
          <Show when={showFriendsButton()}>
            <Button
              ariaLabel={{ text: "Send friend request", position: "left" }}
              class="h-full rounded-none rounded-br text-sub hover:text-bg"
              fa={{ icon: "fa-user-plus", fixedWidth: true }}
              onClick={() => handleAddFriend()}
            />
          </Show>
        </>
      }
    />
  );
}

function AvatarAndName(props: {
  profile: UserProfile;
  variant: Variant;
  isAccountPage?: true;
}): JSXElement {
  const accountAgeHint = () => {
    const creationDate = new Date(props.profile.addedAt);
    const diffDays = differenceInDays(new Date(), creationDate);
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  };

  const formatStreak = (length: number) =>
    `${length} ${length === 1 ? "day" : "days"}`;

  const extraStreakText = () => {
    if (!props.isAccountPage) return "";
    let hoverText = "";

    const lastResult = getLastResult();
    if (lastResult === undefined) return "";

    const streakOffset = (props.profile as Snapshot).streakHourOffset;

    const dayInMilis = 1000 * 60 * 60 * 24;

    let target = getCurrentDayTimestamp(streakOffset) + dayInMilis;
    if (target < Date.now()) {
      target += dayInMilis;
    }
    const timeDif = formatDistanceToNowStrict(target);

    if (lastResult !== undefined) {
      //check if the last result is from today
      const isToday = dateIsToday(lastResult.timestamp, streakOffset);
      const isYesterday = dateIsYesterday(lastResult.timestamp, streakOffset);

      const offsetString = isSafeNumber(streakOffset)
        ? `(${streakOffset > 0 ? "+" : ""}${streakOffset} offset)`
        : "";

      if (isToday) {
        hoverText += `\nClaimed today: yes`;
        hoverText += `\nCome back in: ${timeDif} ${offsetString}`;
      } else if (isYesterday) {
        hoverText += `\nClaimed today: no`;
        hoverText += `\nStreak lost in: ${timeDif} ${offsetString}`;
      } else {
        hoverText += `\nStreak lost ${timeDif} ${offsetString} ago`;
        hoverText += `\nIt will be removed from your profile on the next result save`;
      }

      if (streakOffset === undefined) {
        hoverText += `\n\nIf the streak reset time doesn't line up with your timezone, you can change it in Account Settings > Account > Set streak hour offset.`;
      }
    }
    return hoverText;
  };

  return (
    <div
      class={cn(
        "grid w-full grid-cols-[5rem_1fr] items-center gap-4 self-center text-sub",
        props.variant === "hasSocials" && "sm:col-span-2 md:col-span-1",
      )}
    >
      <DiscordAvatar
        class="h-full w-full place-self-center"
        size={256}
        discordAvatar={props.profile.discordAvatar}
        discordId={props.profile.discordId}
      />

      <div class="flex h-min flex-col gap-1 text-xs [&>div]:w-fit">
        <AutoShrink upperLimitRem={2} class="flex text-text">
          {props.profile.name}

          <div class="flex flex-row gap-1 pl-1 text-sub">
            <UserFlags
              {...props.profile}
              isFriend={isFriend(props.profile.uid)}
            />
          </div>
        </AutoShrink>
        <UserBadge
          id={props.profile.inventory?.badges.find((it) => it.selected)?.id}
        />
        <For
          each={props.profile.inventory?.badges
            .filter((it) => !it.selected)
            .map((it) => it.id)}
        >
          {(badgeId) => <UserBadge id={badgeId} iconOnly />}
        </For>
        <div class="grid">
          <span aria-label={accountAgeHint()} data-balloon-pos="up">
            Joined {formatDate(props.profile.addedAt ?? 0, "dd MMM yyyy")}
          </span>
          <Show when={(props.profile.streak ?? 0) > 1}>
            <span
              aria-label={`Longest streak: ${formatStreak(props.profile.maxStreak)}${extraStreakText()}`}
              data-balloon-pos="up"
              data-balloon-break=""
              data-balloon-length="large"
            >
              Current streak {formatStreak(props.profile.streak)}
            </span>
          </Show>
        </div>
      </div>

      <LevelAndBar xp={props.profile.xp} />
    </div>
  );
}

function LevelAndBar(props: { xp?: number }): JSXElement {
  const xpDetails = () => getXpDetails(props.xp ?? 0);
  const bar = () =>
    ((xpDetails().levelCurrentXp / xpDetails().levelMaxXp) * 100).toFixed(2) +
    "%";

  return (
    <div class="col-span-2 flex w-full items-center gap-2">
      <div
        class="shrink-0 text-text"
        data-balloon-pos="up"
        aria-label={formatXp(props.xp ?? 0) + " total xp"}
      >
        {xpDetails().level}
      </div>
      <div
        class="h-2 flex-1 rounded bg-bg"
        data-balloon-pos="up"
        aria-label={bar()}
      >
        <div
          class="h-2 rounded bg-main"
          style={{
            width: bar(),
          }}
        >
          &nbsp;
        </div>
      </div>
      <div
        class="shrink-0 text-xs"
        data-balloon-pos="up"
        aria-label={
          formatXp(xpDetails().levelMaxXp - xpDetails().levelCurrentXp) +
          " xp until next level"
        }
      >
        {formatXp(xpDetails().levelCurrentXp)}/
        {formatXp(xpDetails().levelMaxXp)}{" "}
      </div>
    </div>
  );
}

function BioAndKeyboard(props: {
  details?: UserProfileDetails;
  variant: Variant;
}): JSXElement {
  return (
    <>
      <div
        class={cn(
          "hidden h-full w-2 rounded bg-bg",
          props.variant === "hasBioOrKeyboard" && "md:order-3 md:block",
          props.variant === "full" && "md:block lg:order-3",
        )}
      ></div>
      <div
        class={cn(
          "flex h-full flex-col content-center justify-around gap-2 overflow-hidden text-sm",
          props.variant === "hasBioOrKeyboard" && "md:order-4",
          props.variant === "full" && "md:col-span-2 lg:order-4 lg:col-span-1",
        )}
      >
        <div>
          <div class="text-sub">bio</div>
          <div>{props.details?.bio}</div>
        </div>

        <div>
          <div class="text-sub">keyboard</div>
          <div>{props.details?.keyboard}</div>
        </div>
      </div>
    </>
  );
}

function TypingStats(props: {
  typingStats: TypingStatsType;
  variant: Variant;
}): JSXElement {
  return (
    <>
      <div
        class={cn(
          "hidden h-full w-2 rounded bg-bg",
          props.variant === "basic" && "md:block",
          props.variant === "hasBioOrKeyboard" && "md:order-1 md:block",
          props.variant === "hasSocials" && "md:block",
          props.variant === "full" && "lg:order-1 lg:block",
        )}
      ></div>
      {/* <div class="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-4 sm:grid-cols-3 lg:flex lg:flex-col"> */}
      <div
        class={cn(
          "grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-2",
          props.variant === "basic" &&
            "sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3 lg:text-[1.25rem]",
          props.variant === "hasBioOrKeyboard" &&
            "sm:col-span-2 md:order-2 md:col-span-1 md:grid-cols-1",
          props.variant === "hasSocials" &&
            "sm:col-span-2 sm:grid-cols-3 md:col-span-1 md:grid-cols-1 lg:grid-cols-3 xl:text-[1.25rem]",
          props.variant === "full" &&
            "sm:col-span-2 sm:grid-cols-3 md:col-span-3 md:grid-cols-3 lg:order-2 lg:col-span-1 lg:grid-cols-1",
        )}
      >
        <div class="flex flex-col">
          <div class="text-em-sm text-sub">tests started</div>
          <div class="text-em-2xl leading-8">
            {props.typingStats.startedTests}
          </div>
        </div>
        <div class="flex flex-col">
          <div class="text-em-sm text-sub">tests completed</div>
          <div class="text-em-2xl leading-8">
            {props.typingStats.completedTests}
          </div>
        </div>
        <div class="flex flex-col">
          <div class="text-em-sm text-sub">time typing</div>
          <div class="text-em-2xl leading-8">
            {secondsToString(
              Math.round(props.typingStats.timeTyping ?? 0),
              true,
              true,
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Socials(props: {
  socials?: UserProfileDetails["socialProfiles"];
  variant: Variant;
}): JSXElement {
  return (
    <>
      <div
        class={cn(
          "hidden h-full w-2 rounded bg-bg",
          props.variant === "hasSocials" && "md:block",
          props.variant === "full" && "md:hidden lg:order-5 lg:block",
        )}
      ></div>
      <div
        class={cn(
          "grid h-full md:place-content-center",
          props.variant === "full" && "lg:order-6",
        )}
      >
        <div
          class={cn(
            "text-sm text-sub md:hidden",
            props.variant === "full" && "md:block lg:hidden",
          )}
        >
          socials
        </div>
        <div
          class={cn(
            "flex gap-2 text-2xl text-text md:flex-col lg:h-full lg:flex-col lg:justify-around [&>a]:p-0 [&>a]:text-text [&>a]:hover:text-main",
            props.variant === "full" && "md:flex-row",
          )}
        >
          <Show when={props.socials?.github}>
            <Button
              type="text"
              fa={{ icon: "fa-github", variant: "brand", fixedWidth: true }}
              href={`https://github.com/${props.socials?.github}`}
              ariaLabel={{ text: props.socials?.github ?? "", position: "up" }}
            />
          </Show>
          <Show when={props.socials?.twitter}>
            <Button
              type="text"
              fa={{ icon: "fa-twitter", variant: "brand", fixedWidth: true }}
              href={`https://x.com/${props.socials?.twitter}`}
              ariaLabel={{ text: props.socials?.twitter ?? "", position: "up" }}
            />
          </Show>
          <Show when={props.socials?.website}>
            <Button
              type="text"
              fa={{ icon: "fa-globe", fixedWidth: true }}
              href={props.socials?.website ?? ""}
              ariaLabel={{ text: props.socials?.website ?? "", position: "up" }}
            />
          </Show>
        </div>
      </div>
    </>
  );
}
