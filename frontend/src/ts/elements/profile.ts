import * as DB from "../db";
import { format as dateFormat } from "date-fns/format";
import { differenceInDays } from "date-fns/differenceInDays";
import * as Misc from "../utils/misc";
import * as Numbers from "@monkeytype/util/numbers";
import * as Levels from "../utils/levels";
import * as DateTime from "@monkeytype/util/date-and-time";
import { getHTMLById } from "../controllers/badge-controller";
import { throttle } from "throttle-debounce";
import { getActivePage } from "../signals/core";
import { formatDistanceToNowStrict } from "date-fns/formatDistanceToNowStrict";
import { getHtmlByUserFlags } from "../controllers/user-flag-controller";
import Format from "../utils/format";
import { UserProfile } from "@monkeytype/schemas/users";
import { convertRemToPixels } from "../utils/numbers";
import { secondsToString } from "../utils/date-and-time";
import { getAuthenticatedUser } from "../firebase";
import { Snapshot } from "../constants/default-snapshot";
import { getAvatarElement } from "../utils/discord-avatar";
import { formatXp } from "../utils/levels";
import { formatTopPercentage } from "../utils/misc";
import { get as getServerConfiguration } from "../ape/server-configuration";
import { qs } from "../utils/dom";

type ProfileViewPaths = "profile" | "account";
type UserProfileOrSnapshot = UserProfile | Snapshot;

//this is probably the dirtiest code ive ever written

