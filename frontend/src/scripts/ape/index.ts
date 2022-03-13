import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import endpoints from "./endpoints";

const DEV_SERVER_HOST = "http://localhost:5005";
const PROD_SERVER_HOST = "https://api.monkeytype.com";

const API_PATH = "";
const BASE_URL =
  window.location.hostname === "localhost" ? DEV_SERVER_HOST : PROD_SERVER_HOST;
const API_URL = `${BASE_URL}${API_PATH}`;

// Adapts the ape client's view of request options to the underlying HTTP client.
async function adaptRequestOptions(
  options: Ape.RequestOptions
): Promise<AxiosRequestConfig> {
  const currentUser = firebase.auth().currentUser;
  const idToken = currentUser && (await currentUser.getIdToken());

  return {
    params: options.searchQuery,
    data: options.payload,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(idToken && { Authorization: `Bearer ${idToken}` }),
    },
  };
}

type AxiosClientMethod = (
  endpoint: string,
  config: AxiosRequestConfig
) => Promise<AxiosResponse>;

type AxiosClientDataMethod = (
  endpoint: string,
  data: any,
  config: AxiosRequestConfig
) => Promise<AxiosResponse>;

type AxiosClientMethods = AxiosClientMethod & AxiosClientDataMethod;

// Wrap the underlying HTTP client's method with our own.
function apeifyClientMethod(
  clientMethod: AxiosClientMethods,
  methodType: Ape.MethodTypes
): Ape.ClientMethod {
  return async (
    endpoint: string,
    options: Ape.RequestOptions = {}
  ): Ape.EndpointData => {
    let errorMessage = "";

    try {
      const requestOptions: AxiosRequestConfig = await adaptRequestOptions(
        options
      );

      let response;
      if (methodType === "get" || methodType === "delete") {
        response = await clientMethod(endpoint, requestOptions);
      } else {
        response = await clientMethod(
          endpoint,
          requestOptions.data,
          requestOptions
        );
      }

      const { message, data } = response.data as Ape.ApiResponse;

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
    };
  };
}

const axiosClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

const apeClient: Ape.Client = {
  get: apeifyClientMethod(axiosClient.get, "get"),
  post: apeifyClientMethod(axiosClient.post, "post"),
  put: apeifyClientMethod(axiosClient.put, "put"),
  patch: apeifyClientMethod(axiosClient.patch, "patch"),
  delete: apeifyClientMethod(axiosClient.delete, "delete"),
};

// API Endpoints
const Ape: Ape.Endpoints = {
  users: endpoints.getUsersEndpoints(apeClient),
  configs: endpoints.getConfigsEndpoints(apeClient),
  results: endpoints.getResultsEndpoints(apeClient),
  psas: endpoints.getPsasEndpoints(apeClient),
  quotes: endpoints.getQuotesEndpoints(apeClient),
  leaderboards: endpoints.getLeaderboardsEndpoints(apeClient),
  presets: endpoints.getPresetsEndpoints(apeClient),
  apeKeys: endpoints.getApeKeysEndpoints(apeClient),
};

export default Ape;
