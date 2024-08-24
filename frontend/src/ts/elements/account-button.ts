import * as Misc from "../utils/misc";
import * as Levels from "../utils/levels";
import { getAll } from "./theme-colors";
import * as SlowTimer from "../states/slow-timer";
import { XpBreakdown } from "@monkeytype/contracts/schemas/results";
import {
  getHtmlByUserFlags,
  SupportsFlags,
} from "../controllers/user-flag-controller";
import { isAuthenticated } from "../firebase";

let usingAvatar = false;

let skipBreakdown = false;
export function skipXpBreakdown(): void {
  skipBreakdown = true;
}

export function hide(): void {
  $("nav .accountButtonAndMenu").addClass("hidden");
  $("nav .textButton.view-login").addClass("hidden");
}

export function loading(state: boolean): void {
  if (state) {
    $("header nav .account").css("opacity", 1).css("pointer-events", "none");

    if (usingAvatar) {
      $("header nav .view-account .loading")
        .css("opacity", 1)
        .removeClass("hidden");
      $("header nav .view-account .avatar")
        .stop(true, true)
        .css({ opacity: 1 })
        .animate(
          {
            opacity: 0,
          },
          100,
          () => {
            $("header nav .view-account .avatar").addClass("hidden");
          }
        );
    } else {
      $("header nav .view-account .loading")
        .stop(true, true)
        .removeClass("hidden")
        .css({ opacity: 0 })
        .animate(
          {
            opacity: 1,
          },
          100
        );
      $("header nav .view-account .user")
        .stop(true, true)
        .css({ opacity: 1 })
        .animate(
          {
            opacity: 0,
          },
          100,
          () => {
            $("header nav .view-account .user").addClass("hidden");
          }
        );
    }
  } else {
    $("header nav .account").css("opacity", 1).css("pointer-events", "auto");

    if (usingAvatar) {
      $("header nav .view-account .loading")
        .css("opacity", 1)
        .addClass("hidden");
      $("header nav .view-account .avatar")
        .stop(true, true)
        .removeClass("hidden")
        .css({ opacity: 0 })
        .animate(
          {
            opacity: 1,
          },
          100
        );
    } else {
      $("header nav .view-account .loading")
        .stop(true, true)
        .css({ opacity: 1 })
        .animate(
          {
            opacity: 0,
          },
          100,
          () => {
            $("header nav .view-account .loading").addClass("hidden");
          }
        );
      $("header nav .view-account .user")
        .stop(true, true)
        .removeClass("hidden")
        .css({ opacity: 0 })
        .animate(
          {
            opacity: 1,
          },
          100
        );
    }
  }
}

export function updateName(name: string): void {
  $("header nav .view-account > .text").text(name);
}

function updateFlags(flags: SupportsFlags): void {
  $("nav .textButton.view-account > .text").append(
    getHtmlByUserFlags(flags, { iconsOnly: true })
  );
}

function updateXp(xp: number): void {
  const xpDetails = Levels.getXpDetails(xp);
  const levelCompletionRatio = xpDetails.levelCurrentXp / xpDetails.levelMaxXp;
  $("header nav .level").text(xpDetails.level);
  $("header nav .bar").css({
    width: levelCompletionRatio * 100 + "%",
  });
}

export function updateAvatar(
  discordId: string | undefined,
  discordAvatar: string | undefined
): void {
  if ((discordAvatar ?? "") && (discordId ?? "")) {
    void Misc.getDiscordAvatarUrl(discordId, discordAvatar).then(
      (discordAvatarUrl) => {
        if (discordAvatarUrl !== null) {
          $("header nav .view-account .avatar").css(
            "background-image",
            `url(${discordAvatarUrl})`
          );
          usingAvatar = true;

          $("header nav .view-account .user").addClass("hidden");
          $("header nav .view-account .avatar").removeClass("hidden");
        }
      }
    );
  } else {
    $("header nav .view-account .avatar").addClass("hidden");
    $("header nav .view-account .user").removeClass("hidden");
  }
}

