import { XpBreakdown } from "@monkeytype/schemas/results";
import { isSafeNumber } from "@monkeytype/util/numbers";
import { createMemo, createSignal, For, JSXElement } from "solid-js";

import { createEffectOn } from "../../../hooks/effects";
import { sleep } from "../../../utils/misc";
import { Anime, AnimePresence, AnimeShow } from "../../common/anime";
import { Bar } from "../../common/Bar";
import { Button } from "../../common/Button";

type BreakdownItem = {
  label: string;
  amount: number | string;
};

type Props = {
  percent: number;
};

export function AccountXpBar(props: Props): JSXElement {
  const [getXpBreakdownData, setXpBreakdownData] =
    createSignal<XpBreakdown | null>(null);

  const [getShowBar, setShowBar] = createSignal(false);
  const [getShowBreakdown, setShowBreakdown] = createSignal(false);
  const [getTotal, setTotal] = createSignal(0);
  const [getBreakdownItems, setBreakdownItems] = createSignal<BreakdownItem[]>(
    [],
  );

  let skipped = false;

  const flashAnimation = createMemo(() => {
    getTotal(); // track dependency
    const rand = (Math.random() * 2 - 1) / 4;
    const rand2 = (Math.random() + 1) / 2;
    return {
      scale: [1 + 0.5 * rand2, 1],
      rotate: [10 * rand, 0],
      duration: 2000,
      ease: "out(5)",
    };
  });

  const addItem = (label: string, amount: number | string): void => {
    setBreakdownItems((items) => [...items, { label, amount }]);
  };

  const skipBreakdown = async (): Promise<void> => {
    const breakdown = getXpBreakdownData();
    if (!getShowBreakdown() || !breakdown) return;

    skipped = true;
    setBreakdownItems([]);
    const total = Object.values(breakdown).reduce((sum, val) => {
      if (isSafeNumber(val)) return sum + val;
      return sum;
    }, 0);
    setTotal(total);
    await sleep(3000);
    setShowBar(false);
    setShowBreakdown(false);
  };

  createEffectOn(getShowBreakdown, (show) => {
    const breakdown = getXpBreakdownData();
    if (!breakdown) return;
    if (show) {
      void runBreakdown(breakdown);
    }
  });

  const runBreakdown = async (breakdown: XpBreakdown): Promise<void> => {
    const delay = 500;
    skipped = false;
    setBreakdownItems([]);
    let total = breakdown.base ?? 0;
    setTotal(total);

    addItem("time typing", breakdown.base ?? 0);

    if (isSafeNumber(breakdown.fullAccuracy)) {
      await sleep(delay);
      if (skipped) return;
      total += breakdown.fullAccuracy;
      setTotal(total);
      addItem("perfect", breakdown.fullAccuracy);
    } else if (isSafeNumber(breakdown.corrected)) {
      await sleep(delay);
      if (skipped) return;
      total += breakdown.corrected;
      setTotal(total);
      addItem("clean", breakdown.corrected);
    }

    if (isSafeNumber(breakdown.quote)) {
      await sleep(delay);
      if (skipped) return;
      total += breakdown.quote;
      setTotal(total);
      addItem("quote", breakdown.quote);
    } else {
      if (isSafeNumber(breakdown.punctuation)) {
        await sleep(delay);
        if (skipped) return;
        total += breakdown.punctuation;
        setTotal(total);
        addItem("punctuation", breakdown.punctuation);
      }
      if (isSafeNumber(breakdown.numbers)) {
        await sleep(delay);
        if (skipped) return;
        total += breakdown.numbers;
        setTotal(total);
        addItem("numbers", breakdown.numbers);
      }
    }

    if (isSafeNumber(breakdown.funbox)) {
      await sleep(delay);
      if (skipped) return;
      total += breakdown.funbox;
      setTotal(total);
      addItem("funbox", breakdown.funbox);
    }

    if (isSafeNumber(breakdown.streak)) {
      await sleep(delay);
      if (skipped) return;
      total += breakdown.streak;
      setTotal(total);
      addItem("streak", breakdown.streak);
    }

    if (isSafeNumber(breakdown.accPenalty) && breakdown.accPenalty > 0) {
      await sleep(delay);
      if (skipped) return;
      total -= breakdown.accPenalty;
      setTotal(total);
      addItem("accuracy penalty", -breakdown.accPenalty);
    }

    if (isSafeNumber(breakdown.incomplete) && breakdown.incomplete > 0) {
      await sleep(delay);
      if (skipped) return;
      total += breakdown.incomplete;
      setTotal(total);
      addItem("incomplete tests", breakdown.incomplete);
    }

    if (isSafeNumber(breakdown.configMultiplier)) {
      await sleep(delay);
      if (skipped) return;
      total *= breakdown.configMultiplier;
      setTotal(total);
      addItem("global multiplier", `x${breakdown.configMultiplier}`);
    }

    if (isSafeNumber(breakdown.daily)) {
      await sleep(delay);
      if (skipped) return;
      total += breakdown.daily;
      setTotal(total);
      addItem("daily bonus", breakdown.daily);
    }

    await sleep(3000);
    if (skipped) return;

    setShowBreakdown(false);
    setShowBar(false);
  };

  return (
    <>
      <Button
        class="absolute -left-100"
        onClick={() => {
          setXpBreakdownData({
            base: 100,
            fullAccuracy: 20,
            quote: 10,
            corrected: 5,
            punctuation: 5,
            numbers: 5,
            funbox: 5,
            streak: 10,
            incomplete: 10,
            daily: 20,
            accPenalty: 5,
            configMultiplier: 2,
          });
          setShowBreakdown(true);
          setShowBar(true);
        }}
        text="XP Breakdown"
      />
      <Button
        class="absolute -left-60"
        onClick={skipBreakdown}
        text="Skip breakdown"
      />
      <AnimeShow when={getShowBar()}>
        <div class="absolute top-full right-0 mt-1 w-full">
          <div class="text-[0.5em]">
            <Bar fill="main" bg="sub-alt" percent={props.percent} />
          </div>
        </div>
      </AnimeShow>
      <AnimeShow when={getShowBreakdown()}>
        <div class="absolute top-full right-0 mt-2 grid justify-end p-1 text-right text-sm backdrop-blur-sm">
          <Anime
            animation={flashAnimation()}
            class="w-max justify-self-end py-2 text-base font-bold text-main"
          >
            +{getTotal()}
          </Anime>
          <AnimePresence mode="list">
            <For each={getBreakdownItems()} fallback={null}>
              {(item) => (
                <Anime
                  initial={{ opacity: 0, marginLeft: -25 }}
                  animate={{ opacity: 1, marginLeft: 25, duration: 125 }}
                  exit={{ opacity: 0, marginLeft: -25, duration: 125 }}
                  class="flex justify-end gap-4 text-xs"
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
        </div>
      </AnimeShow>
    </>
  );
}
