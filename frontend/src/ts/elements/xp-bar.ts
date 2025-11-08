import * as Misc from "../utils/misc";
import * as Levels from "../utils/levels";
import { getAll } from "./theme-colors";
import * as SlowTimer from "../states/slow-timer";
import { XpBreakdown } from "@monkeytype/schemas/results";
import { isSafeNumber } from "@monkeytype/util/numbers";
import { animate } from "animejs";

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

const xpBreakdownTotalEl = document.querySelector(
  "nav .xpBar .xpBreakdown .total"
) as HTMLElement;
const xpBreakdownListEl = document.querySelector(
  "nav .xpBar .xpBreakdown .list"
) as HTMLElement;
const levelEl = document.querySelector("nav .level") as HTMLElement;
const barEl = document.querySelector("nav .xpBar .bar") as HTMLElement;
const barWrapperEl = document.querySelector("nav .xpBar") as HTMLElement;

export async function skipBreakdown(): Promise<void> {
  skip = true;

  if (!breakdownVisible) return;

  if (!breakdownDone) {
    void flashTotalXp(lastUpdate.addedXp, true);
  } else {
    xpBreakdownTotalEl.textContent = `+${lastUpdate.addedXp}`;
  }

  animate(xpBreakdownListEl, {
    opacity: [1, 0],
    duration: SlowTimer.get() ? 0 : Misc.applyReducedMotion(250),
    onComplete: () => {
      xpBreakdownListEl.innerHTML = "";
      xpBreakdownListEl.classList.add("hidden");
    },
  });

  levelEl.textContent = `${Levels.getLevelFromTotalXp(
    lastUpdate.currentXp + lastUpdate.addedXp
  )}`;

  const endingDetails = Levels.getXpDetails(
    lastUpdate.currentXp + lastUpdate.addedXp
  );
  const endingLevel =
    endingDetails.level +
    endingDetails.levelCurrentXp / endingDetails.levelMaxXp;

  barEl.style.width = `${(endingLevel % 1) * 100}%`;
  await Misc.sleep(2000);
  breakdownVisible = false;

  animate(barWrapperEl, {
    opacity: [1, 0],
    duration: SlowTimer.get() ? 0 : Misc.applyReducedMotion(250),
  });
}

