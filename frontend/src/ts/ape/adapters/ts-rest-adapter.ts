import {
  AppRouter,
  initClient,
  tsRestFetchApi,
  type ApiFetcherArgs,
} from "@ts-rest/core";
import { getIdToken } from "firebase/auth";
import { envConfig } from "../../constants/env-config";
import { getAuthenticatedUser, isAuthenticated } from "../../firebase";
import { ZodError } from "zod";

function timeoutSignal(ms: number): AbortSignal {
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(new Error("request timed out")), ms);
  return ctrl.signal;
}

function buildApi(timeout: number): (args: ApiFetcherArgs) => Promise<{
  status: number;
  body: unknown;
  headers: Headers;
}> {
  return async (request: ApiFetcherArgs) => {
    try {
      const headers: HeadersInit = {
        ...request.headers,
        "X-Client-Version": envConfig.clientVersion,
      };

      if (isAuthenticated()) {
        const token = await getIdToken(getAuthenticatedUser());
        headers["Authorization"] = `Bearer ${token}`;
      }

      const usePolyfill = AbortSignal?.timeout === undefined;
      const fetchOptions: RequestInit = {
        method: request.method,
        headers,
        body: request.body,
        signal: usePolyfill
          ? timeoutSignal(timeout)
          : AbortSignal.timeout(timeout),
      };

      const response = await tsRestFetchApi({
        ...request,
        headers,
        fetchOptions: fetchOptions,
      });

      console.log("## res", { response });

      const body = response.body as object;
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
    } catch (e: Error | ZodError | unknown) {
      console.log("### err", e);
      if (e instanceof ZodError) {
        console.log("### zod error", e);
      }
      let message = "Unknown error";

      if (e instanceof Error) {
        if (e.message.includes("timed out")) {
          message = "request took too long to complete";
        } else {
          message = e.message;
        }
      }

      return {
        status: 500,
        body: { message },
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
    validateResponse: true,
  });
}
/* eslint-enable @typescript-eslint/explicit-function-return-type */
