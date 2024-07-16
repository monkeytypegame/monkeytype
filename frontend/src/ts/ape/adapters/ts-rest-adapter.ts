import { AppRouter, initClient, type ApiFetcherArgs } from "@ts-rest/core";
import { Method } from "axios";
import { getIdToken } from "firebase/auth";
import { envConfig } from "../../constants/env-config";
import { getAuthenticatedUser, isAuthenticated } from "../../firebase";
import type { EndpointMetadata } from "shared/schemas/api";

function buildApi(timeout: number): (args: ApiFetcherArgs) => Promise<{
  status: number;
  body: unknown;
  headers: Headers;
}> {
  return async (request: ApiFetcherArgs) => {
    const isPublicEndpoint =
      (request.route.metadata as EndpointMetadata | undefined)
        ?.authenticationOptions?.isPublic ?? false;

    try {
      const headers: HeadersInit = {
        ...request.headers,
        "X-Client-Version": envConfig.clientVersion,
      };
      if (!isPublicEndpoint) {
        const token = isAuthenticated()
          ? await getIdToken(getAuthenticatedUser())
          : "";

        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await fetch(request.path, {
        signal: AbortSignal.timeout(timeout),
        method: request.method as Method,
        headers,
        body: request.body,
      });
      const body = await response.json();
      if (response.status >= 400) {
        console.error(`${request.method} ${request.path} failed`, {
          status: response.status,
          ...body,
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
    baseHeaders: {
      Accept: "application/json",
    },
  });
}
/* eslint-enable @typescript-eslint/explicit-function-return-type */
