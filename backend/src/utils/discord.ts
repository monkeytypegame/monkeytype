import fetch from "node-fetch";
import { isDevEnvironment } from "./misc";
import * as RedisClient from "../init/redis";
import { randomBytes } from "crypto";
import MonkeyError from "./error";

const BASE_URL = "https://discord.com/api";

type DiscordUser = {
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
};

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

export async function getOauthLink(uid: string): Promise<string> {
  const connection = RedisClient.getConnection();
  if (!connection) {
    throw new MonkeyError(500, "Redis connection not found");
  }
  const token = randomBytes(10).toString("hex");

  //add the token uid pair to reids
  await connection.setex(`discordoauth:${uid}`, 60, token);

  return `${BASE_URL}/oauth2/authorize?client_id=798272335035498557&redirect_uri=${
    isDevEnvironment()
      ? `http%3A%2F%2Flocalhost%3A3000%2Fverify`
      : `https%3A%2F%2Fmonkeytype.com%2Fverify`
  }&response_type=token&scope=identify&state=${token}`;
}

export async function iStateValidForUser(
  state: string,
  uid: string
): Promise<boolean> {
  const connection = RedisClient.getConnection();
  if (!connection) {
    throw new MonkeyError(500, "Redis connection not found");
  }
  const redisToken = await connection.getdel(`discordoauth:${uid}`);

  return redisToken === state;
}
