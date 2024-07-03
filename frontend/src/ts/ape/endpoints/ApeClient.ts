import { AppRouter, initClient, type ApiFetcherArgs } from "@ts-rest/core";
import { Method } from "axios";
import { getIdToken } from "firebase/auth";
import { envConfig } from "../../constants/env-config";
import { getAuthenticatedUser, isAuthenticated } from "../../firebase";

function buildApi(timeout: number): (args: ApiFetcherArgs) => Promise<{
  status: number;
  body: unknown;
  headers: Headers;
}> {
  return async (args: ApiFetcherArgs) => {
    const token = isAuthenticated()
      ? await getIdToken(getAuthenticatedUser())
      : "";
    try {
      const result = await fetch(args.path, {
        signal: AbortSignal.timeout(timeout),
        method: args.method as Method,
        headers: {
          ...args.headers,
          Authorization: `Bearer ${token}`,
          "X-Client-Version": envConfig.clientVersion,
        },
        body: args.body,
      });

      return {
        status: result.status,
        body: await result.json(),
        headers: result.headers ?? new Headers(),
      };
    } catch (e: Error | unknown) {
      return {
        status: 500,
        body: { message: e },
        headers: new Headers(),
      };
    }
  };
}

/* eslint-disable @typescript-eslint/explicit-function-return-type */
export function buildClient<T extends AppRouter>(
  contract: T,
  baseUrl: string,
  timeout: number = 10_000
) {
  return initClient(contract, {
    baseUrl: baseUrl,
    jsonQuery: true,
    api: buildApi(timeout),
  });
}
/* eslint-enable @typescript-eslint/explicit-function-return-type */
