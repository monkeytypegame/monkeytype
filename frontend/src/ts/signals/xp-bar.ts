import { XpBreakdown } from "@monkeytype/schemas/results";
import { createSignal } from "solid-js";
import { createEvent } from "../hooks/createEvent";

export type XpBarData = {
  addedXp: number;
  resultingXp: number;
  breakdown?: XpBreakdown;
};

export const [getXpBarData, setXpBarData] = createSignal<XpBarData | null>(
  null,
);

export const [getSkipBreakdownEvent, skipBreakdown] = createEvent();
