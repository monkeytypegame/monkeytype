import * as Misc from "../utils/misc";
import * as Levels from "../utils/levels";
import { getAll } from "./theme-colors";
import * as SlowTimer from "../states/slow-timer";
import { XpBreakdown } from "@monkeytype/contracts/schemas/results";
import { mapRange } from "@monkeytype/util/numbers";

let breakdownVisible = false;
let skip = false;
let breakdownDone = false;

let lastUpdate: {
  currentXp: number;
  addedXp: number;
  breakdown?: XpBreakdown;
} = {
  currentXp: 0,
  addedXp: 0,
  breakdown: undefined,
};

const xpBreakdownTotalEl = $("nav .xpBar .xpBreakdown .total");
const xpBreakdownListEl = $("nav .xpBar .xpBreakdown .list");
const levelEl = $("nav .level");
const barEl = $("nav .xpBar .bar");
const barWrapperEl = $("nav .xpBar");

export async function skipBreakdown(): Promise<void> {
  skip = true;

  if (!breakdownVisible) return;

  if (!breakdownDone) {
    void flashTotalXp(lastUpdate.addedXp, true);
  } else {
    xpBreakdownTotalEl.text(`+${lastUpdate.addedXp}`);
  }

  xpBreakdownListEl.stop(true, true).empty().addClass("hidden");
  levelEl.text(
    Levels.getLevelFromTotalXp(lastUpdate.currentXp + lastUpdate.addedXp)
  );

  const endingDetails = Levels.getXpDetails(
    lastUpdate.currentXp + lastUpdate.addedXp
  );
  const endingLevel =
    endingDetails.level +
    endingDetails.levelCurrentXp / endingDetails.levelMaxXp;

  barEl.css("width", `${(endingLevel % 1) * 100}%`);
  await Misc.sleep(2000);
  breakdownVisible = false;
  barWrapperEl
    .stop(true, true)
    .css("opacity", 1)
    .animate(
      {
        opacity: 0,
      },
      SlowTimer.get() ? 0 : Misc.applyReducedMotion(250)
    );
}

export function setXp(xp: number): void {
  const xpDetails = Levels.getXpDetails(xp);
  const levelCompletionRatio = xpDetails.levelCurrentXp / xpDetails.levelMaxXp;
  levelEl.text(xpDetails.level);
  barEl.css({
    width: levelCompletionRatio * 100 + "%",
  });
}

export async function update(
  currentXp: number,
  addedXp: number,
  breakdown?: XpBreakdown
): Promise<void> {
  skip = false;
  breakdownVisible = true;
  lastUpdate = {
    currentXp,
    addedXp,
    breakdown,
  };

  levelEl.text(Levels.getLevelFromTotalXp(currentXp));

  const startingXp = Levels.getXpDetails(currentXp);
  const endingXp = Levels.getXpDetails(currentXp + addedXp);
  const startingLevel =
    startingXp.level + startingXp.levelCurrentXp / startingXp.levelMaxXp;
  const endingLevel =
    endingXp.level + endingXp.levelCurrentXp / endingXp.levelMaxXp;

  const breakdownList = xpBreakdownListEl;

  xpBreakdownListEl.stop(true, true).css("opacity", 0).empty();
  barWrapperEl.stop(true, true).css("opacity", 0);
  xpBreakdownTotalEl.text("");

  const showParent = Misc.promiseAnimation(
    barWrapperEl,
    {
      opacity: "1",
    },
    SlowTimer.get() ? 0 : Misc.applyReducedMotion(125),
    "linear"
  );

  const showList = Misc.promiseAnimation(
    xpBreakdownListEl,
    {
      opacity: "1",
    },
    SlowTimer.get() ? 0 : Misc.applyReducedMotion(125),
    "linear"
  );

  if (breakdown !== undefined) {
    breakdownList.removeClass("hidden");
    void Promise.all([showParent, showList]);
  } else {
    breakdownList.addClass("hidden");
    void showParent;
  }

  if (skip) return;

  const xpBarPromise = animateXpBar(startingLevel, endingLevel);
  const xpBreakdownPromise = animateXpBreakdown(addedXp, breakdown);

  await Promise.all([xpBarPromise, xpBreakdownPromise]);

  if (skip) return;

  await Misc.sleep(5000);

  if (skip) return;

  breakdownVisible = false;
  levelEl.text(Levels.getLevelFromTotalXp(currentXp + addedXp));
  barWrapperEl
    .stop(true, true)
    .css("opacity", 1)
    .animate(
      {
        opacity: 0,
      },
      SlowTimer.get() ? 0 : Misc.applyReducedMotion(250)
    );
}

