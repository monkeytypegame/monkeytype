const badges: MonkeyTypes.UserBadge[] = [
  {
    id: 1,
    name: "Developer",
    description: "I made this",
    icon: "fa-rocket",
    color: "white",
    customStyle: "animation: rgb-bg 10s linear infinite;",
  },
  {
    id: 2,
    name: "Collaborator",
    description: "I helped make this",
    icon: "fa-code",
    color: "white",
    customStyle: "animation: rgb-bg 10s linear infinite;",
  },
  {
    id: 3,
    name: "Discord Mod",
    description: "Discord server moderator",
    icon: "fa-hammer",
    color: "white",
    customStyle: "animation: rgb-bg 10s linear infinite;",
  },
  {
    id: 4,
    name: "OG Account",
    description: "First 100 users on the site",
    icon: "fa-baby",
    color: "var(--bg-color)",
    background: "var(--main-color)",
  },
  {
    id: 5,
    name: "OG Discordian",
    description: "First 100 Discord server members",
    icon: "fa-baby",
    color: "var(--bg-color)",
    background: "var(--main-color)",
  },
];

export function getById(id: number): MonkeyTypes.UserBadge | undefined {
  return badges.find((b) => b.id === id);
}

export function getHTMLById(id: number): string {
  const badge = getById(id);
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
  return `<div class="badge" aria-label="${
    badge.description
  }" data-balloon-pos="right" style="${style}">${
    badge.icon ? `<i class="fas ${badge.icon}"></i>` : ""
  }<div class="text">${badge.name}</div></div>`;
}