export async function update(
  where: ProfileViewPaths,
  profile: UserProfileOrSnapshot,
): Promise<void> {
  const elementClass = where.charAt(0).toUpperCase() + where.slice(1);
  const profileElement = qs(`.page${elementClass} .profile`);
  const details = qs(`.page${elementClass} .profile .details`);

  profileElement?.setAttribute("uid", profile.uid ?? "");
  profileElement?.setAttribute("name", profile.name ?? "");

  // ============================================================================
  // DO FREAKING NOT USE .HTML OR .APPEND HERE - USER INPUT!!!!!!
  // ============================================================================

  const banned = profile.banned === true;

  if (
    details === undefined ||
    profile === undefined ||
    profile.name === undefined ||
    profile.addedAt === undefined
  ) {
    return;
  }

  const avatar = details?.qs(".avatarAndName .avatar");
  avatar?.replaceWith(getAvatarElement(profile, { size: 256 }));

  let badgeMainHtml = "";
  let badgeRestHtml = "";
  if (profile.inventory?.badges && !banned) {
    for (const badge of profile.inventory.badges) {
      if (badge.selected === true) {
        badgeMainHtml = getHTMLById(badge.id);
      } else {
        badgeRestHtml += getHTMLById(badge.id, true);
      }
    }
  }
  details?.qs(".badges")?.empty().appendHtml(badgeMainHtml);
  details?.qs(".allBadges")?.empty().appendHtml(badgeRestHtml);

  details?.qs(".name")?.setText(profile.name);
  details
    ?.qs(".userFlags")
    ?.setHtml(
      getHtmlByUserFlags({ ...profile, isFriend: DB.isFriend(profile.uid) }),
    );

  if (profile.lbOptOut === true) {
    if (where === "profile") {
      profileElement
        ?.qs(".lbOptOutReminder")
        ?.removeClass("hidden")
        ?.setText(
          "Note: This account has opted out of the leaderboards, meaning their results aren't verified by the anticheat system and may not be legitimate.",
        );
    } else {
      profileElement?.qs(".lbOptOutReminder")?.addClass("hidden");
    }
  }

  setTimeout(() => {
    updateNameFontSize(where);
  }, 10);

  const joinedText =
    "Joined " + dateFormat(profile.addedAt ?? 0, "dd MMM yyyy");
  const creationDate = new Date(profile.addedAt);
  const diffDays = differenceInDays(new Date(), creationDate);
  const balloonText = `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  details
    ?.qs(".joined")
    ?.setText(joinedText)
    .setAttribute("aria-label", balloonText);

  let hoverText = "";

  if (profile.streak && profile?.streak > 1) {
    details
      ?.qs(".streak")
      ?.setText(
        `Current streak: ${profile.streak} ${
          profile.streak === 1 ? "day" : "days"
        }`,
      );
    hoverText = `Longest streak: ${profile.maxStreak} ${
      profile.maxStreak === 1 ? "day" : "days"
    }`;
  } else {
    details?.qs(".streak")?.setText("");
    hoverText = "";
  }

  if (where === "account") {
    const results = DB.getSnapshot()?.results;
    const lastResult = results?.[0];

    const streakOffset = (profile as Snapshot).streakHourOffset;

    const dayInMilis = 1000 * 60 * 60 * 24;

    let target = DateTime.getCurrentDayTimestamp(streakOffset) + dayInMilis;
    if (target < Date.now()) {
      target += dayInMilis;
    }
    const timeDif = formatDistanceToNowStrict(target);

    console.debug("Streak hour offset");
    console.debug("date.now()", Date.now(), new Date(Date.now()));
    console.debug("dayInMilis", dayInMilis);
    console.debug(
      "difTarget",
      new Date(DateTime.getCurrentDayTimestamp(streakOffset) + dayInMilis),
    );
    console.debug("timeDif", timeDif);
    console.debug(
      "DateTime.getCurrentDayTimestamp()",
      DateTime.getCurrentDayTimestamp(),
      new Date(DateTime.getCurrentDayTimestamp()),
    );
    console.debug("profile.streakHourOffset", streakOffset);

    if (lastResult !== undefined) {
      //check if the last result is from today
      const isToday = DateTime.isToday(lastResult.timestamp, streakOffset);
      const isYesterday = DateTime.isYesterday(
        lastResult.timestamp,
        streakOffset,
      );

      console.debug(
        "lastResult.timestamp",
        lastResult.timestamp,
        new Date(lastResult.timestamp),
      );
      console.debug("isToday", isToday);
      console.debug("isYesterday", isYesterday);

      const offsetString = Numbers.isSafeNumber(streakOffset)
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

      console.debug(hoverText);

      if (streakOffset === undefined) {
        hoverText += `\n\nIf the streak reset time doesn't line up with your timezone, you can change it in Account Settings > Account > Set streak hour offset.`;
      }
    }
  }

  details
    ?.qs(".streak")
    ?.setAttribute("aria-label", hoverText)
    ?.setAttribute("data-balloon-break", "");

  const { completedPercentage, restartRatio } = Misc.formatTypingStatsRatio(
    profile.typingStats,
  );

  const typingStatsEl = details?.qs(".typingStats");
  typingStatsEl
    ?.qs(".started .value")
    ?.setText(`${profile.typingStats?.startedTests ?? 0}`);
  typingStatsEl
    ?.qs(".completed .value")
    ?.setText(`${profile.typingStats?.completedTests ?? 0}`)
    .setAttribute("data-balloon-pos", "up")
    .setAttribute(
      "aria-label",
      `${completedPercentage}% (${restartRatio} restarts per completed test)`,
    );
  typingStatsEl
    ?.qs(".timeTyping .value")
    ?.setText(
      secondsToString(
        Math.round(profile.typingStats?.timeTyping ?? 0),
        true,
        true,
      ),
    );

  let bio = false;
  let keyboard = false;
  let socials = false;

  if (!banned) {
    bio = !!(profile.details?.bio ?? "");
    details?.qs(".bio .value")?.setText(profile.details?.bio ?? "");

    keyboard = !!(profile.details?.keyboard ?? "");
    details?.qs(".keyboard .value")?.setText(profile.details?.keyboard ?? "");

    if (
      (profile.details?.socialProfiles?.github !== undefined &&
        profile.details?.socialProfiles?.github !== "") ||
      (profile.details?.socialProfiles?.twitter !== undefined &&
        profile.details?.socialProfiles?.twitter !== "") ||
      (profile.details?.socialProfiles?.website !== undefined &&
        profile.details?.socialProfiles?.website !== "")
    ) {
      socials = true;
      const socialsEl = details?.qs(".socials .value");
      socialsEl?.empty();

      const git = profile.details?.socialProfiles.github ?? "";
      if (git) {
        socialsEl?.appendHtml(
          `<a href='https://github.com/${Misc.escapeHTML(
            git,
          )}/' target="_blank" rel="nofollow me" aria-label="${Misc.escapeHTML(
            git,
          )}" data-balloon-pos="up" class="textButton"><i class="fab fa-fw fa-github"></i></a>`,
        );
      }

      const twitter = profile.details?.socialProfiles.twitter ?? "";
      if (twitter) {
        socialsEl?.appendHtml(
          `<a href='https://x.com/${Misc.escapeHTML(
            twitter,
          )}' target="_blank" rel="nofollow me" aria-label="${Misc.escapeHTML(
            twitter,
          )}" data-balloon-pos="up" class="textButton"><i class="fab fa-fw fa-twitter"></i></a>`,
        );
      }

      const website = profile.details?.socialProfiles.website ?? "";

      //regular expression to get website name from url
      const regex = /^https?:\/\/(?:www\.)?([^/]+)/;
      const websiteName = regex.exec(website)?.[1] ?? website;

      if (website) {
        socialsEl?.appendHtml(
          `<a href='${Misc.escapeHTML(
            website,
          )}' target="_blank" rel="nofollow me" aria-label="${Misc.escapeHTML(
            websiteName ?? "",
          )}" data-balloon-pos="up" class="textButton"><i class="fas fa-fw fa-globe"></i></a>`,
        );
      }
    }
  }

  updateXp(where, profile.xp ?? 0);
  //lbs

  if (banned) {
    profileElement?.qs(".leaderboardsPositions")?.addClass("hidden");
  } else {
    profileElement?.qs(".leaderboardsPositions")?.removeClass("hidden");

    const t15 = profile.allTimeLbs?.time?.["15"]?.["english"] ?? null;
    const t60 = profile.allTimeLbs?.time?.["60"]?.["english"] ?? null;

    if (t15 === null && t60 === null) {
      profileElement?.qs(".leaderboardsPositions")?.addClass("hidden");
    } else {
      if (t15 !== null) {
        profileElement
          ?.qs(".leaderboardsPositions .group.t15 .pos")
          ?.setText(Format.rank(t15?.rank));
        profileElement
          ?.qs(".leaderboardsPositions .group.t15 .topPercentage")
          ?.setText(formatTopPercentage(t15));
      }

      if (t60 !== null) {
        profileElement
          ?.qs(".leaderboardsPositions .group.t60 .pos")
          ?.setText(Format.rank(t60?.rank));

        profileElement
          ?.qs(".leaderboardsPositions .group.t60 .topPercentage")
          ?.setText(formatTopPercentage(t60));
      }
    }
  }

  if (profile.uid === getAuthenticatedUser()?.uid) {
    profileElement?.qs(".userReportButton")?.addClass("hidden");
  } else {
    profileElement?.qs(".userReportButton")?.removeClass("hidden");
  }

  const bioAndKey = bio || keyboard;

  if (!bio) {
    details?.qs(".bio")?.addClass("hidden");
  } else {
    details?.qs(".bio")?.removeClass("hidden");
  }

  if (!keyboard) {
    details?.qs(".keyboard")?.addClass("hidden");
  } else {
    details?.qs(".keyboard")?.removeClass("hidden");
  }

  if (!bioAndKey) {
    details?.qs(".bioAndKeyboard")?.addClass("hidden");
    details?.qs(".sep2")?.addClass("hidden");
  } else {
    details?.qs(".bioAndKeyboard")?.removeClass("hidden");
    details?.qs(".sep2")?.removeClass("hidden");
  }

  if (!socials) {
    details?.qs(".socials")?.addClass("hidden");
    details?.qs(".sep3")?.addClass("hidden");
  } else {
    details?.qs(".socials")?.removeClass("hidden");
    details?.qs(".sep3")?.removeClass("hidden");
  }

  details?.removeClass("none");
  details?.removeClass("bioAndKey");
  details?.removeClass("soc");
  details?.removeClass("both");
  if (!socials && !bioAndKey) {
    details?.addClass("none");
  } else if (socials && !bioAndKey) {
    details?.addClass("soc");
  } else if (!socials && bioAndKey) {
    details?.addClass("bioAndKey");
  } else if (socials && bioAndKey) {
    details?.addClass("both");
  }

  updateFriendRequestButton();
}

