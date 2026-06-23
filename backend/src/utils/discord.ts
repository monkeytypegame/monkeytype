import { isDevEnvironment } from "./misc";
import * as RedisClient from "../init/redis";
import { randomBytes } from "crypto";
import MonkeyError from "./error";
import { z } from "zod";
import { parseWithSchema as parseJsonWithSchema } from "@monkeytype/util/json";

const BASE_URL = "https://discord.com/api";
const CLIENT_ID = "798272335035498557";
const SERVER_ID = "713194177403420752";
const READ_ROLE_SCOPE = "guilds.members.read";

const DiscordIdAndAvatarSchema = z
  .object({
    id: z.string(),
    avatar: z
      .string()
      .optional()
      .or(z.null().transform(() => undefined)),
  })
  .strip();
type DiscordIdAndAvatar = z.infer<typeof DiscordIdAndAvatarSchema>;

const DiscordGuildMemberSchema = z
  .object({
    roles: z.array(z.string()),
  })
  .strip();

export async function getDiscordUser(
  tokenType: string,
  accessToken: string,
): Promise<DiscordIdAndAvatar> {
  const response = await fetch(`${BASE_URL}/users/@me`, {
    headers: {
      authorization: `${tokenType} ${accessToken}`,
    },
  });

  const parsed = parseJsonWithSchema(
    await response.text(),
    DiscordIdAndAvatarSchema,
  );

  return parsed;
}

export async function getDiscordRoleIds(
  tokenType: string,
  accessToken: string,
  scope?: string[],
): Promise<string[]> {
  if (!scope?.includes(READ_ROLE_SCOPE)) return [];

  const response = await fetch(
    `${BASE_URL}/users/@me/guilds/${SERVER_ID}/member`,
    {
      headers: {
        authorization: `${tokenType} ${accessToken}`,
      },
    },
  );

  const parsed = parseJsonWithSchema(
    await response.text(),
    DiscordGuildMemberSchema,
  );

  return parsed.roles;
}

export async function getOauthLink(
  uid: string,
  options: { includeRoles?: boolean },
): Promise<string> {
  const connection = RedisClient.getConnection();
  if (!connection) {
    throw new MonkeyError(500, "Redis connection not found");
  }
  const token = randomBytes(10).toString("hex");
  const scope = ["identify"];

  if (options.includeRoles) scope.push(READ_ROLE_SCOPE);

  //add the token uid pair to redis
  await connection.setex(`discordoauth:${uid}`, 60, token);

  return `${BASE_URL}/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${
    isDevEnvironment()
      ? `http%3A%2F%2Flocalhost%3A3000%2Fverify`
      : `https%3A%2F%2Fmonkeytype.com%2Fverify`
  }&response_type=token&scope=${scope.join("+")}&state=${token}`;
}

export async function iStateValidForUser(
  state: string,
  uid: string,
): Promise<boolean> {
  const connection = RedisClient.getConnection();
  if (!connection) {
    throw new MonkeyError(500, "Redis connection not found");
  }
  const redisToken = await connection.getdel(`discordoauth:${uid}`);

  return redisToken === state;
}
