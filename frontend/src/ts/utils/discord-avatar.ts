const cachedAvatarUrlByAvatarId: Map<string, string | null> = new Map();

function buildElement(
  url: string | null,
  options?: { loading?: boolean; size?: number }
): HTMLElement {
  if (url === null) {
    const placeholder = document.createElement("div");
    placeholder.classList.add("avatarPlaceholder");
    placeholder.innerHTML = `<i class="fas ${
      options?.loading === true ? "fa-circle-notch fa-spin" : "fa-user-circle"
    }"></i>`;
    return placeholder;
  } else {
    const element = document.createElement("div");
    element.classList.add("avatar");
    element.style.backgroundImage = `url(${url}?size=${options?.size ?? 32})`;
    return element;
  }
}

export function getAvatarElement(
  {
    discordId,
    discordAvatar,
  }: {
    discordId?: string;
    discordAvatar?: string;
  },
  options?: {
    size?: number;
  }
): HTMLElement {
  if (
    discordId === undefined ||
    discordId === "" ||
    discordAvatar === undefined ||
    discordAvatar === ""
  ) {
    return buildElement(null);
  }

  const cachedUrl = cachedAvatarUrlByAvatarId.get(discordAvatar);

  if (cachedUrl !== undefined) {
    return buildElement(cachedUrl, options);
  } else {
    const element = buildElement(null, { loading: true });

    void getDiscordAvatarUrl({ discordId, discordAvatar }).then((url) => {
      cachedAvatarUrlByAvatarId.set(discordAvatar, url);
      element.replaceWith(buildElement(url, options));
    });

    return element;
  }
}

async function getDiscordAvatarUrl({
  discordId,
  discordAvatar,
}: {
  discordId: string;
  discordAvatar: string;
}): Promise<string | null> {
  // An invalid request to this URL will return a 404.
  try {
    const avatarUrl = `https://cdn.discordapp.com/avatars/${discordId}/${discordAvatar}.png`;

    const response = await fetch(avatarUrl, { method: "HEAD" });
    if (!response.ok) {
      return null;
    }

    return avatarUrl;
  } catch (error) {}

  return null;
}
