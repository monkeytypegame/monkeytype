/**
 * Replace font-awesome account icon with Discord avatar only if it loads successfully
 * https://stackoverflow.com/a/5058336/9080819
 * @param discordId Discord ID of the user
 * @param discordAvatar Discord Avatar ID of the user
 * @returns A promise that resolves to the avatar URL if it was loaded successfully, rejects otherwise.
 */
export const loadDiscordAvatar = async (
  discordId?: string,
  discordAvatar?: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!discordId || !discordAvatar) reject();

    const avatarUrl = `https://cdn.discordapp.com/avatars/${discordId}/${discordAvatar}`;

    $("<img/>")
      .attr("src", avatarUrl)
      .on("load", (event) => {
        $(event.currentTarget).remove();
        resolve(avatarUrl);
      })
      .on("error", () => reject());
  });
};
