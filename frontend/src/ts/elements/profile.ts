import * as DB from "../db";
import { format } from "date-fns/format";
import { differenceInDays } from "date-fns/differenceInDays";
import * as Misc from "../utils/misc";
import * as Numbers from "../utils/numbers";
import * as Levels from "../utils/levels";
import * as DateTime from "../utils/date-and-time";
import { getHTMLById } from "../controllers/badge-controller";
import { throttle } from "throttle-debounce";
import * as ActivePage from "../states/active-page";
import { formatDistanceToNowStrict } from "date-fns/formatDistanceToNowStrict";
import { getHtmlByUserFlags } from "../controllers/user-flag-controller";
import Format from "../utils/format";
import { UserProfile, RankAndCount } from "@monkeytype/contracts/schemas/users";

type ProfileViewPaths = "profile" | "account";
type UserProfileOrSnapshot = UserProfile | MonkeyTypes.Snapshot;

//this is probably the dirtiest code ive ever written

export async function update(
  where: ProfileViewPaths,
  profile: UserProfileOrSnapshot
): Promise<void> {
  const elementClass = where.charAt(0).toUpperCase() + where.slice(1);
  const profileElement = $(`.page${elementClass} .profile`);
  const details = $(`.page${elementClass} .profile .details`);

  profileElement.attr("uid", profile.uid ?? "");
  profileElement.attr("name", profile.name ?? "");

  // ============================================================================
  // DO FREAKING NOT USE .HTML OR .APPEND HERE - USER INPUT!!!!!!
  // ============================================================================

  const banned = profile.banned === true;

  if (
    details === undefined ||
    profile === undefined ||
    profile.name === undefined ||
    profile.addedAt === undefined
  )
    return;

  details.find(".placeholderAvatar").removeClass("hidden");
  if (
    profile.discordAvatar !== undefined &&
    profile.discordId !== undefined &&
    !banned
  ) {
    void Misc.getDiscordAvatarUrl(
      profile.discordId,
      profile.discordAvatar,
      256
    ).then((avatarUrl) => {
      if (avatarUrl !== null) {
        details.find(".placeholderAvatar").addClass("hidden");
        details.find(".avatar").css("background-image", `url(${avatarUrl})`);
      }
    });
  } else {
    details.find(".avatar").removeAttr("style");
  }

  if (profile.inventory?.badges && !banned) {
    let mainHtml = "";
    let restHtml = "";

    for (const badge of profile.inventory.badges) {
      if (badge.selected === true) {
        mainHtml = getHTMLById(badge.id);
      } else {
        restHtml += getHTMLById(badge.id, true);
      }
    }

    details.find(".badges").empty().append(mainHtml);
    details.find(".allBadges").empty().append(restHtml);
  }

  details.find(".name").text(profile.name);
  details.find(".userFlags").html(getHtmlByUserFlags(profile));

  if (profile.lbOptOut === true) {
    if (where === "profile") {
      profileElement
        .find(".lbOptOutReminder")
        .removeClass("hidden")
        .text(
          "Note: This account has opted out of the leaderboards, meaning their results aren't verified by the anticheat system and may not be legitimate."
        );
    } else {
      profileElement.find(".lbOptOutReminder").addClass("hidden");
    }
  }

  setTimeout(() => {
    updateNameFontSize(where);
  }, 10);

  const joinedText = "Joined " + format(profile.addedAt ?? 0, "dd MMM yyyy");
  const creationDate = new Date(profile.addedAt);
  const diffDays = differenceInDays(new Date(), creationDate);
  const balloonText = `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  details.find(".joined").text(joinedText).attr("aria-label", balloonText);

  let hoverText = "";

  if (profile.streak && profile?.streak > 1) {
    details
      .find(".streak")
      .text(
        `Current streak: ${profile.streak} ${
          profile.streak === 1 ? "day" : "days"
        }`
      );
    hoverText = `Longest streak: ${profile.maxStreak} ${
      profile.maxStreak === 1 ? "day" : "days"
    }`;
  } else {
    details.find(".streak").text("");
    hoverText = "";
  }

  if (where === "account") {
    const results = DB.getSnapshot()?.results;
    const lastResult = results?.[0];

    const streakOffset = (profile as MonkeyTypes.Snapshot).streakHourOffset;

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
      new Date(DateTime.getCurrentDayTimestamp(streakOffset) + dayInMilis)
    );
    console.debug("timeDif", timeDif);
    console.debug(
      "DateTime.getCurrentDayTimestamp()",
      DateTime.getCurrentDayTimestamp(),
      new Date(DateTime.getCurrentDayTimestamp())
    );
    console.debug("profile.streakHourOffset", streakOffset);

    if (lastResult !== undefined) {
      //check if the last result is from today
      const isToday = DateTime.isToday(lastResult.timestamp, streakOffset);
      const isYesterday = DateTime.isYesterday(
        lastResult.timestamp,
        streakOffset
      );

      console.debug(
        "lastResult.timestamp",
        lastResult.timestamp,
        new Date(lastResult.timestamp)
      );
      console.debug("isToday", isToday);
      console.debug("isYesterday", isYesterday);

      const offsetString = streakOffset
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
        hoverText += `\n\nIf the streak reset time doesn't line up with your timezone, you can change it in Settings > Danger zone > Update streak hour offset.`;
      }
    }
  }

  details
    .find(".streak")
    .attr("aria-label", hoverText)
    .attr("data-balloon-break", "");

  let completedPercentage = "";
  let restartRatio = "";
  if (
    profile.typingStats.completedTests !== undefined &&
    profile.typingStats.startedTests !== undefined
  ) {
    completedPercentage = Math.floor(
      (profile.typingStats.completedTests / profile.typingStats.startedTests) *
        100
    ).toString();
    restartRatio = (
      (profile.typingStats.startedTests - profile.typingStats.completedTests) /
      profile.typingStats.completedTests
    ).toFixed(1);
  }

  const typingStatsEl = details.find(".typingStats");
  typingStatsEl
    .find(".started .value")
    .text(profile.typingStats?.startedTests ?? 0);
  typingStatsEl
    .find(".completed .value")
    .text(profile.typingStats?.completedTests ?? 0)
    .attr("data-balloon-pos", "up")
    .attr(
      "aria-label",
      `${completedPercentage}% (${restartRatio} restarts per completed test)`
    );
  typingStatsEl
    .find(".timeTyping .value")
    .text(
      DateTime.secondsToString(
        Math.round(profile.typingStats?.timeTyping ?? 0),
        true,
        true
      )
    );

  let bio = false;
  let keyboard = false;
  let socials = false;

  if (!banned) {
    bio = profile.details?.bio ?? "" ? true : false;
    details.find(".bio .value").text(profile.details?.bio ?? "");

    keyboard = profile.details?.keyboard ?? "" ? true : false;
    details.find(".keyboard .value").text(profile.details?.keyboard ?? "");

    if (
      profile.details?.socialProfiles?.github !== undefined ||
      profile.details?.socialProfiles?.twitter !== undefined ||
      profile.details?.socialProfiles?.website !== undefined
    ) {
      socials = true;
      const socialsEl = details.find(".socials .value");
      socialsEl.empty();

      const git = profile.details?.socialProfiles.github ?? "";
      if (git) {
        socialsEl.append(
          `<a href='https://github.com/${Misc.escapeHTML(
            git
          )}/' target="_blank" rel="nofollow me" aria-label="${Misc.escapeHTML(
            git
          )}" data-balloon-pos="up" class="textButton"><i class="fab fa-fw fa-github"></i></a>`
        );
      }

      const twitter = profile.details?.socialProfiles.twitter ?? "";
      if (twitter) {
        socialsEl.append(
          `<a href='https://x.com/${Misc.escapeHTML(
            twitter
          )}' target="_blank" rel="nofollow me" aria-label="${Misc.escapeHTML(
            twitter
          )}" data-balloon-pos="up" class="textButton"><i class="fab fa-fw fa-twitter"></i></a>`
        );
      }

      const website = profile.details?.socialProfiles.website ?? "";

      //regular expression to get website name from url
      const regex = /^https?:\/\/(?:www\.)?([^/]+)/;
      const websiteName = website?.match(regex)?.[1] ?? website;

      if (website) {
        socialsEl.append(
          `<a href='${Misc.escapeHTML(
            website
          )}' target="_blank" rel="nofollow me" aria-label="${Misc.escapeHTML(
            websiteName ?? ""
          )}" data-balloon-pos="up" class="textButton"><i class="fas fa-fw fa-globe"></i></a>`
        );
      }
    }
  }

  updateXp(profile.xp ?? 0);
  //lbs

  if (banned) {
    profileElement.find(".leaderboardsPositions").addClass("hidden");
  } else {
    profileElement.find(".leaderboardsPositions").removeClass("hidden");

    const t15 = profile.allTimeLbs?.time?.["15"]?.["english"] ?? null;
    const t60 = profile.allTimeLbs?.time?.["60"]?.["english"] ?? null;

    if (t15 === null && t60 === null) {
      profileElement.find(".leaderboardsPositions").addClass("hidden");
    } else {
      if (t15 !== null) {
        profileElement
          .find(".leaderboardsPositions .group.t15 .pos")
          .text(Format.rank(t15?.rank));
        profileElement
          .find(".leaderboardsPositions .group.t15 .topPercentage")
          .text(formatTopPercentage(t15));
      }

      if (t60 !== null) {
        profileElement
          .find(".leaderboardsPositions .group.t60 .pos")
          .text(Format.rank(t60?.rank));

        profileElement
          .find(".leaderboardsPositions .group.t60 .topPercentage")
          .text(formatTopPercentage(t60));
      }
    }
  }

  //structure

  const bioAndKey = bio || keyboard;

  if (!bio) {
    details.find(".bio").addClass("hidden");
  } else {
    details.find(".bio").removeClass("hidden");
  }

  if (!keyboard) {
    details.find(".keyboard").addClass("hidden");
  } else {
    details.find(".keyboard").removeClass("hidden");
  }

  if (!bioAndKey) {
    details.find(".bioAndKeyboard").addClass("hidden");
    details.find(".sep2").addClass("hidden");
  } else {
    details.find(".bioAndKeyboard").removeClass("hidden");
    details.find(".sep2").removeClass("hidden");
  }

  if (!socials) {
    details.find(".socials").addClass("hidden");
    details.find(".sep3").addClass("hidden");
  } else {
    details.find(".socials").removeClass("hidden");
    details.find(".sep3").removeClass("hidden");
  }

  details.removeClass("none");
  details.removeClass("bioAndKey");
  details.removeClass("soc");
  details.removeClass("both");
  if (!socials && !bioAndKey) {
    details.addClass("none");
  } else if (socials && !bioAndKey) {
    details.addClass("soc");
  } else if (!socials && bioAndKey) {
    details.addClass("bioAndKey");
  } else if (socials && bioAndKey) {
    details.addClass("both");
  }
}

