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
import { addFriend, isFriend } from "../../../db";
import * as EditProfileModal from "../../../modals/edit-profile";
import * as UserReportModal from "../../../modals/user-report";
import { bp } from "../../../states/breakpoints";
import { getUserId, isAuthenticated } from "../../../states/core";
import {
  showNoticeNotification,
  showErrorNotification,
} from "../../../states/notifications";
import { getLastResult, getSnapshot } from "../../../states/snapshot";
import { cn } from "../../../utils/cn";
import { secondsToString } from "../../../utils/date-and-time";
import { formatXp, getXpDetails } from "../../../utils/levels";
import { formatTypingStatsRatio } from "../../../utils/misc";
import { AutoShrink } from "../../common/AutoShrink";
import { Balloon, BalloonProps } from "../../common/Balloon";
import { Bar } from "../../common/Bar";
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
    isAuthenticated() && !isUsersProfile() && !hasFriendRequest();

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
        showNoticeNotification(`Request sent to ${friendName}`);
        setHasFriendRequest(true);
      } else {
        showErrorNotification(result);
      }
    });
  };

  return (
    <Conditional
      if={props.isAccountPage === true}
      then={
        <>
          <Button
            balloon={{ text: "Edit profile", position: "left" }}
            class="h-full rounded-none rounded-tr text-sub hover:text-bg"
            fa={{ icon: "fa-pen", fixedWidth: true }}
            onClick={() => {
              if (props.profile.banned === true) {
                showNoticeNotification(
                  "Banned users cannot edit their profile",
                );
                return;
              }
              EditProfileModal.show();
            }}
          />
          <Button
            balloon={{ text: "Copy public link", position: "left" }}
            class="h-full rounded-none rounded-br text-sub hover:text-bg"
            fa={{ icon: "fa-link", fixedWidth: true }}
            onClick={() => {
              const url = `${location.origin}/profile/${props.profile.name}`;

              navigator.clipboard.writeText(url).then(
                function () {
                  showNoticeNotification("URL Copied to clipboard");
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
              balloon={{ text: "Report user", position: "left" }}
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
              balloon={{ text: "Send friend request", position: "left" }}
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

  const balloonPosition = (): BalloonProps["position"] =>
    bp().md ? "right" : "up";

  return (
    <div
      class={cn(
        "grid w-full grid-cols-[5rem_1fr] items-center gap-4 self-center text-sub",
        props.variant === "hasSocials" && "sm:col-span-2 md:col-span-1",
      )}
    >
      <DiscordAvatar
        class="h-auto w-full place-self-center"
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
        <div class="flex flex-col gap-1 text-base">
          <UserBadge
            id={props.profile.inventory?.badges.find((it) => it.selected)?.id}
            balloon={{
              position: balloonPosition(),
              length: balloonPosition() === "up" ? "medium" : undefined,
            }}
            class="w-max"
            hideTextOnSmallScreens={false}
          />
          <Show
            when={props.profile.inventory?.badges.some((it) => !it.selected)}
          >
            <div class="flex flex-row gap-1">
              <For
                each={props.profile.inventory?.badges
                  .filter((it) => !it.selected)
                  .map((it) => it.id)}
              >
                {(badgeId) => (
                  <UserBadge
                    id={badgeId}
                    iconOnly
                    balloon={{
                      position: balloonPosition(),
                      length: balloonPosition() === "up" ? "medium" : undefined,
                    }}
                  />
                )}
              </For>
            </div>
          </Show>
        </div>
        <div class="grid">
          <Balloon inline text={accountAgeHint()} position={balloonPosition()}>
            Joined {formatDate(props.profile.addedAt ?? 0, "dd MMM yyyy")}
          </Balloon>
          <Show when={(props.profile.streak ?? 0) > 1}>
            <Balloon
              inline
              text={`Longest streak: ${formatStreak(props.profile.maxStreak)}${extraStreakText()}`}
              position={balloonPosition()}
              break
              length="large"
            >
              Current streak {formatStreak(props.profile.streak)}
            </Balloon>
          </Show>
        </div>
      </div>

      <LevelAndBar xp={props.profile.xp} />
    </div>
  );
}

function LevelAndBar(props: { xp?: number }): JSXElement {
  const xpDetails = () => getXpDetails(props.xp ?? 0);
  const bar = () => xpDetails().levelProgressPercent;

  return (
    <div class="col-span-2 flex w-full items-center gap-2">
      <Balloon
        class="shrink-0 text-text"
        text={formatXp(props.xp ?? 0) + " total xp"}
      >
        {xpDetails().level}
      </Balloon>
      <Bar percent={bar()} fill="main" bg="bg" showPercentageOnHover />
      <Balloon
        class="shrink-0 text-xs"
        text={
          formatXp(xpDetails().levelMaxXp - xpDetails().levelCurrentXp) +
          " xp until next level"
        }
      >
        {formatXp(xpDetails().levelCurrentXp)}/
        {formatXp(xpDetails().levelMaxXp)}{" "}
      </Balloon>
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
          "flex h-full flex-col content-center justify-around gap-2 overflow-hidden text-sm whitespace-pre-line",
          props.variant === "hasBioOrKeyboard" && "md:order-4",
          props.variant === "full" && "md:col-span-2 lg:order-4 lg:col-span-1",
        )}
      >
        <Show
          when={
            props.details?.bio !== undefined && props.details.bio.length > 0
          }
        >
          <div>
            <div class="text-sub">bio</div>
            <div>{props.details?.bio}</div>
          </div>
        </Show>
        <Show
          when={
            props.details?.keyboard !== undefined &&
            props.details.keyboard.length > 0
          }
        >
          <div>
            <div class="text-sub">keyboard</div>
            <div>{props.details?.keyboard}</div>
          </div>
        </Show>
      </div>
    </>
  );
}

function TypingStats(props: {
  typingStats: TypingStatsType;
  variant: Variant;
}): JSXElement {
  const stats = () => formatTypingStatsRatio(props.typingStats);

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
        <Balloon
          class="flex w-max flex-col"
          text={
            stats().completedPercentage !== ""
              ? `${stats().completedPercentage}% (${stats().restartRatio} restarts per completed test)`
              : undefined
          }
        >
          <div class="text-em-sm text-sub">tests completed</div>
          <div class="text-em-2xl leading-8">
            {props.typingStats.completedTests}
          </div>
        </Balloon>
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
        <Show
          when={Object.values(props.socials ?? {}).some(
            (it) => it !== undefined && it.length > 0,
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
        </Show>
        <div
          class={cn(
            "flex gap-2 text-2xl text-text md:flex-col lg:h-full lg:flex-col lg:justify-around [&>a]:p-0 [&>a]:text-text [&>a]:hover:text-main",
            props.variant === "full" && "md:flex-row",
          )}
        >
          <Show when={props.socials?.github}>
            <Button
              variant="text"
              fa={{ icon: "fa-github", variant: "brand", fixedWidth: true }}
              href={`https://github.com/${props.socials?.github}`}
              balloon={{ text: props.socials?.github ?? "" }}
            />
          </Show>
          <Show when={props.socials?.twitter}>
            <Button
              variant="text"
              fa={{ icon: "fa-twitter", variant: "brand", fixedWidth: true }}
              href={`https://x.com/${props.socials?.twitter}`}
              balloon={{ text: props.socials?.twitter ?? "" }}
            />
          </Show>
          <Show when={props.socials?.website}>
            <Button
              variant="text"
              fa={{ icon: "fa-globe", fixedWidth: true }}
              href={props.socials?.website ?? ""}
              balloon={{ text: props.socials?.website ?? "" }}
            />
          </Show>
        </div>
      </div>
    </>
  );
}
