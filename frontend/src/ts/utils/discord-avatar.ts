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
  data: {
    discordId?: string;
    discordAvatar?: string;
  },
  options?: {
    size?: number;
  }
): HTMLElement {
  if (
    data.discordId === undefined ||
    data.discordId === "" ||
    data.discordAvatar === undefined ||
    data.discordAvatar === ""
  ) {
    return buildElement(null);
  }

  const discordId: string = data.discordId;
  const discordAvatar: string = data.discordAvatar;
  const cachedUrl = cachedAvatarUrlByAvatarId.get(data.discordAvatar);

  if (cachedUrl !== undefined) {
    console.log("### cache hit", { data, cached: cachedUrl });
    return buildElement(cachedUrl);
  } else {
    const element = buildElement(null, { loading: true });

    void getDiscordAvatarUrl({ discordId, discordAvatar }).then((url) => {
      cachedAvatarUrlByAvatarId.set(data.discordAvatar as string, url);
      console.log("### callback", { data, url });
      if (url !== null) {
        element.replaceWith(buildElement(url, { size: options?.size ?? 32 }));
      }
    });

    return element;
  }
}

//TODO remove from misc
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

    const response = await fetch(avatarUrl, {
      method: "HEAD",
    });
    if (!response.ok) {
      return null;
    }

    return avatarUrl;
  } catch (error) {}

  return null;
}