export function updateXp(
  where: ProfileViewPaths,
  xp: number,
  sameUserCheck = false,
): void {
  const elementClass = where.charAt(0).toUpperCase() + where.slice(1);
  const profileElement = qs(`.page${elementClass} .profile`);
  const details = qs(`.page${elementClass} .profile .details .levelAndBar`);

  if (details === undefined || details === null) return;

  if (sameUserCheck && where === "profile") {
    const authedUserUid = getAuthenticatedUser()?.uid;
    if (authedUserUid !== profileElement?.getAttribute("uid")) return;
  }

  const xpDetails = Levels.getXpDetails(xp);
  const xpForLevel = xpDetails.levelMaxXp;
  const xpToDisplay = xpDetails.levelCurrentXp;
  details
    ?.qs(".level")
    ?.setText(`${xpDetails.level}`)
    ?.setAttribute("aria-label", `${formatXp(xp)} total xp`);
  details
    ?.qs(".xp")
    ?.setText(`${formatXp(xpToDisplay)}/${formatXp(xpForLevel)}`)
    ?.setAttribute(
      "aria-label",
      `${formatXp(xpForLevel - xpToDisplay)} xp until next level`,
    );
  details
    ?.qs(".xpBar .bar")
    ?.setStyle({ width: `${(xpToDisplay / xpForLevel) * 100}%` });
  details
    ?.qs(".xpBar")
    ?.setAttribute(
      "aria-label",
      `${((xpToDisplay / xpForLevel) * 100).toFixed(2)}%`,
    );
}

