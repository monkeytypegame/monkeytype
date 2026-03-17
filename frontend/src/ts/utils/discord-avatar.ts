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
    const loading = document.createElement("div");
    loading.className = "loading";
    loading.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';

    const imageContainer = document.createElement("div");
    imageContainer.className = "discordImage";

    const img = document.createElement("img");
    img.src = `${url}?size=${options?.size ?? 32}`;

    // Add event listeners directly to the img element
    img.addEventListener("load", async () => {
      loading.remove();
    });

    img.addEventListener("error", () => {
      knownBadUrls.add(url);
      avatar.replaceWith(buildElement(null, options));
    });

    imageContainer.appendChild(img);
    avatar.appendChild(loading);
    avatar.appendChild(imageContainer);
  }

  return avatar;
}

export function getAvatarElement(
  {
    discordId,
    discordAvatar,
  }: {
    discordId?: string;
    discordAvatar?: string;
  },
  options?: Options,
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
    options,
  );

  return element;
}
