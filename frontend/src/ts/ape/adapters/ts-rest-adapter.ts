import {
  AppRouter,
  initClient,
  tsRestFetchApi,
  type ApiFetcherArgs,
} from "@ts-rest/core";
import { envConfig } from "virtual:env-config";
import { getIdToken } from "../../firebase";
import {
  COMPATIBILITY_CHECK,
  COMPATIBILITY_CHECK_HEADER,
} from "@monkeytype/contracts";
import { addBanner } from "../../states/banners";

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
      const token = await getIdToken();
      if (token !== null) {
        request.headers["Authorization"] = `Bearer ${token}`;
      }

      const usePolyfill = AbortSignal?.timeout === undefined;

      request.fetchOptions = {
        ...request.fetchOptions,
        signal: usePolyfill
          ? timeoutSignal(timeout)
          : AbortSignal.timeout(timeout),
      };

      if (
        request.body !== null &&
        request.body !== undefined &&
        request.contentType === "application/json"
      ) {
        console.log("###", request);
        const enc = new TextDecoder("utf-8");
        const compressed = await gzipJson(request.body);
        request.body = undefined;
        request.rawBody = compressed;
        request.headers["Content-Encoding"] = "gzip";
        request.contentType = "application/gzip";
        console.log("### done compression", request.body);
      }
      const response = await tsRestFetchApi(request);
      if (response.status >= 400) {
        console.error(`${request.method} ${request.path} failed`, {
          status: response.status,
          ...(response.body as object),
        });
      }

      const compatibilityCheckHeader = response.headers.get(
        COMPATIBILITY_CHECK_HEADER,
      );

      if (compatibilityCheckHeader !== null) {
        lastSeenServerCompatibility = parseInt(compatibilityCheckHeader);
      }

      if (compatibilityCheckHeader !== null && !bannerShownThisSession) {
        const backendCheck = parseInt(compatibilityCheckHeader);
        if (backendCheck !== COMPATIBILITY_CHECK) {
          const message =
            backendCheck > COMPATIBILITY_CHECK
              ? `Looks like the client and server versions are mismatched (backend is newer). Please refresh the page.`
              : `Looks like our monkeys didn't deploy the new server version correctly. If this message persists contact support.`;
          addBanner({
            level: "error",
            text: message,
          });
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

// oxlint-disable-next-line explicit-function-return-type
export function buildClient<T extends AppRouter>(
  contract: T,
  baseUrl: string,
  timeout: number = 10_000,
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

async function gzipJson(data: unknown): Promise<Uint8Array> {
  const json = JSON.stringify(data);

  const stream = new Blob([json])
    .stream()
    .pipeThrough(new CompressionStream("gzip"));

  const compressed = await new Response(stream).arrayBuffer();

  return new Uint8Array(compressed);
}
