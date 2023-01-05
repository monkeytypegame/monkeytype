import * as DB from "../db";
import format from "date-fns/format";
import differenceInDays from "date-fns/differenceInDays";
import * as Misc from "../utils/misc";
import { getHTMLById } from "../controllers/badge-controller";
import { throttle } from "throttle-debounce";
import * as EditProfilePopup from "../popups/edit-profile-popup";
import * as ActivePage from "../states/active-page";

type ProfileViewPaths = "profile" | "account";

interface ProfileData extends MonkeyTypes.Snapshot {
  allTimeLbs: MonkeyTypes.LeaderboardMemory;
}

export async function update(
  where: ProfileViewPaths,
  profile: Partial<ProfileData>
): Promise<void> {
  const elementClass = where.charAt(0).toUpperCase() + where.slice(1);
  const profileElement = $(`.page${elementClass} .profile`);
  const details = $(`.page${elementClass} .profile .details`);

  // ============================================================================
  // DO FREAKING NOT USE .HTML OR .APPEND HERE - USER INPUT!!!!!!
  // ============================================================================

  const banned = profile.banned === true;

  if (!details || !profile || !profile.name || !profile.addedAt) return;

  details.find(".placeholderAvatar").removeClass("hidden");
  if (profile.discordAvatar && profile.discordId && !banned) {
    const avatarUrl = await Misc.getDiscordAvatarUrl(
      profile.discordId,
      profile.discordAvatar,
      256
    );

    if (avatarUrl) {
      details.find(".placeholderAvatar").addClass("hidden");
      details.find(".avatar").css("background-image", `url(${avatarUrl})`);
    }
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

  if (banned) {
    details
      .find(".name")
      .append(
        `<div class="bannedIcon" aria-label="This account is banned" data-balloon-pos="up"><i class="fas fa-gavel"></i></div>`
      );
  }

  updateNameFontSize(where);

  const joinedText = "Joined " + format(profile.addedAt ?? 0, "dd MMM yyyy");
  const creationDate = new Date(profile.addedAt);
  const diffDays = differenceInDays(new Date(), creationDate);
  const balloonText = `${diffDays} day${diffDays != 1 ? "s" : ""} ago`;
  details.find(".joined").text(joinedText).attr("aria-label", balloonText);

  if (profile.streak && profile?.streak > 1) {
    details
      .find(".streak")
      .text(
        `Current streak: ${profile.streak} ${
          profile.streak === 1 ? "day" : "days"
        }`
      )
      .attr(
        "aria-label",
        `Longest streak: ${profile.maxStreak} ${
          profile.maxStreak === 1 ? "day" : "days"
        }`
      );
  } else {
    details.find(".streak").text("").attr("aria-label", "");
  }

  const typingStatsEl = details.find(".typingStats");
  typingStatsEl
    .find(".started .value")
    .text(profile.typingStats?.startedTests ?? 0);
  typingStatsEl
    .find(".completed .value")
    .text(profile.typingStats?.completedTests ?? 0);
  typingStatsEl
    .find(".timeTyping .value")
    .text(
      Misc.secondsToString(
        Math.round(profile.typingStats?.timeTyping ?? 0),
        true,
        true
      )
    );

  let bio = false;
  let keyboard = false;
  let socials = false;

  if (!banned) {
    bio = profile.details?.bio ? true : false;
    details.find(".bio .value").text(profile.details?.bio ?? "");

    keyboard = profile.details?.keyboard ? true : false;
    details.find(".keyboard .value").text(profile.details?.keyboard ?? "");

    if (
      profile.details?.socialProfiles.github ||
      profile.details?.socialProfiles.twitter ||
      profile.details?.socialProfiles.website
    ) {
      socials = true;
      const socialsEl = details.find(".socials .value");
      socialsEl.empty();

      const git = profile.details?.socialProfiles.github;
      if (git) {
        socialsEl.append(
          `<a href='https://github.com/${Misc.escapeHTML(
            git
          )}/' target="_blank" aria-label="${Misc.escapeHTML(
            git
          )}" data-balloon-pos="up"><i class="fab fa-fw fa-github"></i></a>`
        );
      }

      const twitter = profile.details?.socialProfiles.twitter;
      if (twitter) {
        socialsEl.append(
          `<a href='https://twitter.com/${Misc.escapeHTML(
            twitter
          )}' target="_blank" aria-label="${Misc.escapeHTML(
            twitter
          )}" data-balloon-pos="up"><i class="fab fa-fw fa-twitter"></i></a>`
        );
      }

      const website = profile.details?.socialProfiles.website;

      //regular expression to get website name from url
      const regex = /^https?:\/\/(?:www\.)?([^/]+)/;
      const websiteName = website?.match(regex)?.[1] ?? website;

      if (website) {
        socialsEl.append(
          `<a href='${Misc.escapeHTML(
            website
          )}' target="_blank" aria-label="${Misc.escapeHTML(
            websiteName ?? ""
          )}" data-balloon-pos="up"><i class="fas fa-fw fa-globe"></i></a>`
        );
      }
    }
  }

  const xp = profile.xp ?? 0;
  const levelFraction = Misc.getLevel(xp);
  const level = Math.floor(levelFraction);
  const xpForLevel = Misc.getXpForLevel(level);
  const xpToDisplay = Math.round(xpForLevel * (levelFraction % 1));
  details
    .find(".level")
    .text(level)
    .attr("aria-label", `${Misc.abbreviateNumber(xp)} total xp`);
  details
    .find(".xp")
    .text(
      `${Misc.abbreviateNumber(xpToDisplay)}/${Misc.abbreviateNumber(
        xpForLevel
      )}`
    );
  details
    .find(".xpBar .bar")
    .css("width", `${(xpToDisplay / xpForLevel) * 100}%`);
  details
    .find(".xp")
    .attr(
      "aria-label",
      `${Misc.abbreviateNumber(xpForLevel - xpToDisplay)} xp until next level`
    );

  //lbs

  if (banned) {
    profileElement.find(".leaderboardsPositions").addClass("hidden");
  } else {
    profileElement.find(".leaderboardsPositions").removeClass("hidden");

    const lbPos = where === "profile" ? profile.allTimeLbs : profile.lbMemory;

    const t15 = lbPos?.time?.[15]?.["english"];
    const t60 = lbPos?.time?.[60]?.["english"];

    if (!t15 && !t60) {
      profileElement.find(".leaderboardsPositions").addClass("hidden");
    } else {
      const t15string = t15 ? Misc.getPositionString(t15) : "-";
      profileElement
        .find(".leaderboardsPositions .group.t15 .pos")
        .text(t15string);
      const t60string = t60 ? Misc.getPositionString(t60) : "-";
      profileElement
        .find(".leaderboardsPositions .group.t60 .pos")
        .text(t60string);
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

export function updateNameFontSize(where: ProfileViewPaths): void {
  let details;
  if (where === "account") {
    details = $(".pageAccount .profile .details");
  } else if (where === "profile") {
    details = $(".pageProfile .profile .details");
  }
  if (!details) return;
  const nameField = details.find(".name");
  const nameFieldParent = nameField.parent();
  const upperLimit = Misc.convertRemToPixels(2);
  // const nameFieldParentWidth = nameField.parent().width() ?? 0;
  let fontSize = 15;
  let nameWidth;
  let parentWidth;
  do {
    fontSize = fontSize + 1;
    nameField.css("font-size", fontSize);
    nameWidth = nameField.width() ?? 0;
    parentWidth = nameFieldParent.width() ?? 0;
  } while (nameWidth < parentWidth - 10 && fontSize < upperLimit);
}

$(".details .editProfileButton").on("click", () => {
  const snapshot = DB.getSnapshot();
  if (!snapshot) return;
  EditProfilePopup.show(() => {
    update("account", snapshot);
  });
});

const throttledEvent = throttle(250, () => {
  const activePage = ActivePage.get();
  if (activePage && ["account", "profile"].includes(activePage)) {
    updateNameFontSize(activePage as ProfileViewPaths);
  }
});

$(window).on("resize", () => {
  throttledEvent();
});