async function flashTotalXp(totalXp: number, force = false): Promise<void> {
  if (!force && skip) return;

  xpBreakdownTotalEl.text(`+${totalXp}`);

  const rand = (Math.random() * 2 - 1) / 4;
  const rand2 = (Math.random() + 1) / 2;

  /**
   * `borderSpacing` has no visible effect on this element,
   * and is used in the animation only to provide numerical
   * values for the `step(step)` function.
   */
  xpBreakdownTotalEl
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
          xpBreakdownTotalEl.css(
            "transform",
            `scale(${1 + (step / 200) * rand2}) rotate(${
              (step / 10) * rand
            }deg)`
          );
        },
        duration: Misc.applyReducedMotion(2000),
        easing: "easeOutCubic",
        complete: () => {
          xpBreakdownTotalEl.css({
            backgroundColor: "",
            transition: "",
          });
        },
      }
    );
}

async function addBreakdownListItem(
  string: string,
  amount: number | string | undefined,
  options?: { extraClass?: string; noAnimation?: boolean }
): Promise<void> {
  if (skip) return;

  if (amount === undefined) {
    xpBreakdownListEl.append(
      `<div class="line" data-string='${string}'><div>${string}</div><div></div></div>`
    );
  } else if (typeof amount === "string") {
    xpBreakdownListEl.append(
      `
      <div class="line" data-string='${string}'>
      <div class="${options?.extraClass}">${string}</div>
      <div class="${options?.extraClass}">${amount}</div>
      </div>`
    );
  } else {
    const positive = amount == undefined ? undefined : amount >= 0;

    xpBreakdownListEl.append(`
      <div class="line" data-string='${string}'>

        <div class="${options?.extraClass}">${string}</div>
        <div class="${positive ? "positive" : "negative"} ${
      options?.extraClass
    }">${positive ? "+" : "-"}${Math.abs(amount)}</div>
      </div>`);
  }

  if (options?.noAnimation) return;

  const el = xpBreakdownListEl.find(`.line[data-string='${string}']`);

  el.css("opacity", 0);
  await Misc.promiseAnimation(
    el,
    {
      opacity: "1",
    },
    Misc.applyReducedMotion(250),
    "swing"
  );
}

