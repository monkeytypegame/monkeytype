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
import { mapRange } from "@monkeytype/util/numbers";
import { Snapshot } from "../db";

let usingAvatar = false;

let breakdownVisible = false;
let skipBreakdown = false;
let breakdownDone = false;

export async function skipXpBreakdown(): Promise<void> {
  skipBreakdown = true;

  if (!breakdownVisible) return;

  if (!breakdownDone) {
    void flashTotalXp(lastUpdateXpBar.addedXp, true);
  } else {
    $("nav .xpBar .xpBreakdown .total").text(`+${lastUpdateXpBar.addedXp}`);
  }

  $("nav .xpBar .xpBreakdown .list")
    .stop(true, true)
    .empty()
    .addClass("hidden");
  $("nav .level").text(
    Levels.getLevelFromTotalXp(
      lastUpdateXpBar.currentXp + lastUpdateXpBar.addedXp
    )
  );

  const endingDetails = Levels.getXpDetails(
    lastUpdateXpBar.currentXp + lastUpdateXpBar.addedXp
  );
  const endingLevel =
    endingDetails.level +
    endingDetails.levelCurrentXp / endingDetails.levelMaxXp;

  const barEl = $("nav .xpBar .bar");
  barEl.css("width", `${(endingLevel % 1) * 100}%`);
  await Misc.sleep(2000);
  breakdownVisible = false;
  $("nav .xpBar")
    .stop(true, true)
    .css("opacity", 1)
    .animate(
      {
        opacity: 0,
      },
      SlowTimer.get() ? 0 : 250
    );
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

export function update(snapshot: Snapshot | undefined): void {
  if (isAuthenticated()) {
    // this function is called after the snapshot is loaded (awaited), so it should be fine
    const { xp, discordId, discordAvatar, name } = snapshot as Snapshot;

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

let lastUpdateXpBar: {
  currentXp: number;
  addedXp: number;
  breakdown?: XpBreakdown;
} = {
  currentXp: 0,
  addedXp: 0,
  breakdown: undefined,
};

export async function updateXpBar(
  currentXp: number,
  addedXp: number,
  breakdown?: XpBreakdown
): Promise<void> {
  skipBreakdown = false;
  breakdownVisible = true;
  lastUpdateXpBar = {
    currentXp,
    addedXp,
    breakdown,
  };
  const startingXp = Levels.getXpDetails(currentXp);
  const endingXp = Levels.getXpDetails(currentXp + addedXp);
  const startingLevel =
    startingXp.level + startingXp.levelCurrentXp / startingXp.levelMaxXp;
  const endingLevel =
    endingXp.level + endingXp.levelCurrentXp / endingXp.levelMaxXp;

  const breakdownList = $("nav .xpBar .xpBreakdown .list");

  $("nav .xpBar .xpBreakdown .list").stop(true, true).css("opacity", 0).empty();
  $("nav .xpBar").stop(true, true).css("opacity", 0);
  $("nav .xpBar .xpBreakdown .total").text("");

  const showParent = Misc.promiseAnimation(
    $("nav .xpBar"),
    {
      opacity: "1",
    },
    SlowTimer.get() ? 0 : 125,
    "linear"
  );

  const showList = Misc.promiseAnimation(
    $("nav .xpBar .xpBreakdown .list"),
    {
      opacity: "1",
    },
    SlowTimer.get() ? 0 : 125,
    "linear"
  );

  if (breakdown !== undefined) {
    breakdownList.removeClass("hidden");
    void Promise.all([showParent, showList]);
  } else {
    breakdownList.addClass("hidden");
    void showParent;
  }

  if (skipBreakdown) return;

  const xpBarPromise = animateXpBar(startingLevel, endingLevel);
  const xpBreakdownPromise = animateXpBreakdown(addedXp, breakdown);

  await Promise.all([xpBarPromise, xpBreakdownPromise]);

  if (skipBreakdown) return;

  await Misc.sleep(5000);

  if (skipBreakdown) return;

  breakdownVisible = false;
  $("nav .level").text(Levels.getLevelFromTotalXp(currentXp + addedXp));
  $("nav .xpBar")
    .stop(true, true)
    .css("opacity", 1)
    .animate(
      {
        opacity: 0,
      },
      SlowTimer.get() ? 0 : 250
    );
}

async function flashTotalXp(totalXp: number, force = false): Promise<void> {
  if (!force && skipBreakdown) return;

  const xpTotalEl = $("nav .xpBar .xpBreakdown .total");

  xpTotalEl.text(`+${totalXp}`);

  const rand = (Math.random() * 2 - 1) / 4;
  const rand2 = (Math.random() + 1) / 2;

  /**
   * `borderSpacing` has no visible effect on this element,
   * and is used in the animation only to provide numerical
   * values for the `step(step)` function.
   */
  xpTotalEl
    .stop(true, true)
    .css({
      transition: "initial",
      borderSpacing: 100,
    })
    .animate(
      {
        borderSpacing: 0,
      },
      {
        step(step) {
          xpTotalEl.css(
            "transform",
            `scale(${1 + (step / 200) * rand2}) rotate(${
              (step / 10) * rand
            }deg)`
          );
        },
        duration: 2000,
        easing: "easeOutCubic",
        complete: () => {
          xpTotalEl.css({
            backgroundColor: "",
            transition: "",
          });
        },
      }
    );
}

async function animateXpBreakdown(
  addedXp: number,
  breakdown?: XpBreakdown
): Promise<void> {
  if (skipBreakdown) return;

  const xpBreakdownTotal = $("nav .xpBar .xpBreakdown .total");
  const xpBreakdownList = $("nav .xpBar .xpBreakdown .list");
  xpBreakdownList.css("opacity", 1);
  if (!breakdown) {
    xpBreakdownTotal.text(`+${addedXp}`);
    return;
  }
  const delay = 250;
  let total = 0;
  xpBreakdownList.empty();
  xpBreakdownList.removeClass("hidden");

  xpBreakdownTotal.text("+0");

  async function append(
    string: string,
    amount: number | string | undefined,
    options?: { extraClass?: string; noAnimation?: boolean }
  ): Promise<void> {
    if (skipBreakdown) return;

    if (amount === undefined) {
      xpBreakdownList.append(
        `<div class="line" data-string='${string}'><div>${string}</div><div></div></div>`
      );
    } else if (typeof amount === "string") {
      xpBreakdownList.append(
        `
        <div class="line" data-string='${string}'>
        <div class="${options?.extraClass}">${string}</div>
        <div class="${options?.extraClass}">${amount}</div>
        </div>`
      );
    } else {
      const positive = amount == undefined ? undefined : amount >= 0;

      xpBreakdownList.append(`
        <div class="line" data-string='${string}'>

          <div class="${options?.extraClass}">${string}</div>
          <div class="${positive ? "positive" : "negative"} ${
        options?.extraClass
      }">${positive ? "+" : "-"}${Math.abs(amount)}</div>
        </div>`);
    }

    if (options?.noAnimation) return;

    const el = xpBreakdownList.find(`.line[data-string='${string}']`);

    el.css("opacity", 0);
    await Misc.promiseAnimation(
      el,
      {
        opacity: "1",
      },
      250,
      "swing"
    );
  }

  total += breakdown.base ?? 0;
  $("nav .xpBar .xpBreakdown .total").text(`+${total}`);
  await append("time typing", breakdown.base, { noAnimation: true });

  await Misc.sleep(delay);

  if (breakdown.fullAccuracy) {
    await Misc.sleep(delay);
    total += breakdown.fullAccuracy;
    void flashTotalXp(total);
    await append("perfect", breakdown.fullAccuracy);
  } else if (breakdown.corrected) {
    await Misc.sleep(delay);
    total += breakdown.corrected;
    void flashTotalXp(total);
    await append("clean", breakdown.corrected);
  }

  if (skipBreakdown) return;

  if (breakdown.quote) {
    await Misc.sleep(delay);
    total += breakdown.quote;
    void flashTotalXp(total);
    await append("quote", breakdown.quote);
  } else {
    if (breakdown.punctuation) {
      await Misc.sleep(delay);
      total += breakdown.punctuation;
      void flashTotalXp(total);
      await append("punctuation", breakdown.punctuation);
    }
    if (breakdown.numbers) {
      await Misc.sleep(delay);
      total += breakdown.numbers;
      void flashTotalXp(total);
      await append("numbers", breakdown.numbers);
    }
  }

  if (skipBreakdown) return;

  if (breakdown.funbox) {
    await Misc.sleep(delay);
    total += breakdown.funbox;
    void flashTotalXp(total);
    await append("funbox", breakdown.funbox);
  }

  if (skipBreakdown) return;

  if (breakdown.streak) {
    await Misc.sleep(delay);
    total += breakdown.streak;
    void flashTotalXp(total);
    await append("streak", breakdown.streak);
  }

  if (skipBreakdown) return;

  if (breakdown.accPenalty) {
    await Misc.sleep(delay);
    total -= breakdown.accPenalty;
    void flashTotalXp(total);
    await append("accuracy penalty", breakdown.accPenalty * -1);
  }

  if (skipBreakdown) return;

  if (breakdown.incomplete) {
    await Misc.sleep(delay);
    total += breakdown.incomplete;
    void flashTotalXp(total);
    await append("incomplete tests", breakdown.incomplete);
  }

  if (skipBreakdown) return;

  if (breakdown.configMultiplier) {
    await Misc.sleep(delay);
    total *= breakdown.configMultiplier;
    void flashTotalXp(total);
    await append("global multiplier", `x${breakdown.configMultiplier}`);
  }

  if (skipBreakdown) return;

  if (breakdown.daily) {
    await Misc.sleep(delay);
    total += breakdown.daily;
    void flashTotalXp(total);
    await append("daily bonus", breakdown.daily);
  }

  breakdownDone = true;

  if (skipBreakdown) return;

  await Misc.sleep(delay);
}

async function animateXpBar(
  startingLevel: number,
  endingLevel: number
): Promise<void> {
  if (skipBreakdown) return;

  const difference = endingLevel - startingLevel;
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

    if (skipBreakdown) return;

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
      if (skipBreakdown) return;

      if (toAnimate - 1 < 1) {
        animationDuration = mapRange(toAnimate - 1, 0, 0.5, 1000, 200);
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

    if (skipBreakdown) return;

    void flashLevel();
    barEl.css("width", "0%");

    if (skipBreakdown) return;

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
