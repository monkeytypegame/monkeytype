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
  return async (request: ApiFetcherArgs) => {
    const token = isAuthenticated()
      ? await getIdToken(getAuthenticatedUser())
      : "";
    try {
      const response = await fetch(request.path, {
        signal: AbortSignal.timeout(timeout),
        method: request.method as Method,
        headers: {
          ...request.headers,
          Authorization: `Bearer ${token}`,
          "X-Client-Version": envConfig.clientVersion,
        },
        body: request.body,
      });
      const body = await response.json();
      if (response.status == 422) {
        console.log(`Client call ${request.method} ${request.path} failed: `, {
          status: response.status,
          message: body.message,
          validationErrors: body.validationErrors,
        });
      }

      return {
        status: response.status,
        body,
        headers: response.headers ?? new Headers(),
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
