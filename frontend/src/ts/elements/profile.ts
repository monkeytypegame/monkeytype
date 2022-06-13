import format from "date-fns/format";
import differenceInDays from "date-fns/differenceInDays";
import * as Misc from "../utils/misc";
import { getHTMLById } from "../controllers/badge-controller";
import { throttle } from "throttle-debounce";

export function update(
  where: "account",
  profile: Partial<MonkeyTypes.Snapshot>
): void {
  let details;
  if (where === "account") {
    details = $(".pageAccount .profile .details");
  }

  if (!details || !profile || !profile.name || !profile.addedAt) return;

  if (profile.discordAvatar && profile.discordId) {
    details
      .find(".avatar")
      .css(
        "background-image",
        `url(https://cdn.discordapp.com/avatars/${profile.discordId}/${profile.discordAvatar}.png)`
      );
  }

  if (profile.badgeIds) {
    details.find(".badges").append(getHTMLById(profile.badgeIds[0]));
  }

  details.find(".name").text(profile.name);
  updateNameFontSize(where);

  const joinedText = "Joined " + format(profile.addedAt ?? 0, "dd MMM yyyy");

  const creationDate = new Date(profile.addedAt);
  const diffDays = differenceInDays(new Date(), creationDate);

  const balloonText = `${diffDays} day${diffDays != 1 ? "s" : ""} ago`;

  details.find(".joined").text(joinedText).attr("aria-label", balloonText);

  const bio = profile.details?.bio ?? null;
  details.find(".bio .value").text(bio ?? "");

  const keyboard = profile.details?.keyboard ?? null;
  details.find(".keyboard .value").text(keyboard ?? "");

  details
    .find(".typingStats .started .value")
    .text(profile.globalStats?.started ?? 0);
  details
    .find(".typingStats .completed .value")
    .text(profile.globalStats?.completed ?? 0);
  details
    .find(".typingStats .timeTyping .value")
    .text(
      Misc.secondsToString(
        Math.round(profile.globalStats?.time ?? 0),
        true,
        true
      )
    );

  let socials = null;
  if (
    profile.details?.socialLinks.github ||
    profile.details?.socialLinks.twitter ||
    profile.details?.socialLinks.website
  ) {
    socials = true;
    const socialsEl = details.find(".socials .value");
    socialsEl.empty();

    const git = profile.details?.socialLinks.github;
    if (git) {
      socialsEl.append(
        `<a href='github.com/${git}' aria-label="${git}" data-balloon-pos="up"><i class="fab fa-fw fa-github"></i></a>`
      );
    }

    const twitter = profile.details?.socialLinks.twitter;
    if (twitter) {
      socialsEl.append(
        `<a href='twitter.com/${twitter}' aria-label="${twitter}" data-balloon-pos="up"><i class="fab fa-fw fa-twitter"></i></a>`
      );
    }

    const website = profile.details?.socialLinks.website;
    if (website) {
      socialsEl.append(
        `<a href='${website}' aria-label="${website}" data-balloon-pos="up"><i class="fas fa-fw fa-globe"></i></a>`
      );
    }
  }

  //structure
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

  if (!socials) {
    details.find(".socials").addClass("hidden");
  } else {
    details.find(".socials").removeClass("hidden");
  }

  if (!keyboard && !socials) {
    details.find(".typingStats").addClass("wide");
  } else {
    details.find(".typingStats").removeClass("wide");
  }
}

export function updateNameFontSize(where: "account"): void {
  let details;
  if (where === "account") {
    details = $(".pageAccount .profile .details");
  }
  if (!details) return;
  const nameField = details.find(".name");
  const nameFieldParent = nameField.parent();
  const upperLimit = Misc.convertRemToPixels(3);
  // const nameFieldParentWidth = nameField.parent().width() ?? 0;
  let fontSize = Misc.convertRemToPixels(1);
  let nameWidth;
  let parentWidth;
  do {
    fontSize = fontSize + 1;
    nameField.css("font-size", fontSize);
    nameWidth = nameField.width() ?? 0;
    parentWidth = nameFieldParent.width() ?? 0;
  } while (nameWidth < parentWidth - 10 && fontSize < upperLimit);
}

const throttledEvent = throttle(250, () => {
  updateNameFontSize("account");
});

$(window).on("resize", () => {
  throttledEvent();
});
