const badges: Record<number, MonkeyTypes.UserBadge> = {
  1: {
    id: 1,
    name: "Developer",
    description: "I made this",
    icon: "fa-laptop-code",
    color: "white",
    customStyle: "animation: rgb-bg 10s linear infinite;",
  },
  2: {
    id: 2,
    name: "Collaborator",
    description: "I helped make this",
    icon: "fa-code",
    color: "white",
    customStyle: "animation: rgb-bg 10s linear infinite;",
  },
  3: {
    id: 3,
    name: "Server Mod",
    description: "Discord server moderator",
    icon: "fa-hammer",
    color: "white",
    customStyle: "animation: rgb-bg 10s linear infinite;",
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
    description: "Reported bugs on the site",
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
    customStyle: "animation: rgb-bg 10s linear infinite;",
  },
};

export function getHTMLById(
  id: number,
  noText = false,
  noBalloon = false
): string {
  const badge = badges[id];
  if (!badge) {
    return "";
  }
  let style = "";
  if (badge.background) {
    style += `background: ${badge.background};`;
  }
  if (badge.color) {
    style += `color: ${badge.color};`;
  }
  if (badge.customStyle) {
    style += badge.customStyle;
  }

  const balloonText = (noText ? badge.name + ": " : "") + badge.description;

  let balloon = "";
  if (!noBalloon) {
    balloon = `aria-label="${balloonText}" data-balloon-pos="right"`;
  }

  return `<div class="badge" ${balloon} style="${style}">${
    badge.icon ? `<i class="fas ${badge.icon}"></i>` : ""
  }${noText ? "" : `<div class="text">${badge.name}</div>`}</div>`;
}

export function getById(id: number): MonkeyTypes.UserBadge {
  return badges[id];
}
