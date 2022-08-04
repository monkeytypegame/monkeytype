import { getSnapshot } from "../db";
import { Auth } from "../firebase";
import * as Misc from "../utils/misc";
import { getAll } from "./theme-colors";

let usingAvatar = false;

export function loading(truefalse: boolean): void {
  if (truefalse) {
    if (usingAvatar) {
      $("#top #menu .account .avatar").addClass("hidden");
      $("#top #menu .account .icon").removeClass("hidden");
    }
    $("#top #menu .account .icon").html(
      '<i class="fas fa-fw fa-spin fa-circle-notch"></i>'
    );
    $("#top #menu .account").css("opacity", 1).css("pointer-events", "none");
  } else {
    if (usingAvatar) {
      $("#top #menu .account .avatar").removeClass("hidden");
      $("#top #menu .account .icon").addClass("hidden");
    }
    $("#top #menu .account .icon").html('<i class="fas fa-fw fa-user"></i>');
    $("#top #menu .account").css("opacity", 1).css("pointer-events", "auto");
  }
}

export async function update(
  xp?: number,
  discordId?: string,
  discordAvatar?: string
): Promise<void> {
  if (Auth.currentUser != null) {
    if (xp !== undefined) {
      $("#top #menu .level").text(Math.floor(Misc.getLevel(xp)));
      $("#top #menu .bar").css({
        width: (Misc.getLevel(xp) % 1) * 100 + "%",
      });
    }
    if (discordAvatar && discordId) {
      const discordAvatarUrl = await Misc.getDiscordAvatarUrl(
        discordId,
        discordAvatar
      );
      if (discordAvatarUrl) {
        $("#top #menu .account .avatar").css(
          "background-image",
          `url(${discordAvatarUrl})`
        );
        usingAvatar = true;

        $("#top #menu .account .icon").addClass("hidden");
        $("#top #menu .account .avatar").removeClass("hidden");
      }
    } else {
      $("#top #menu .account .avatar").addClass("hidden");
    }
    Misc.swapElements(
      $("#menu .textButton.login"),
      $("#menu .textButton.account"),
      250
    );
  } else {
    Misc.swapElements(
      $("#menu .textButton.account"),
      $("#menu .textButton.login"),
      250
    );
  }
}

export async function updateXpBar(
  currentXp: number,
  addedXp: number,
  _withDailyBonus: boolean
): Promise<void> {
  const startingLevel = Misc.getLevel(currentXp);
  const endingLevel = Misc.getLevel(currentXp + addedXp);
  const difference = endingLevel - startingLevel;

  $("#menu .xpBar").stop(true, true).css("opacity", 0);

  $("#menu .xpBar .xpGain").text(`+${addedXp}`);

  await Misc.promiseAnimation(
    $("#menu .xpBar"),
    {
      opacity: "1",
    },
    250,
    "linear"
  );

  const barEl = $("#menu .xpBar .bar");

  barEl.css("width", `${(startingLevel % 1) * 100}%`);

  if (endingLevel % 1 == 0) {
    await Misc.promiseAnimation(
      barEl,
      {
        width: "100%",
      },
      1000,
      "easeOutExpo"
    );
    flashLevel();
    barEl.css("width", `0%`);
  } else if (Math.floor(startingLevel) === Math.floor(endingLevel)) {
    await Misc.promiseAnimation(
      barEl,
      { width: `${(endingLevel % 1) * 100}%` },
      1000,
      "easeOutExpo"
    );
  } else {
    // const quickSpeed = Misc.mapRange(difference, 10, 2000, 200, 1);
    const quickSpeed = Math.min(1000 / difference, 200);
    let toAnimate = difference;

    let firstOneDone = false;

    while (toAnimate > 1) {
      if (toAnimate - 1 < 1) {
        if (firstOneDone) {
          flashLevel();
          barEl.css("width", "0%");
        }
        await Misc.promiseAnimation(
          barEl,
          {
            width: "100%",
          },
          Misc.mapRange(toAnimate - 1, 0, 0.5, 1000, 200),
          "easeOutQuad"
        );
        toAnimate--;
      } else {
        if (firstOneDone) {
          flashLevel();
          barEl.css("width", "0%");
        }
        await Misc.promiseAnimation(
          barEl,
          {
            width: "100%",
          },
          quickSpeed,
          "linear"
        );
        toAnimate--;
      }
      firstOneDone = true;
    }

    flashLevel();
    barEl.css("width", "0%");
    await Misc.promiseAnimation(
      barEl,
      {
        width: `${(toAnimate % 1) * 100}%`,
      },
      1000,
      "easeOutExpo"
    );
  }
  setTimeout(() => {
    $("#menu .level").text(Math.floor(Misc.getLevel(getSnapshot().xp)));
    $("#menu .xpBar")
      .stop(true, true)
      .css("opacity", 1)
      .animate({ opacity: 0 }, 250, () => {
        $("#menu .xpBar .xpGain").text(``);
      });
  }, 3000);
}

async function flashLevel(): Promise<void> {
  const themecolors = await getAll();
  const barEl = $("#menu .level");

  barEl.text(parseInt(barEl.text()) + 1);

  const rand = Math.random() * 2 - 1;
  const rand2 = Math.random() + 1;

  barEl
    .stop(true, true)
    .css({
      backgroundColor: themecolors.main,
      // transform: "scale(1.5) rotate(10deg)",
      borderSpacing: 100,
    })
    .animate(
      {
        backgroundColor: themecolors.sub,
        borderSpacing: 0,
      },
      {
        step(step) {
          barEl.css(
            "transform",
            `scale(${1 + (step / 200) * rand2}) rotate(${
              (step / 10) * rand
            }deg)`
          );
        },
        duration: 2000,
        easing: "easeOutCubic",
      }
    );
}