export function setXp(xp: number): void {
  const xpDetails = Levels.getXpDetails(xp);
  const levelCompletionRatio = xpDetails.levelCurrentXp / xpDetails.levelMaxXp;
  levelEl.textContent = `${xpDetails.level}`;
  barEl.style.width = levelCompletionRatio * 100 + "%";
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

  levelEl.textContent = `${Levels.getLevelFromTotalXp(currentXp)}`;

  const startingXp = Levels.getXpDetails(currentXp);
  const endingXp = Levels.getXpDetails(currentXp + addedXp);
  const startingLevel =
    startingXp.level + startingXp.levelCurrentXp / startingXp.levelMaxXp;
  const endingLevel =
    endingXp.level + endingXp.levelCurrentXp / endingXp.levelMaxXp;

  xpBreakdownListEl.style.opacity = "0";
  xpBreakdownListEl.innerHTML = "";
  barWrapperEl.style.opacity = "0";
  xpBreakdownTotalEl.textContent = "";

  const showParent = Misc.promiseAnimate(barWrapperEl, {
    opacity: 1,
    duration: SlowTimer.get() ? 0 : Misc.applyReducedMotion(125),
    ease: "linear",
  });

  const showList = Misc.promiseAnimate(xpBreakdownListEl, {
    opacity: 1,
    duration: SlowTimer.get() ? 0 : Misc.applyReducedMotion(125),
    ease: "linear",
  });

  if (breakdown !== undefined) {
    xpBreakdownListEl.classList.remove("hidden");
    void Promise.all([showParent, showList]);
  } else {
    xpBreakdownListEl.classList.add("hidden");
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
  levelEl.textContent = `${Levels.getLevelFromTotalXp(currentXp + addedXp)}`;

  animate(barWrapperEl, {
    opacity: [1, 0],
    duration: SlowTimer.get() ? 0 : Misc.applyReducedMotion(250),
  });
}

async function flashTotalXp(totalXp: number, force = false): Promise<void> {
  if (!force && skip) return;

  xpBreakdownTotalEl.textContent = `+${totalXp}`;

  const rand = (Math.random() * 2 - 1) / 4;
  const rand2 = (Math.random() + 1) / 2;

  animate(xpBreakdownTotalEl, {
    scale: [1 + 0.5 * rand2, 1],
    rotate: [10 * rand, 0],
    duration: Misc.applyReducedMotion(2000),
    ease: "out(5)",
  });
}

async function addBreakdownListItem(
  string: string,
  amount: number | string | undefined,
  options?: { extraClass?: string; noAnimation?: boolean }
): Promise<void> {
  if (skip) return;

  if (amount === undefined) {
    xpBreakdownListEl.insertAdjacentHTML(
      "beforeend",
      `<div class="line" data-string='${string}'><div>${string}</div><div></div></div>`
    );
  } else if (typeof amount === "string") {
    xpBreakdownListEl.insertAdjacentHTML(
      "beforeend",
      `
      <div class="line" data-string='${string}'>
      <div class="${options?.extraClass}">${string}</div>
      <div class="${options?.extraClass}">${amount}</div>
      </div>`
    );
  } else {
    const positive = amount === undefined ? undefined : amount >= 0;

    xpBreakdownListEl.insertAdjacentHTML(
      "beforeend",
      `
      <div class="line" data-string='${string}'>

        <div class="${options?.extraClass}">${string}</div>
        <div class="${positive ? "positive" : "negative"} ${
        options?.extraClass
      }">${positive ? "+" : "-"}${Math.abs(amount)}</div>
      </div>`
    );
  }

  if (options?.noAnimation) return;

  const el = xpBreakdownListEl.querySelector(
    `.line[data-string='${string}']`
  ) as HTMLElement;

  await Misc.promiseAnimate(el, {
    opacity: [0, 1],
    duration: Misc.applyReducedMotion(250),
  });
}

async function animateXpBreakdown(
  addedXp: number,
  breakdown?: XpBreakdown
): Promise<void> {
  if (skip) return;

  xpBreakdownListEl.style.opacity = "1";
  if (!breakdown) {
    xpBreakdownTotalEl.textContent = `+${addedXp}`;
    return;
  }
  const delay = Misc.applyReducedMotion(250);
  let total = 0;
  xpBreakdownListEl.innerHTML = "";
  xpBreakdownListEl.classList.remove("hidden");

  xpBreakdownTotalEl.textContent = `+0`;

  total += breakdown.base ?? 0;
  xpBreakdownTotalEl.textContent = `+${total}`;
  await addBreakdownListItem("time typing", breakdown.base, {
    noAnimation: true,
  });

  await Misc.sleep(delay);

  if (isSafeNumber(breakdown.fullAccuracy)) {
    await Misc.sleep(delay);
    total += breakdown.fullAccuracy;
    void flashTotalXp(total);
    await addBreakdownListItem("perfect", breakdown.fullAccuracy);
  } else if (isSafeNumber(breakdown.corrected)) {
    await Misc.sleep(delay);
    total += breakdown.corrected;
    void flashTotalXp(total);
    await addBreakdownListItem("clean", breakdown.corrected);
  }

  if (skip) return;

  if (isSafeNumber(breakdown.quote)) {
    await Misc.sleep(delay);
    total += breakdown.quote;
    void flashTotalXp(total);
    await addBreakdownListItem("quote", breakdown.quote);
  } else {
    if (isSafeNumber(breakdown.punctuation)) {
      await Misc.sleep(delay);
      total += breakdown.punctuation;
      void flashTotalXp(total);
      await addBreakdownListItem("punctuation", breakdown.punctuation);
    }
    if (isSafeNumber(breakdown.numbers)) {
      await Misc.sleep(delay);
      total += breakdown.numbers;
      void flashTotalXp(total);
      await addBreakdownListItem("numbers", breakdown.numbers);
    }
  }

  if (skip) return;

  if (isSafeNumber(breakdown.funbox)) {
    await Misc.sleep(delay);
    total += breakdown.funbox;
    void flashTotalXp(total);
    await addBreakdownListItem("funbox", breakdown.funbox);
  }

  if (skip) return;

  if (isSafeNumber(breakdown.streak)) {
    await Misc.sleep(delay);
    total += breakdown.streak;
    void flashTotalXp(total);
    await addBreakdownListItem("streak", breakdown.streak);
  }

  if (skip) return;

  if (isSafeNumber(breakdown.accPenalty) && breakdown.accPenalty > 0) {
    await Misc.sleep(delay);
    total -= breakdown.accPenalty;
    void flashTotalXp(total);
    await addBreakdownListItem("accuracy penalty", breakdown.accPenalty * -1);
  }

  if (skip) return;

  if (isSafeNumber(breakdown.incomplete) && breakdown.incomplete > 0) {
    await Misc.sleep(delay);
    total += breakdown.incomplete;
    void flashTotalXp(total);
    await addBreakdownListItem("incomplete tests", breakdown.incomplete);
  }

  if (skip) return;

  if (isSafeNumber(breakdown.configMultiplier)) {
    await Misc.sleep(delay);
    total *= breakdown.configMultiplier;
    void flashTotalXp(total);
    await addBreakdownListItem(
      "global multiplier",
      `x${breakdown.configMultiplier}`
    );
  }

  if (skip) return;

  if (isSafeNumber(breakdown.daily)) {
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

  barEl.style.width = `${(startingLevel % 1) * 100}%`;

  if (endingLevel % 1 === 0) {
    //ending level is exactly round, meaning fill the bar to 100%, flash, set to 0
    await Misc.promiseAnimate(barEl, {
      width: "100%",
      duration: SlowTimer.get() ? 0 : Misc.applyReducedMotion(1000),
      ease: "out(5)",
    });

    if (skip) return;

    void flashLevel();
    barEl.style.width = `0%`;
  } else if (Math.floor(startingLevel) === Math.floor(endingLevel)) {
    //ending level is the same, just animate the bar to the correct percentage
    await Misc.promiseAnimate(barEl, {
      width: `${(endingLevel % 1) * 100}%`,
      duration: SlowTimer.get() ? 0 : Misc.applyReducedMotion(1000),
      ease: "out(5)",
    });
  } else {
    // const quickSpeed = Misc.mapRange(difference, 10, 2000, 200, 1);
    const quickSpeed = Math.min(1000 / difference, 200);
    let toAnimate = difference;

    let firstOneDone = false;
    let animationDuration = quickSpeed;
    let decrement = 1 - (startingLevel % 1);

    do {
      if (skip) return;

      if (firstOneDone) {
        void flashLevel();
        barEl.style.width = "0%";
        decrement = 1;
      }

      await Misc.promiseAnimate(barEl, {
        width: "100%",
        duration: SlowTimer.get()
          ? 0
          : Misc.applyReducedMotion(animationDuration),
        ease: "linear",
      });

      toAnimate -= decrement;
      firstOneDone = true;
    } while (toAnimate > 1);

    if (skip) return;

    void flashLevel();
    barEl.style.width = "0%";

    if (skip) return;

    await Misc.promiseAnimate(barEl, {
      width: `${(toAnimate % 1) * 100}%`,
      duration: SlowTimer.get() ? 0 : Misc.applyReducedMotion(1000),
      ease: "out(5)",
    });
  }
  return;
}

async function flashLevel(): Promise<void> {
  const themecolors = await getAll();

  levelEl.textContent = `${parseInt(levelEl.textContent ?? "0") + 1}`;

  const rand = Math.random() * 2 - 1;
  const rand2 = Math.random() + 1;

  /**
   * `borderSpacing` has no visible effect on this element,
   * and is used in the animation only to provide numerical
   * values for the `step(step)` function.
   */

  animate(levelEl, {
    scale: [1 + 0.5 * rand2, 1],
    backgroundColor: [themecolors.main, themecolors.sub],
    rotate: [10 * rand, 0],
    duration: Misc.applyReducedMotion(2000),
    ease: "out(5)",
  });
}