export function updateXp(xp: number): void {
  const details = $(" .profile .details .levelAndBar");
  if (details === undefined || details === null) return;
  const xpDetails = Levels.getXpDetails(xp);
  const xpForLevel = xpDetails.levelMaxXp;
  const xpToDisplay = xpDetails.levelCurrentXp;
  details
    .find(".level")
    .text(xpDetails.level)
    .attr("aria-label", `${formatXp(xp)} total xp`);
  details
    .find(".xp")
    .text(`${formatXp(xpToDisplay)}/${formatXp(xpForLevel)}`)
    .attr(
      "aria-label",
      `${formatXp(xpForLevel - xpToDisplay)} xp until next level`
    );
  details
    .find(".xpBar .bar")
    .css("width", `${(xpToDisplay / xpForLevel) * 100}%`);
  details
    .find(".xpBar")
    .attr("aria-label", `${((xpToDisplay / xpForLevel) * 100).toFixed(2)}%`);
}

export function updateNameFontSize(where: ProfileViewPaths): void {
  //dont run this function in safari because OH MY GOD IT IS SO SLOW
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  if (isSafari) return;

  let details;
  if (where === "account") {
    details = $(".pageAccount .profile .details");
  } else if (where === "profile") {
    details = $(".pageProfile .profile .details");
  }
  if (!details) return;
  const nameFieldjQ = details.find(".user");
  const nameFieldParent = nameFieldjQ.parent()[0];
  const nameField = nameFieldjQ[0];
  const upperLimit = Numbers.convertRemToPixels(2);

  if (!nameField || !nameFieldParent) return;

  nameField.style.fontSize = `10px`;
  const parentWidth = nameFieldParent.clientWidth;
  const widthAt10 = nameField.clientWidth;
  const ratioAt10 = parentWidth / widthAt10;
  const fittedFontSize = ratioAt10 * 10;
  const finalFontSize = Math.min(Math.max(fittedFontSize, 10), upperLimit);
  nameField.style.fontSize = `${finalFontSize}px`;
}

const throttledEvent = throttle(1000, () => {
  const activePage = ActivePage.get();
  if (activePage && ["account", "profile"].includes(activePage)) {
    updateNameFontSize(activePage as ProfileViewPaths);
  }
});

$(window).on("resize", () => {
  throttledEvent();
});

function formatTopPercentage(lbRank: RankAndCount): string {
  if (lbRank.rank === undefined) return "-";
  if (lbRank.rank === 1) return "GOAT";
  return "Top " + Numbers.roundTo2((lbRank.rank / lbRank.count) * 100) + "%";
}

function formatXp(xp: number): string {
  if (xp < 1000) {
    return Math.round(xp).toString();
  } else {
    return Numbers.abbreviateNumber(xp);
  }
}
