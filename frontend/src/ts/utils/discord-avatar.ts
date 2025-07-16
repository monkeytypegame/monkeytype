const cachedAvatarUrlByAvatarId: Map<string, string | null> = new Map();

function buildElement(
  url: string | null,
  options?: { loading: boolean }
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
    element.style.backgroundImage = `url(${url})`;
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
  if (data.discordId === undefined || data.discordAvatar === undefined) {
    return buildElement(null);
  }

  const cachedUrl = cachedAvatarUrlByAvatarId.get(data.discordAvatar);

  if (cachedUrl !== undefined) {
    console.log("### cache hit", { data, cached: cachedUrl });
    return buildElement(cachedUrl);
  } else {
    //`<div class="avatarPlaceholder"><i class="fas fa-circle-notch fa-spin"></i></div>`;
    const element = buildElement(null, { loading: true });

    void getDiscordAvatarUrl({
      ...data,
      discordAvatarSize: options?.size,
    }).then((url) => {
      cachedAvatarUrlByAvatarId.set(data.discordAvatar as string, url);
      console.log("### callback", { data, url });
      if (url !== null) {
        element.classList.replace("avatarPlaceholder", "avatar");
        element.style.backgroundImage = `url(${url})`;
        element.innerHTML = "";
      }
    });

    return element;
  }
}

//TODO remove from misc
async function getDiscordAvatarUrl({
  discordId,
  discordAvatar,
  discordAvatarSize,
}: {
  discordId?: string;
  discordAvatar?: string;
  discordAvatarSize?: number;
}): Promise<string | null> {
  if (
    discordId === undefined ||
    discordId === "" ||
    discordAvatar === undefined ||
    discordAvatar === ""
  ) {
    return null;
  }
  // An invalid request to this URL will return a 404.
  try {
    const avatarUrl = `https://cdn.discordapp.com/avatars/${discordId}/${discordAvatar}.png?size=${
      discordAvatarSize ?? 32
    }`;

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
