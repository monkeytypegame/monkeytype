import { JSX } from "solid-js/jsx-runtime";
import { FaSolidIcon } from "../types/font-awesome";

export type UserBadge = {
  id: number;
  name: string;
  description: string;
  icon?: FaSolidIcon;
  background?: string;
  color?: string;
  customStyle?: JSX.CSSProperties;
};

export const badges: Record<number, UserBadge> = {
  1: {
    id: 1,
    name: "Developer",
    description: "I made this",
    icon: "fa-laptop",
    color: "white",
    customStyle: {
      animation: "rgb-bg 10s linear infinite",
      background:
        "linear-gradient(45deg in hsl longer hue, hsl(330, 90%, 30%) 0%, hsl(250, 90%, 30%) 100%)",
    },
  },
  2: {
    id: 2,
    name: "Collaborator",
    description: "I helped make this",
    icon: "fa-code",
    color: "white",
    customStyle: {
      animation: "rgb-bg 10s linear infinite",
      background:
        "linear-gradient(45deg in hsl longer hue, hsl(330, 90%, 30%) 0%, hsl(250, 90%, 30%) 100%)",
    },
  },
  3: {
    id: 3,
    name: "Server Mod",
    description: "Discord server moderator",
    icon: "fa-hammer",
    color: "white",
    customStyle: {
      animation: "rgb-bg 10s linear infinite",
      background:
        "linear-gradient(45deg in hsl longer hue, hsl(330, 90%, 30%) 0%, hsl(250, 90%, 30%) 100%)",
    },
  },
  4: {
    id: 4,
    name: "OG Account",
    description: "First 1000 users on the site",
    icon: "fa-baby",
    color: "var(--bg-color)",
    background: "var(--main-color)",
  },
  5: {
    id: 5,
    name: "OG Discordian",
    description: "First 1000 Discord server members",
    icon: "fa-baby",
    color: "var(--bg-color)",
    background: "var(--main-color)",
  },
  6: {
    id: 6,
    name: "Supporter",
    description: "Donated money",
    icon: "fa-heart",
    color: "var(--text-color)",
    background: "var(--sub-color)",
  },
  7: {
    id: 7,
    name: "Sugar Daddy",
    description: "Donated a lot of money",
    icon: "fa-gem",
    color: "var(--bg-color)",
    background: "var(--main-color)",
  },
  8: {
    id: 8,
    name: "Monkey Supporter",
    description: "Donated more money",
    icon: "fa-heart",
    color: "var(--bg-color)",
    background: "var(--main-color)",
  },
  9: {
    id: 9,
    name: "White Hat",
    description: "Reported critical vulnerabilities on the site",
    icon: "fa-user-secret",
    color: "var(--bg-color)",
    background: "var(--main-color)",
  },
  10: {
    id: 10,
    name: "Bug Hunter",
    description: "Reported or helped track down bugs on the site",
    icon: "fa-bug",
    color: "var(--text-color)",
    background: "var(--sub-color)",
  },
  11: {
    id: 11,
    name: "Content Creator",
    description: "Verified content creator",
    icon: "fa-video",
    color: "var(--text-color)",
    background: "var(--sub-color)",
  },
  12: {
    id: 12,
    name: "Contributor",
    description: "Contributed to the site",
    icon: "fa-hands-helping",
    color: "var(--text-color)",
    background: "var(--sub-color)",
  },
  13: {
    id: 13,
    name: "Mythical",
    description: "Yes, I'm actually this fast",
    icon: "fa-rocket",
    color: "white",
    customStyle: {
      animation: "rgb-bg 10s linear infinite",
      background:
        "linear-gradient(45deg in hsl longer hue, hsl(330, 90%, 30%) 0%, hsl(250, 90%, 30%) 100%)",
    },
  },
  14: {
    id: 14,
    name: "All Year Long",
    description: "Reached a streak of 365 days",
    icon: "fa-fire",
    color: "var(--bg-color)",
    background: "var(--main-color)",
  },
  15: {
    id: 15,
    name: "Insane",
    description: "I typed for 69 hours straight",
    icon: "fa-bomb",
    color: "white",
    background: "#093d79",
    customStyle: {
      animation: "gold-shimmer 10s cubic-bezier(0.5, 0, 0.5, 1) infinite",
      background:
        "linear-gradient(90deg, rgb(8 31 84) 0%, rgb(18 134 158) 100%)",
      "background-size": "200% 200%",
    },
  },
  16: {
    id: 16,
    name: "Perfection",
    description: "Longest test with zero mistakes - 4 hours and 1 minute",
    icon: "fa-bullseye",
    color: "white",
    customStyle: {
      animation:
        "gold-shimmer 10s cubic-bezier(0.5, -0.15, 0.5, 1.15) infinite",
      background:
        "linear-gradient(45deg, #b8860b 0%, #daa520 25%, #ffd700 50%, #daa520 75%, #b8860b 100%)",
      "background-size": "200% 200%",
    },
  },
  17: {
    id: 17,
    name: "Phineas",
    description: "Ferb, I know what we're gonna do today...",
    icon: "fa-sun",
    color: "white",
    customStyle: {
      animation: "rgb-bg 10s linear infinite",
      background:
        "linear-gradient(45deg in hsl longer hue, hsl(330, 90%, 30%) 0%, hsl(250, 90%, 30%) 100%)",
    },
  },
};

export function getHTMLById(
  id: number,
  noText = false,
  noBalloon = false,
  showUnknown = false,
): string {
  const badge = badges[id] as UserBadge | undefined;

  if (!badge && !showUnknown) {
    return "";
  }

  let style = "";
  if (badge?.background !== undefined) {
    style += `background: ${badge.background};`;
  }
  if (badge?.color !== undefined) {
    style += `color: ${badge.color};`;
  }
  if (badge?.customStyle !== undefined) {
    style += Object.entries(badge.customStyle)
      .map(([key, value]) => `${key}: ${value};`)
      .join(";");
  }

  const badgeName = badge?.name ?? "Badge Name Missing";
  const badgeDescription = badge?.description ?? "Badge Description Missing";

  const balloonText = (noText ? badgeName + ": " : "") + badgeDescription;

  let balloon = "";
  if (!noBalloon) {
    balloon = `aria-label="${balloonText}" data-balloon-pos="right"`;
  }

  let icon = "";
  if (badge?.icon !== undefined) {
    icon = `<i class="fas ${noText ? "fa-fw" : ""} ${badge.icon}"></i>`;
  } else {
    icon = `<i class="fas fa-question"></i>`;
  }

  const text = `<div class="text">${badgeName}</div>`;

  return `<div class="badge" ${balloon} style="${style}">${icon}${
    noText ? "" : text
  }</div>`;
}

export function getById(id: number): UserBadge | undefined {
  return badges[id];
}
