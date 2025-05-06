import {
  AppRouter,
  initClient,
  tsRestFetchApi,
  type ApiFetcherArgs,
} from "@ts-rest/core";
import { getIdToken } from "firebase/auth";
import { envConfig } from "../../constants/env-config";
import { getAuthenticatedUser, isAuthenticated } from "../../firebase";
import {
  COMPATIBILITY_CHECK,
  COMPATIBILITY_CHECK_HEADER,
} from "@monkeytype/contracts";
import * as Notifications from "../../elements/notifications";

let bannerShownThisSession = false;

export let lastSeenServerCompatibility: number | undefined;

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
      if (isAuthenticated()) {
        const token = await getIdToken(getAuthenticatedUser());
        request.headers["Authorization"] = `Bearer ${token}`;
      }

      const usePolyfill = AbortSignal?.timeout === undefined;

      request.fetchOptions = {
        ...request.fetchOptions,
        signal: usePolyfill
          ? timeoutSignal(timeout)
          : AbortSignal.timeout(timeout),
      };
      const response = await tsRestFetchApi(request);
      if (response.status >= 400) {
        console.error(`${request.method} ${request.path} failed`, {
          status: response.status,
          ...(response.body as object),
        });
      }

      const compatibilityCheckHeader = response.headers.get(
        COMPATIBILITY_CHECK_HEADER
      );

      if (compatibilityCheckHeader !== null) {
        lastSeenServerCompatibility = parseInt(compatibilityCheckHeader);
      }

      if (compatibilityCheckHeader !== null && !bannerShownThisSession) {
        const backendCheck = parseInt(compatibilityCheckHeader);
        if (backendCheck !== COMPATIBILITY_CHECK) {
          const message =
            backendCheck > COMPATIBILITY_CHECK
              ? `Looks like the client and server versions are mismatched (backend is newer). Please <a onClick="location.reload(true)">refresh</a> the page.`
              : `Looks like our monkeys didn't deploy the new server version correctly. If this message persists contact support.`;
          Notifications.addPSA(message, 1, undefined, false, undefined, true);
          bannerShownThisSession = true;
        }
      }

      return response;
    } catch (e: Error | unknown) {
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
      "X-Client-Version": envConfig.clientVersion,
    },
  });
}
/* eslint-enable @typescript-eslint/explicit-function-return-type */
