const cachedAvatarUrlByAvatarId: Map<string, string | null> = new Map();

function buildElement(
  url: string | null,
  options?: { loading?: boolean; size?: number; userIcon?: string }
): HTMLElement {
  const avatar = document.createElement("div");
  avatar.classList.add("avatar");
  if (url === null) {
    if (options?.loading) {
      avatar.innerHTML = `<div class="avatarLoading"><i class="fas fa-circle-notch fa-spin"><i></div>`;
    } else {
      avatar.innerHTML = `<div class="userIcon"><i class="${
        options?.userIcon ?? "fas fa-user-circle"
      }"><i></div>`;
    }
  } else {
    avatar.innerHTML = `<div class="discordImage" style="background-image:url(${url}?size=${
      options?.size ?? 32
    })"></div>`;
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