export function updateNameFontSize(where: ProfileViewPaths): void {
  //dont run this function in safari because OH MY GOD IT IS SO SLOW
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  if (isSafari) return;

  let details;
  if (where === "account") {
    details = qs(".pageAccount .profile .details");
  } else if (where === "profile") {
    details = qs(".pageProfile .profile .details");
  }
  if (!details) return;
  const nameField = details?.qs(".user");
  const nameFieldParent = nameField?.getParent();
  const upperLimit = convertRemToPixels(2);

  if (!nameField || !nameFieldParent) return;

  nameField.native.style.fontSize = `10px`;
  const parentWidth = nameFieldParent.native.clientWidth;
  const widthAt10 = nameField.native.clientWidth;
  const ratioAt10 = parentWidth / widthAt10;
  const fittedFontSize = ratioAt10 * 10;
  const finalFontSize = Math.min(Math.max(fittedFontSize, 10), upperLimit);
  nameField.native.style.fontSize = `${finalFontSize}px`;
}

export function updateFriendRequestButton(): void {
  const myUid = getAuthenticatedUser()?.uid;
  const profileUid = document
    .querySelector(".profile")
    ?.getAttribute("uid") as string;
  const button = document.querySelector(".profile .addFriendButton");

  const myProfile = myUid === profileUid;
  const hasRequest = DB.getSnapshot()?.connections[profileUid] !== undefined;
  const featureEnabled = getServerConfiguration()?.connections.enabled;

  if (!featureEnabled || myUid === undefined || myProfile) {
    button?.classList.add("hidden");
  } else if (hasRequest) {
    button?.classList.add("disabled");
  } else {
    button?.classList.remove("disabled");
    button?.classList.remove("hidden");
  }
}
const throttledEvent = throttle(1000, () => {
  const activePage = getActivePage();
  if (activePage && ["account", "profile"].includes(activePage)) {
    updateNameFontSize(activePage as ProfileViewPaths);
  }
});

window.addEventListener("resize", () => {
  throttledEvent();
});
