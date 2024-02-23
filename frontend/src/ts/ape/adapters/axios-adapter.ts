import { getAuthenticatedUser, isAuthenticated } from "../../firebase";
import { getIdToken } from "firebase/auth";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { envConfig } from "../../constants/env-config";
import { createErrorMessage } from "../../utils/misc";

type AxiosClientMethod = (
  endpoint: string,
  config: AxiosRequestConfig
) => Promise<AxiosResponse>;

type AxiosClientDataMethod = (
  endpoint: string,
  data: unknown,
  config: AxiosRequestConfig
) => Promise<AxiosResponse>;

async function adaptRequestOptions<TQuery, TPayload>(
  options: Ape.RequestOptionsWithPayload<TQuery, TPayload>
): Promise<AxiosRequestConfig> {
  const idToken = isAuthenticated()
    ? await getIdToken(getAuthenticatedUser())
    : "";

  return {
    params: options.searchQuery,
    data: options.payload,
    headers: {
      ...options.headers,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(idToken && { Authorization: `Bearer ${idToken}` }),
      "X-Client-Version": envConfig.clientVersion,
    },
  };
}

function apeifyClientMethod(
  clientMethod: AxiosClientMethod | AxiosClientDataMethod,
  methodType: Ape.HttpMethodTypes
): Ape.HttpClientMethod | Ape.HttpClientMethodWithPayload {
  return async function <TQuery, TPayload, TData>(
    endpoint: string,
    options: Ape.RequestOptionsWithPayload<TQuery, TPayload> = {}
  ): Ape.EndpointResponse<TData> {
    let errorMessage = "";

    let requestOptions: AxiosRequestConfig;
    try {
      requestOptions = await adaptRequestOptions(options);
    } catch (error) {
      console.error("Failed to adapt request options");
      console.error(error);

      if ((error as Error).message.includes("auth/network-request-failed")) {
        return {
          status: 400,
          message:
            "Network error while trying to authenticate. Please try again.",
          data: null,
        };
      }

      const message = createErrorMessage(
        error,
        "Failed to adapt request options"
      );
      return {
        status: 400,
        message: message,
        data: null,
      };
    }

    try {
      let response;
      if (methodType === "get" || methodType === "delete") {
        response = await (clientMethod as AxiosClientMethod)(
          endpoint,
          requestOptions
        );
      } else {
        response = await (clientMethod as AxiosClientDataMethod)(
          endpoint,
          requestOptions.data,
          requestOptions
        );
      }

      const { message, data } = response.data;

      return {
        status: response.status,
        message,
        data,
      };
    } catch (error) {
      console.error(error);

      const typedError = error as Error;
      errorMessage = typedError.message;

      if (axios.isAxiosError(typedError)) {
        return {
          status: typedError.response?.status ?? 500,
          message: typedError.message,
          ...typedError.response?.data,
        };
      }
    }

    return {
      status: 500,
      message: errorMessage,
      data: null,
    };
  };
}

export function buildHttpClient(
  baseURL: string,
  timeout: number
): Ape.HttpClient {
  const axiosClient = axios.create({
    baseURL,
    timeout,
  });

  return {
    get: apeifyClientMethod(axiosClient.get, "get"),
    post: apeifyClientMethod(axiosClient.post, "post"),
    put: apeifyClientMethod(axiosClient.put, "put"),
    patch: apeifyClientMethod(axiosClient.patch, "patch"),
    delete: apeifyClientMethod(axiosClient.delete, "delete"),
  };
}
