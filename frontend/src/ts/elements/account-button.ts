import { getSnapshot } from "../db";
import { Auth } from "../firebase";
import * as Misc from "../utils/misc";
import { getAll } from "./theme-colors";
import * as SlowTimer from "../states/slow-timer";

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
  withDailyBonus: boolean,
  breakdown: Record<string, number>
): Promise<void> {
  const startingLevel = Misc.getLevel(currentXp);
  const endingLevel = Misc.getLevel(currentXp + addedXp);
  const xpBarPromise = animateXpBar(startingLevel, endingLevel);
  const xpBreakdownPromise = animateXpBreakdown(
    addedXp,
    withDailyBonus,
    breakdown
  );

  await Promise.all([xpBarPromise, xpBreakdownPromise]);
  await Misc.sleep(2000);
  $("#menu .level").text(Math.floor(Misc.getLevel(getSnapshot().xp)));
  $("#menu .xpBar")
    .stop(true, true)
    .css("opacity", 1)
    .animate({ opacity: 0 }, SlowTimer.get() ? 0 : 250, () => {
      $("#menu .xpBar .xpGain").text(``);
    });
}

async function animateXpBreakdown(
  addedXp: number,
  withDailyBonus: boolean,
  breakdown: Record<string, number>
): Promise<void> {
  //

  console.log("animateXpBreakdown", addedXp, withDailyBonus, breakdown);
  const delay = 1000;
  let total = 0;
  const xpGain = $("#menu .xpBar .xpGain");
  const xpBreakdown = $("#menu .xpBar .xpBreakdown");
  xpBreakdown.empty();

  async function append(string: string): Promise<void> {
    xpBreakdown.find(".next").removeClass("next").addClass("previous");
    xpBreakdown.append(
      `<div class='text next' style="opacity: 0; margin-top: 1rem;">${string}</div>`
    );
    const previous = xpBreakdown.find(".previous");
    previous.animate(
      {
        marginTop: "-1rem",
        opacity: 0,
      },
      SlowTimer.get() ? 0 : 250,
      () => {
        previous.remove();
      }
    );
    setTimeout(() => {
      xpGain
        .stop(true, true)
        .text(`+${total}`)
        .css({
          borderSpacing: 100,
        })
        .animate(
          {
            borderSpacing: 0,
          },
          {
            step(step) {
              xpGain.css(
                "transform",
                `scale(${1 + step / 200}) translateY(-50%)`
              );
            },
            duration: SlowTimer.get() ? 0 : 250,
            easing: "swing",
          }
        );
    }, 125);

    await Misc.promiseAnimation(
      xpBreakdown.find(".next"),
      {
        opacity: "1",
        marginTop: "0",
      },
      SlowTimer.get() ? 0 : 250,
      "swing"
    );
  }

  // $("#menu .xpBar .xpGain").text(
  //   `+${addedXp} ${withDailyBonus === true ? "daily bonus" : ""}`
  // );

  xpGain.text(`+0`);
  xpBreakdown.append(
    `<div class='text next'>time typing +${breakdown["base"]}</div>`
  );
  total += breakdown["base"];
  if (breakdown["100%"]) {
    await Misc.sleep(delay);
    await append(`perfect +${breakdown["100%"]}`);
    total += breakdown["100%"];
  } else if (breakdown["corrected"]) {
    await Misc.sleep(delay);
    await append(`clean +${breakdown["corrected"]}`);
    total += breakdown["corrected"];
  }
  if (breakdown["quote"]) {
    await Misc.sleep(delay);
    await append(`quote +${breakdown["quote"]}`);
    total += breakdown["quote"];
  } else if (breakdown["punctuation"]) {
    await Misc.sleep(delay);
    await append(`punctuation +${breakdown["punctuation"]}`);
    total += breakdown["punctuation"];
  } else if (breakdown["numbers"]) {
    await Misc.sleep(delay);
    await append(`numbers +${breakdown["numbers"]}`);
    total += breakdown["numbers"];
  }
  if (breakdown["accPenalty"]) {
    await Misc.sleep(delay);
    await append(`accuracy penalty -${breakdown["accPenalty"]}`);
    total -= breakdown["accPenalty"];
  }
  if (breakdown["incomplete"]) {
    await Misc.sleep(delay);
    await append(`incomplete tests +${breakdown["incomplete"]}`);
    total += breakdown["incomplete"];
  }
  if (breakdown["configMultiplier"]) {
    await Misc.sleep(delay);
    await append(`global multiplier x${breakdown["configMultiplier"]}`);
    total += breakdown["configMultiplier"];
  }
  if (breakdown["daily"]) {
    await Misc.sleep(delay);
    await append(`daily bonus +${breakdown["daily"]}`);
    total += breakdown["daily"];
  }
  await Misc.sleep(delay);
  await append("");
  return;
  //base (100% corrected) (quote punctuation numbers) accPenalty incomplete configMultiplier daily
}

async function animateXpBar(
  startingLevel: number,
  endingLevel: number
): Promise<void> {
  const difference = endingLevel - startingLevel;

  $("#menu .xpBar").stop(true, true).css("opacity", 0);

  await Misc.promiseAnimation(
    $("#menu .xpBar"),
    {
      opacity: "1",
    },
    SlowTimer.get() ? 0 : 250,
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
      SlowTimer.get() ? 0 : 1000,
      "easeOutExpo"
    );
    flashLevel();
    barEl.css("width", `0%`);
  } else if (Math.floor(startingLevel) === Math.floor(endingLevel)) {
    await Misc.promiseAnimation(
      barEl,
      { width: `${(endingLevel % 1) * 100}%` },
      SlowTimer.get() ? 0 : 1000,
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
          SlowTimer.get() ? 0 : Misc.mapRange(toAnimate - 1, 0, 0.5, 1000, 200),
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
          SlowTimer.get() ? 0 : quickSpeed,
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
      SlowTimer.get() ? 0 : 1000,
      "easeOutExpo"
    );
  }
  return;
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