async function animateXpBreakdown(
  addedXp: number,
  breakdown?: XpBreakdown
): Promise<void> {
  if (skip) return;

  xpBreakdownListEl.css("opacity", 1);
  if (!breakdown) {
    xpBreakdownTotalEl.text(`+${addedXp}`);
    return;
  }
  const delay = Misc.applyReducedMotion(250);
  let total = 0;
  xpBreakdownListEl.empty();
  xpBreakdownListEl.removeClass("hidden");

  xpBreakdownTotalEl.text("+0");

  total += breakdown.base ?? 0;
  xpBreakdownTotalEl.text(`+${total}`);
  await addBreakdownListItem("time typing", breakdown.base, {
    noAnimation: true,
  });

  await Misc.sleep(delay);

  if (breakdown.fullAccuracy) {
    await Misc.sleep(delay);
    total += breakdown.fullAccuracy;
    void flashTotalXp(total);
    await addBreakdownListItem("perfect", breakdown.fullAccuracy);
  } else if (breakdown.corrected) {
    await Misc.sleep(delay);
    total += breakdown.corrected;
    void flashTotalXp(total);
    await addBreakdownListItem("clean", breakdown.corrected);
  }

  if (skip) return;

  if (breakdown.quote) {
    await Misc.sleep(delay);
    total += breakdown.quote;
    void flashTotalXp(total);
    await addBreakdownListItem("quote", breakdown.quote);
  } else {
    if (breakdown.punctuation) {
      await Misc.sleep(delay);
      total += breakdown.punctuation;
      void flashTotalXp(total);
      await addBreakdownListItem("punctuation", breakdown.punctuation);
    }
    if (breakdown.numbers) {
      await Misc.sleep(delay);
      total += breakdown.numbers;
      void flashTotalXp(total);
      await addBreakdownListItem("numbers", breakdown.numbers);
    }
  }

  if (skip) return;

  if (breakdown.funbox) {
    await Misc.sleep(delay);
    total += breakdown.funbox;
    void flashTotalXp(total);
    await addBreakdownListItem("funbox", breakdown.funbox);
  }

  if (skip) return;

  if (breakdown.streak) {
    await Misc.sleep(delay);
    total += breakdown.streak;
    void flashTotalXp(total);
    await addBreakdownListItem("streak", breakdown.streak);
  }

  if (skip) return;

  if (breakdown.accPenalty) {
    await Misc.sleep(delay);
    total -= breakdown.accPenalty;
    void flashTotalXp(total);
    await addBreakdownListItem("accuracy penalty", breakdown.accPenalty * -1);
  }

  if (skip) return;

  if (breakdown.incomplete) {
    await Misc.sleep(delay);
    total += breakdown.incomplete;
    void flashTotalXp(total);
    await addBreakdownListItem("incomplete tests", breakdown.incomplete);
  }

  if (skip) return;

  if (breakdown.configMultiplier) {
    await Misc.sleep(delay);
    total *= breakdown.configMultiplier;
    void flashTotalXp(total);
    await addBreakdownListItem(
      "global multiplier",
      `x${breakdown.configMultiplier}`
    );
  }

  if (skip) return;

  if (breakdown.daily) {
    await Misc.sleep(delay);
    total += breakdown.daily;
    void flashTotalXp(total);
    await addBreakdownListItem("daily bonus", breakdown.daily);
  }

  breakdownDone = true;

  if (skip) return;

  await Misc.sleep(delay);
}

async function animateXpBar(
  startingLevel: number,
  endingLevel: number
): Promise<void> {
  if (skip) return;

  const difference = endingLevel - startingLevel;

  barEl.css("width", `${(startingLevel % 1) * 100}%`);

  if (endingLevel % 1 === 0) {
    await Misc.promiseAnimation(
      barEl,
      {
        width: "100%",
      },
      SlowTimer.get() ? 0 : Misc.applyReducedMotion(1000),
      "easeOutExpo"
    );

    if (skip) return;

    void flashLevel();
    barEl.css("width", `0%`);
  } else if (Math.floor(startingLevel) === Math.floor(endingLevel)) {
    await Misc.promiseAnimation(
      barEl,
      { width: `${(endingLevel % 1) * 100}%` },
      SlowTimer.get() ? 0 : Misc.applyReducedMotion(1000),
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
      if (skip) return;

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
        SlowTimer.get() ? 0 : Misc.applyReducedMotion(animationDuration),
        animationEasing
      );
      toAnimate -= decrement;
      firstOneDone = true;
    } while (toAnimate > 1);

    if (skip) return;

    void flashLevel();
    barEl.css("width", "0%");

    if (skip) return;

    await Misc.promiseAnimation(
      barEl,
      {
        width: `${(toAnimate % 1) * 100}%`,
      },
      SlowTimer.get() ? 0 : Misc.applyReducedMotion(1000),
      "easeOutExpo"
    );
  }
  return;
}

async function flashLevel(): Promise<void> {
  const themecolors = await getAll();

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
        duration: Misc.applyReducedMotion(2000),
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
