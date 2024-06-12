import { AppRouter, initClient, type ApiFetcherArgs } from "@ts-rest/core";
import { Axios, AxiosError, AxiosResponse, Method, isAxiosError } from "axios";
import { getIdToken } from "firebase/auth";
import { envConfig } from "../../constants/env-config";
import { getAuthenticatedUser, isAuthenticated } from "../../firebase";

function buildApi(axios: Axios): (args: ApiFetcherArgs) => Promise<{
  status: number;
  body: unknown;
  headers: Headers;
}> {
  //@ts-expect-error  trust me bro
  return async (args: ApiFetcherArgs) => {
    const token = isAuthenticated()
      ? await getIdToken(getAuthenticatedUser())
      : "";
    try {
      const result = await axios.request({
        method: args.method as Method,
        url: args.path,
        headers: {
          ...args.headers,
          Authorization: `Bearer ${token}`,
          "X-Client-Version": envConfig.clientVersion,
        },
        data: args.body,
      });
      return {
        status: result.status,
        body: result.data,
        headers: result.headers,
      };
    } catch (e: Error | AxiosError | unknown) {
      if (isAxiosError(e)) {
        const error = e as AxiosError;
        const response = error.response as AxiosResponse;
        return {
          status: response.status,
          body: response.data,
          headers: response.headers,
        };
      }
      throw e;
    }
  };
}

/* eslint-disable @typescript-eslint/explicit-function-return-type */
export function buildClient<T extends AppRouter>(
  contract: T,
  axios: Axios,
  baseUrl: string
) {
  return initClient(contract, {
    baseUrl: baseUrl,
    jsonQuery: true,
    api: buildApi(axios),
  });
}
/* eslint-enable @typescript-eslint/explicit-function-return-type */