export function update(snapshot: MonkeyTypes.Snapshot | undefined): void {
  if (isAuthenticated()) {
    // this function is called after the snapshot is loaded (awaited), so it should be fine
    const { xp, discordId, discordAvatar, name } =
      snapshot as MonkeyTypes.Snapshot;

    updateName(name);
    updateFlags(snapshot ?? {});
    updateXp(xp);
    updateAvatar(discordId ?? "", discordAvatar ?? "");

    $("nav .accountButtonAndMenu .menu .items .goToProfile").attr(
      "href",
      `/profile/${name}`
    );
    void Misc.swapElements(
      $("nav .textButton.view-login"),
      $("nav .accountButtonAndMenu"),
      250
    );
  } else {
    void Misc.swapElements(
      $("nav .accountButtonAndMenu"),
      $("nav .textButton.view-login"),
      250,
      async () => {
        updateName("");
        updateFlags({});
        updateXp(0);
        updateAvatar(undefined, undefined);
      }
    );
  }
}

export async function updateXpBar(
  currentXp: number,
  addedXp: number,
  breakdown?: Record<string, number>
): Promise<void> {
  skipBreakdown = false;
  const startingXp = Levels.getXpDetails(currentXp);
  const endingXp = Levels.getXpDetails(currentXp + addedXp);
  const startingLevel =
    startingXp.level + startingXp.levelCurrentXp / startingXp.levelMaxXp;
  const endingLevel =
    endingXp.level + endingXp.levelCurrentXp / endingXp.levelMaxXp;

  if (!skipBreakdown) {
    const xpBarPromise = animateXpBar(startingLevel, endingLevel);
    const xpBreakdownPromise = animateXpBreakdown(addedXp, breakdown);

    await Promise.all([xpBarPromise, xpBreakdownPromise]);
    await Misc.sleep(2000);
  }

  $("nav .level").text(Levels.getLevelFromTotalXp(currentXp + addedXp));
  $("nav .xpBar")
    .stop(true, true)
    .css("opacity", 1)
    .animate({ opacity: 0 }, SlowTimer.get() ? 0 : 250, () => {
      $("nav .xpBar .xpGain").text(``);
    });
}

