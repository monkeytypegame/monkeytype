import { createSignal } from "solid-js";
import { createEvent } from "../hooks/createEvent";
import { XpBreakdown } from "@monkeytype/schemas/results";

export type XpBarData = {
  addedXp: number;
  resultingXp: number;
  breakdown?: XpBreakdown;
};

export const [getAnimatedLevel, setAnimatedLevel] = createSignal(0);
export const [getAccountButtonSpinner, setAccountButtonSpinner] =
  createSignal(false);
export const [getXpBarData, setXpBarData] = createSignal<XpBarData | null>(
  null,
);

export const skipBreakdownEvent = createEvent();
