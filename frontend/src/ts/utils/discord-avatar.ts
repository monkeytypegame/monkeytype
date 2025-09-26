import { addToGlobal } from "./global";

type Options = { size?: number; userIcon?: string };

const knownBadUrls = new Set();

function buildElement(url: string | null, options?: Options): HTMLElement {
  const avatar = document.createElement("div");
  avatar.classList.add("avatar");

  if (url === null || knownBadUrls.has(url)) {
    avatar.innerHTML = `<div class="userIcon"><i class="${
      options?.userIcon ?? "fas fa-user-circle"
    }"></i></div>`;
  } else {
    avatar.innerHTML = `
      <div class="loading"><i class="fas fa-circle-notch fa-spin"></i></div>
      <div class="discordImage">
        <img src="${url}?size=${options?.size ?? 32})"
        onload="onAvatarLoaded(this)" onerror="onAvatarError(this)"
        ></img>
      </div>`;
  }

  return avatar;
}

addToGlobal({
  onAvatarLoaded: (element: HTMLImageElement): void => {
    element.closest(".avatar")?.querySelector(".loading")?.remove();
  },
  onAvatarError: (element: HTMLImageElement): void => {
    knownBadUrls.add(element.src.split("?")[0]);
    element.closest(".avatar")?.replaceWith(buildElement(null));
  },
});

export function getAvatarElement(
  {
    discordId,
    discordAvatar,
  }: {
    discordId?: string;
    discordAvatar?: string;
  },
  options?: Options
): HTMLElement {
  if (
    discordId === undefined ||
    discordId === "" ||
    discordAvatar === undefined ||
    discordAvatar === ""
  ) {
    return buildElement(null, options);
  }

  const element = buildElement(
    `https://cdn.discordapp.com/avatars/${discordId}/${discordAvatar}.png`,
    options
  );

  return element;
}
