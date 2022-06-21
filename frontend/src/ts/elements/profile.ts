import * as DB from "../db";
import format from "date-fns/format";
import differenceInDays from "date-fns/differenceInDays";
import * as Misc from "../utils/misc";
import { getHTMLById } from "../controllers/badge-controller";
import { throttle } from "throttle-debounce";
import * as EditProfilePopup from "../popups/edit-profile-popup";

type ProfileViewPaths = "profile" | "account";

export async function update(
  where: ProfileViewPaths,
  profile: Partial<MonkeyTypes.Snapshot>
): Promise<void> {
  const elementClass = where.charAt(0).toUpperCase() + where.slice(1);
  const details = $(`.page${elementClass} .profile .details`);

  // ============================================================================
  // DO FREAKING NOT USE .HTML HERE - USER INPUT!!!!!!
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
  }

  if (profile.badgeIds && !banned) {
    details.find(".badges").empty().append(getHTMLById(profile.badgeIds[0]));
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
          `<a href='https://github.com/${git}/' aria-label="${git}" data-balloon-pos="up"><i class="fab fa-fw fa-github"></i></a>`
        );
      }

      const twitter = profile.details?.socialProfiles.twitter;
      if (twitter) {
        socialsEl.append(
          `<a href='https://twitter.com/${twitter}' aria-label="${twitter}" data-balloon-pos="up"><i class="fab fa-fw fa-twitter"></i></a>`
        );
      }

      const website = profile.details?.socialProfiles.website;
      if (website) {
        socialsEl.append(
          `<a href='${website}' aria-label="${website}" data-balloon-pos="up"><i class="fas fa-fw fa-globe"></i></a>`
        );
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

export function updateNameFontSize(where: ProfileViewPaths): void {
  let details;
  if (where === "account") {
    details = $(".pageAccount .profile .details");
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
  EditProfilePopup.show(() => {
    update("account", DB.getSnapshot());
  });
});

const throttledEvent = throttle(250, () => {
  updateNameFontSize("account");
});

$(window).on("resize", () => {
  throttledEvent();
});
