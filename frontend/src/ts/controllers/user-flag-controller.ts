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

const USER_FLAG_OPTIONS_DEFAULT: UserFlagOptions = {
  iconsOnly: false,
};

export function getMatchingFlags(source: SupportsFlags): UserFlag[] {
  const result = flags.filter((it) => it.test(source));
  return result;
}
function toHtml(flag: UserFlag, formatOptions: UserFlagOptions): string {
  const icon = `<i class="fas ${flag.icon}"></i>`;

  if (formatOptions.iconsOnly) {
    return icon;
  }

  const style = [];
  if (flag.background !== undefined) {
    style.push(`background: ${flag.background};`);
  }
  if (flag?.color !== undefined) {
    style.push(`color: ${flag.color};`);
  }

  const balloon = `aria-label="${flag.description}" data-balloon-pos="right"`;

  return `<div class="flag" ${balloon} style="${style.join("")}">${icon}</div>`;
}

export function getHtmlByUserFlags(
  source: SupportsFlags,
  options?: UserFlagOptions,
): string {
  const formatOptions = { ...USER_FLAG_OPTIONS_DEFAULT, ...options };
  return getMatchingFlags(source)
    .map((it) => toHtml(it, formatOptions))
    .join("");
}
