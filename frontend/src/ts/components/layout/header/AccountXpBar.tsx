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
  const [getShowBar, setShowBar] = createSignal(false);
  const [getShowBreakdown, setShowBreakdown] = createSignal(false);
  const [getXpBreakdown, setXpBreakdown] = createSignal<XpBreakdown | null>(
    null,
  );
  const [displayTotal, setDisplayTotal] = createSignal(0);
  // const [breakdownItems, setBreakdownItems] = createSignal<BreakdownItem[]>([]);
  const [breakdownItems, setBreakdownItems] = createSignal<BreakdownItem[]>([
    {
      label: "time typing",
      amount: 100,
    },
    {
      label: "very long breakdown item",
      amount: 20,
    },
  ]);

  const flashAnimation = createMemo(() => {
    displayTotal(); // track dependency
    const rand = (Math.random() * 2 - 1) / 4;
    const rand2 = (Math.random() + 1) / 2;
    return {
      scale: [1 + 0.5 * rand2, 1],
      rotate: [10 * rand, 0],
      duration: 2000,
      ease: "out(5)",
    };
  });

  const flash = (total: number): void => {
    setDisplayTotal(total);
  };

  const addItem = (label: string, amount: number | string): void => {
    setBreakdownItems((items) => [...items, { label, amount }]);
  };

  createEffectOn(getShowBreakdown, (show) => {
    const breakdown = getXpBreakdown();
    if (!breakdown) return;
    if (show) {
      void runBreakdown(breakdown);
    }
  });

  const runBreakdown = async (breakdown: XpBreakdown): Promise<void> => {
    const delay = 500;
    setBreakdownItems([]);
    let total = breakdown.base ?? 0;
    setDisplayTotal(total);

    addItem("time typing", breakdown.base ?? 0);

    if (isSafeNumber(breakdown.fullAccuracy)) {
      await sleep(delay);
      total += breakdown.fullAccuracy;
      flash(total);
      addItem("perfect", breakdown.fullAccuracy);
    } else if (isSafeNumber(breakdown.corrected)) {
      await sleep(delay);
      total += breakdown.corrected;
      flash(total);
      addItem("clean", breakdown.corrected);
    }

    if (isSafeNumber(breakdown.quote)) {
      await sleep(delay);
      total += breakdown.quote;
      flash(total);
      addItem("quote", breakdown.quote);
    } else {
      if (isSafeNumber(breakdown.punctuation)) {
        await sleep(delay);
        total += breakdown.punctuation;
        flash(total);
        addItem("punctuation", breakdown.punctuation);
      }
      if (isSafeNumber(breakdown.numbers)) {
        await sleep(delay);
        total += breakdown.numbers;
        flash(total);
        addItem("numbers", breakdown.numbers);
      }
    }

    if (isSafeNumber(breakdown.funbox)) {
      await sleep(delay);
      total += breakdown.funbox;
      flash(total);
      addItem("funbox", breakdown.funbox);
    }

    if (isSafeNumber(breakdown.streak)) {
      await sleep(delay);
      total += breakdown.streak;
      flash(total);
      addItem("streak", breakdown.streak);
    }

    if (isSafeNumber(breakdown.accPenalty) && breakdown.accPenalty > 0) {
      await sleep(delay);
      total -= breakdown.accPenalty;
      flash(total);
      addItem("accuracy penalty", -breakdown.accPenalty);
    }

    if (isSafeNumber(breakdown.incomplete) && breakdown.incomplete > 0) {
      await sleep(delay);
      total += breakdown.incomplete;
      flash(total);
      addItem("incomplete tests", breakdown.incomplete);
    }

    if (isSafeNumber(breakdown.configMultiplier)) {
      await sleep(delay);
      total *= breakdown.configMultiplier;
      flash(total);
      addItem("global multiplier", `x${breakdown.configMultiplier}`);
    }

    if (isSafeNumber(breakdown.daily)) {
      await sleep(delay);
      total += breakdown.daily;
      flash(total);
      addItem("daily bonus", breakdown.daily);
    }

    await sleep(3000);

    setShowBreakdown(false);
    setShowBar(false);
  };

  return (
    <>
      <Button
        class="absolute -left-100"
        onClick={() => {
          setXpBreakdown({
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
            +{displayTotal()}
          </Anime>
          <AnimePresence mode="list">
            <For each={breakdownItems()} fallback={null}>
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
