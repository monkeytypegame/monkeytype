import { XpBreakdown } from "@monkeytype/schemas/results";
import { isSafeNumber } from "@monkeytype/util/numbers";
import {
  createSignal,
  For,
  JSXElement,
  onCleanup,
  ParentProps,
} from "solid-js";

import { createEvent } from "../../../hooks/createEvent";
import { createSignalWithSetters } from "../../../hooks/createSignalWithSetters";
import { createEffectOn } from "../../../hooks/effects";
import {
  skipBreakdownEvent,
  getXpBarData,
  setAnimatedLevel,
} from "../../../states/header";
import { getFocus } from "../../../states/test";
import { getXpDetails } from "../../../utils/levels";
import { sleep } from "../../../utils/misc";
import { Anime, AnimePresence, AnimeShow } from "../../common/anime";
import { Bar } from "../../common/Bar";

type BreakdownItem = {
  label: string;
  amount: number | string;
};

export function AccountXpBar(): JSXElement {
  const [getShowBar, setShowBar] = createSignal(false);
  const [getShowBreakdown, setShowBreakdown] = createSignal(false);
  const [getBreakdownItems, setBreakdownItems] = createSignal<BreakdownItem[]>(
    [],
  );
  const [getBarPercent, setBarPercent] = createSignal(0);
  const [getBarAnimationDuration, setBarAnimationDuration] = createSignal(0);
  const [getBarAnimationEase, setBarAnimationEase] = createSignal("out(5)");

  const animationEvent = createEvent();
  const [getTotal, { setTotal }] = createSignalWithSetters(0)({
    setTotal: (set, value: number) => {
      set(value);
      animationEvent.dispatch();
    },
  });

  onCleanup(() => {
    runId++;
  });

  let canSkip = true;
  let skipped = false;
  let runId = 0;

  const [flashAnimation, setFlashAnimation] = createSignal({
    scale: [1, 1],
    rotate: [0, 0],
    duration: 2000,
    ease: "out(5)",
  });

  animationEvent.useListener(() => {
    const rand = (Math.random() * 2 - 1) / 4;
    const rand2 = (Math.random() + 1) / 2;
    setFlashAnimation({
      scale: [1 + 0.5 * rand2, 1],
      rotate: [10 * rand, 0],
      duration: 2000,
      ease: "out(5)",
    });
  });

  const addItem = (label: string, amount: number | string): void => {
    setBreakdownItems((items) => [...items, { label, amount }]);
  };

  skipBreakdownEvent.useListener(async () => {
    if (skipped || !canSkip) return;

    const myId = runId; // capture before first await
    const data = getXpBarData();
    if (!data) return;

    const breakdown = data.breakdown;
    if (!getShowBreakdown() || !breakdown) return;

    skipped = true;
    setShowBreakdown(false);
    setBreakdownItems([]);
    setTotal(data.addedXp);
    await sleep(3000);
    if (runId !== myId) return;
    setShowBar(false);
  });

  createEffectOn(getXpBarData, async (data) => {
    const myId = ++runId;
    const isStale = (): boolean => runId !== myId;
    if (data !== null) {
      skipped = false;
      canSkip = true;
      const breakdown = data.breakdown;
      const promises = [];
      if (breakdown) {
        promises.push(runBreakdown(breakdown, isStale));
        setShowBreakdown(true);
      } else {
        setShowBreakdown(false);
        setBreakdownItems([]);
        setTotal(data.addedXp);
      }
      setShowBar(true);
      await sleep(125);
      if (isStale()) return;

      promises.push(
        fullBarAnimation(
          data.resultingXp - data.addedXp,
          data.resultingXp,
          isStale,
        ),
      );
      if (skipped) return;
      await Promise.all(promises);
      canSkip = false;
      await sleep(4000);
      if (isStale() || skipped) return;
      setShowBreakdown(false);
      await sleep(1000);
      if (isStale() || skipped) return;
      setShowBar(false);
    }
  });

  const runBreakdown = async (
    breakdown: XpBreakdown,
    isStale: () => boolean,
  ): Promise<void> => {
    const delay = 500;
    setBreakdownItems([]);
    let total = breakdown.base ?? 0;
    setTotal(total);

    addItem("time typing", breakdown.base ?? 0);

    if (isSafeNumber(breakdown.fullAccuracy)) {
      await sleep(delay);
      if (isStale() || skipped) return;
      total += breakdown.fullAccuracy;
      setTotal(total);
      addItem("perfect", breakdown.fullAccuracy);
    } else if (isSafeNumber(breakdown.corrected)) {
      await sleep(delay);
      if (isStale() || skipped) return;
      total += breakdown.corrected;
      setTotal(total);
      addItem("clean", breakdown.corrected);
    }

    if (isSafeNumber(breakdown.quote)) {
      await sleep(delay);
      if (isStale() || skipped) return;
      total += breakdown.quote;
      setTotal(total);
      addItem("quote", breakdown.quote);
    } else {
      if (isSafeNumber(breakdown.punctuation)) {
        await sleep(delay);
        if (isStale() || skipped) return;
        total += breakdown.punctuation;
        setTotal(total);
        addItem("punctuation", breakdown.punctuation);
      }
      if (isSafeNumber(breakdown.numbers)) {
        await sleep(delay);
        if (isStale() || skipped) return;
        total += breakdown.numbers;
        setTotal(total);
        addItem("numbers", breakdown.numbers);
      }
    }

    if (isSafeNumber(breakdown.funbox)) {
      await sleep(delay);
      if (isStale() || skipped) return;
      total += breakdown.funbox;
      setTotal(total);
      addItem("funbox", breakdown.funbox);
    }

    if (isSafeNumber(breakdown.streak)) {
      await sleep(delay);
      if (isStale() || skipped) return;
      total += breakdown.streak;
      setTotal(total);
      addItem("streak", breakdown.streak);
    }

    if (isSafeNumber(breakdown.accPenalty) && breakdown.accPenalty > 0) {
      await sleep(delay);
      if (isStale() || skipped) return;
      total -= breakdown.accPenalty;
      setTotal(total);
      addItem("accuracy penalty", -breakdown.accPenalty);
    }

    if (isSafeNumber(breakdown.incomplete) && breakdown.incomplete > 0) {
      await sleep(delay);
      if (isStale() || skipped) return;
      total += breakdown.incomplete;
      setTotal(total);
      addItem("incomplete tests", breakdown.incomplete);
    }

    if (isSafeNumber(breakdown.configMultiplier)) {
      await sleep(delay);
      if (isStale() || skipped) return;
      total *= breakdown.configMultiplier;
      setTotal(total);
      addItem("global multiplier", `x${breakdown.configMultiplier}`);
    }

    if (isSafeNumber(breakdown.daily)) {
      await sleep(delay);
      if (isStale() || skipped) return;
      total += breakdown.daily;
      setTotal(total);
      addItem("daily bonus", breakdown.daily);
    }
  };

  const animateBar = async (
    percent: number,
    duration: number,
    isStale: () => boolean,
  ): Promise<void> => {
    if (isStale()) return;
    setBarAnimationDuration(duration);
    setBarPercent(percent);
    await sleep(duration);
    if (!isStale()) setBarAnimationDuration(0);
  };

  const fullBarAnimation = async (
    fromXp: number,
    toXp: number,
    isStale: () => boolean,
  ): Promise<void> => {
    const prevDetails = getXpDetails(fromXp);
    const newDetails = getXpDetails(toXp);

    const startingLevel = prevDetails.levelFloat;
    const endingLevel = newDetails.levelFloat;

    const difference = newDetails.levelFloat - prevDetails.levelFloat;

    await animateBar(prevDetails.levelProgressPercent, 0, isStale);
    if (isStale()) return;

    if (endingLevel % 1 === 0) {
      // Exact level up, animate to 100% then reset to 0% for next level
      setBarAnimationEase("out(5)");
      await animateBar(100, 1000, isStale);
      if (isStale()) return;
      setAnimatedLevel(Math.floor(endingLevel));
      await animateBar(0, 0, isStale);
    } else if (Math.floor(startingLevel) === Math.floor(endingLevel)) {
      // Same level, just animate to the new percentage
      setBarAnimationEase("out(5)");
      await animateBar(newDetails.levelProgressPercent, 1000, isStale);
    } else {
      // Multiple levels gained, animate to 100% for each intermediate level
      const quickSpeed = Math.min(1000 / difference, 200);
      let toAnimate = difference;

      let firstOneDone = false;
      let animationDuration = quickSpeed;
      let decrement = 1 - (startingLevel % 1);
      let currentLevel = Math.floor(startingLevel);

      setBarAnimationEase("linear");

      do {
        if (isStale()) return;

        if (firstOneDone) {
          await animateBar(0, 0, isStale);
          decrement = 1;
        }

        await animateBar(100, animationDuration, isStale);
        currentLevel += 1;
        setAnimatedLevel(currentLevel);

        toAnimate -= decrement;
        firstOneDone = true;
      } while (toAnimate > 1);

      if (isStale()) return;

      await animateBar(0, 0, isStale);

      if (isStale()) return;

      setBarAnimationEase("out(5)");
      await animateBar(newDetails.levelProgressPercent, 1000, isStale);
    }
  };

  const XPBar = () => (
    <AnimeShow when={getShowBar() && !getFocus()}>
      <div class="absolute top-full right-0 mt-1 w-full">
        <div class="text-[0.5em]">
          <Bar
            fill="main"
            bg="sub-alt"
            percent={getBarPercent()}
            animationDuration={getBarAnimationDuration()}
            animationEase={getBarAnimationEase()}
          />
        </div>
      </div>
    </AnimeShow>
  );

  const Total = () => (
    <AnimeShow when={getShowBar() && !getFocus()}>
      <Anime
        animation={flashAnimation()}
        class="w-max justify-self-end p-2 text-base font-bold text-main"
      >
        +{getTotal()}
      </Anime>
    </AnimeShow>
  );

  const Breakdown = () => (
    <AnimeShow when={getShowBreakdown() && !getFocus()} class="mb-2">
      <AnimePresence mode="list">
        <For each={getBreakdownItems()} fallback={null}>
          {(item) => (
            <Anime
              initial={{ opacity: 0, marginRight: 10 }}
              animate={{ opacity: 1, marginRight: 0, duration: 125 }}
              exit={{ opacity: 0, marginRight: 10, duration: 125 }}
              class="flex justify-end gap-4 px-2 text-xs"
            >
              <span class="w-max text-text">{item.label}</span>
              <span
                class={
                  typeof item.amount === "number" && item.amount < 0
                    ? "text-error"
                    : "text-main"
                }
              >
                {typeof item.amount === "string"
                  ? item.amount
                  : item.amount >= 0
                    ? `+${item.amount}`
                    : `${item.amount}`}
              </span>
            </Anime>
          )}
        </For>
      </AnimePresence>
    </AnimeShow>
  );

  const BlurredBackground = (props: ParentProps) => (
    <div class="absolute top-full right-0 mt-2 grid min-w-full justify-end rounded-b text-right text-sm backdrop-blur-sm">
      {props.children}
    </div>
  );

  return (
    <>
      <XPBar />
      <BlurredBackground>
        <Total />
        <Breakdown />
      </BlurredBackground>
    </>
  );
}
