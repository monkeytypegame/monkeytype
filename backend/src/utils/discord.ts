import fetch from "node-fetch";
import { isDevEnvironment } from "./misc";

const BASE_URL = "https://discord.com/api";

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar?: string;
  bot?: boolean;
  system?: boolean;
  mfa_enabled?: boolean;
  banner?: string;
  accent_color?: number;
  locale?: string;
  verified?: boolean;
  email?: string;
  flags?: number;
  premium_type?: number;
  public_flags?: number;
}

export async function getDiscordUser(
  tokenType: string,
  accessToken: string
): Promise<DiscordUser> {
  const response = await fetch(`${BASE_URL}/users/@me`, {
    headers: {
      authorization: `${tokenType} ${accessToken}`,
    },
  });

  return (await response.json()) as DiscordUser;
}

export function getOauthLink(): string {
  return `${BASE_URL}/oauth2/authorize?client_id=798272335035498557&redirect_uri=${
    isDevEnvironment()
      ? `http%3A%2F%2Flocalhost%3A3000%2Fverify`
      : `https%3A%2F%2Fmonkeytype.com%2Fverify`
  }&response_type=token&scope=identify`;
}