async function animateXpBreakdown(
  addedXp: number,
  breakdown?: XpBreakdown
): Promise<void> {
  if (!breakdown) {
    $("nav .xpBar .xpGain").text(`+${addedXp}`);
    return;
  }
  const delay = 1000;
  let total = 0;
  const xpGain = $("nav .xpBar .xpGain");
  const xpBreakdown = $("nav .xpBar .xpBreakdown");
  xpBreakdown.empty();

  async function append(string: string): Promise<void> {
    if (skipBreakdown) {
      total = addedXp;
      string = "";
    }

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
                `scale(${1 + step / 300}) translateY(-50%)`
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

  xpGain.text(`+0`);
  xpBreakdown.append(
    `<div class='text next'>time typing +${breakdown.base}</div>`
  );
  total += breakdown["base"] ?? 0;
  if (breakdown.fullAccuracy) {
    await Misc.sleep(delay);
    await append(`perfect +${breakdown.fullAccuracy}`);
    total += breakdown.fullAccuracy;
  } else if (breakdown.corrected) {
    await Misc.sleep(delay);
    await append(`clean +${breakdown.corrected}`);
    total += breakdown.corrected;
  }

  if (skipBreakdown) return;

  if (breakdown.quote) {
    await Misc.sleep(delay);
    await append(`quote +${breakdown.quote}`);
    total += breakdown.quote;
  } else {
    if (breakdown.punctuation) {
      await Misc.sleep(delay);
      await append(`punctuation +${breakdown.punctuation}`);
      total += breakdown.punctuation;
    }
    if (breakdown.numbers) {
      await Misc.sleep(delay);
      await append(`numbers +${breakdown.numbers}`);
      total += breakdown.numbers;
    }
  }

  if (skipBreakdown) return;

  if (breakdown.funbox) {
    await Misc.sleep(delay);
    await append(`funbox +${breakdown.funbox}`);
    total += breakdown.funbox;
  }

  if (skipBreakdown) return;

  if (breakdown.streak) {
    await Misc.sleep(delay);
    await append(`streak +${breakdown.streak}`);
    total += breakdown.streak;
  }

  if (skipBreakdown) return;

  if (breakdown.accPenalty) {
    await Misc.sleep(delay);
    await append(`accuracy penalty -${breakdown.accPenalty}`);
    total -= breakdown.accPenalty;
  }

  if (skipBreakdown) return;

  if (breakdown.incomplete) {
    await Misc.sleep(delay);
    await append(`incomplete tests +${breakdown.incomplete}`);
    total += breakdown.incomplete;
  }

  if (skipBreakdown) return;

  if (breakdown.configMultiplier) {
    await Misc.sleep(delay);
    await append(`global multiplier x${breakdown.configMultiplier}`);
    total *= breakdown.configMultiplier;
  }

  if (skipBreakdown) return;

  if (breakdown.daily) {
    await Misc.sleep(delay);
    await append(`daily bonus +${breakdown.daily}`);
    total += breakdown.daily;
  }

  if (skipBreakdown) return;

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

  $("nav .xpBar").stop(true, true).css("opacity", 0);

  await Misc.promiseAnimation(
    $("nav .xpBar"),
    {
      opacity: "1",
    },
    SlowTimer.get() ? 0 : 250,
    "linear"
  );

  const barEl = $("nav .xpBar .bar");

  barEl.css("width", `${(startingLevel % 1) * 100}%`);

  if (endingLevel % 1 === 0) {
    await Misc.promiseAnimation(
      barEl,
      {
        width: "100%",
      },
      SlowTimer.get() ? 0 : 1000,
      "easeOutExpo"
    );
    void flashLevel();
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
    let animationDuration = quickSpeed;
    let animationEasing = "linear";
    let decrement = 1 - (startingLevel % 1);

    do {
      if (toAnimate - 1 < 1) {
        animationDuration = Misc.mapRange(toAnimate - 1, 0, 0.5, 1000, 200);
        animationEasing = "easeOutQuad";
      }
      if (firstOneDone) {
        void flashLevel();
        barEl.css("width", "0%");
        decrement = 1;
      }
      await Misc.promiseAnimation(
        barEl,
        {
          width: "100%",
        },
        SlowTimer.get() ? 0 : animationDuration,
        animationEasing
      );
      toAnimate -= decrement;
      firstOneDone = true;
    } while (toAnimate > 1);

    void flashLevel();
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
  const levelEl = $("nav .level");

  levelEl.text(parseInt(levelEl.text()) + 1);

  const rand = Math.random() * 2 - 1;
  const rand2 = Math.random() + 1;

  /**
   * `borderSpacing` has no visible effect on this element,
   * and is used in the animation only to provide numerical
   * values for the `step(step)` function.
   */
  levelEl
    .stop(true, true)
    .css({
      backgroundColor: themecolors.main,
      // transform: "scale(1.5) rotate(10deg)",
      borderSpacing: 100,
      transition: "initial",
    })
    .animate(
      {
        backgroundColor: themecolors.sub,
        borderSpacing: 0,
      },
      {
        step(step) {
          levelEl.css(
            "transform",
            `scale(${1 + (step / 200) * rand2}) rotate(${
              (step / 10) * rand
            }deg)`
          );
        },
        duration: 2000,
        easing: "easeOutCubic",
        complete: () => {
          levelEl.css({
            backgroundColor: "",
            transition: "",
          });
        },
      }
    );
}

const coarse = window.matchMedia("(pointer:coarse)")?.matches;
if (coarse) {
  $("nav .accountButtonAndMenu .textButton.view-account").attr("href", "");
}
