import { XpBreakdown } from "@monkeytype/schemas/results";
import { createSignal } from "solid-js";

export type XpBarData = {
  addedXp: number;
  resultingXp: number;
  breakdown?: XpBreakdown;
};

export const [getXpBarData, setXpBarData] = createSignal<XpBarData | null>(
  null,
);
