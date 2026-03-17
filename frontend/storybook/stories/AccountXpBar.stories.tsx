import type { XpBreakdown } from "@monkeytype/schemas/results";

import preview from "#.storybook/preview";
import { onMount } from "solid-js";

import { AccountXpBar } from "../../src/ts/components/layout/header/AccountXpBar";
import { setXpBarData, setAnimatedLevel } from "../../src/ts/states/header";

const meta = preview.meta({
  title: "Layout/Header/AccountXpBar",
  component: AccountXpBar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
});

function XpBarStory(props: {
  level: number;
  addedXp: number;
  resultingXp: number;
  breakdown?: XpBreakdown;
}) {
  onMount(() => {
    setXpBarData(null);
    setAnimatedLevel(props.level);
    // Delay so the effect picks up the change
    setTimeout(() => {
      setXpBarData({
        addedXp: props.addedXp,
        resultingXp: props.resultingXp,
        breakdown: props.breakdown,
      });
    }, 1000);
  });

  return (
    <div class="relative">
      <div style="width: 150px;"></div>
      <AccountXpBar />
    </div>
  );
}

export const WithBreakdown = meta.story(() => (
  <XpBarStory
    level={1}
    addedXp={150}
    resultingXp={150}
    breakdown={{
      base: 80,
      fullAccuracy: 20,
      punctuation: 10,
      streak: 25,
      daily: 15,
    }}
  />
));

export const NoBreakdown = meta.story(() => (
  <XpBarStory level={1} addedXp={200} resultingXp={200} />
));
