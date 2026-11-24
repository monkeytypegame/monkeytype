import { FaSolidIcon } from "../types/font-awesome";

const flags: UserFlag[] = [
  {
    name: "Prime Ape",
    description: "Paying for a monthly subscription",
    icon: "fa-dollar-sign",
    test: (it) => it.isPremium === true,
  },
  {
    name: "Banned",
    description: "This account is banned",
    icon: "fa-gavel",
    color: "var(--error-color)",
    test: (it) => it.banned === true,
  },
  {
    name: "LbOptOut",
    description: "This account has opted out of leaderboards",
    icon: "fa-crown",
    color: "var(--error-color)",
    test: (it) => it.lbOptOut === true,
  },
  {
    name: "Friend",
    description: "Friend :)",
    icon: "fa-user-friends",
    test: (it) => it.isFriend === true,
  },
];

export type SupportsFlags = {
  isPremium?: boolean;
  banned?: boolean;
  lbOptOut?: boolean;
  isFriend?: boolean;
};

export type UserFlag = {
  readonly name: string;
  readonly description: string;
  readonly icon: FaSolidIcon;
  readonly color?: string;
  readonly background?: string;
  test(source: SupportsFlags): boolean;
};

export type UserFlagOptions = {
  iconsOnly?: boolean;
  isFriend?: boolean;
};

export function getMatchingFlags(source: SupportsFlags): UserFlag[] {
  const result = flags.filter((it) => it.test(source));
  return result;
}
