import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import endpoints from "./endpoints";

const DEV_SERVER_HOST = "http://localhost:5005";
const PROD_SERVER_HOST = "https://api.monkeytype.com";

const apiPath = "";
const baseUrl =
  window.location.hostname === "localhost" ? DEV_SERVER_HOST : PROD_SERVER_HOST;
const apiUrl = `${baseUrl}${apiPath}`;

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

// Wrap the underlying HTTP client's method with our own.
function apeifyClientMethod(clientMethod: AxiosClientMethod): Ape.ClientMethod {
  return async (
    endpoint: string,
    options: Ape.RequestOptions = {}
  ): Ape.EndpointData => {
    let errorMessage = "Something went wrong";

    try {
      const requestOptions: AxiosRequestConfig = await adaptRequestOptions(
        options
      );
      const response: AxiosResponse = await clientMethod(
        endpoint,
        requestOptions
      );

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
    };
  };
}

const axiosClient = axios.create({
  baseURL: apiUrl,
  timeout: 10000,
});

const apeClient: Ape.Client = {
  get: apeifyClientMethod(axiosClient.get),
  post: apeifyClientMethod(axiosClient.post),
  put: apeifyClientMethod(axiosClient.put),
  patch: apeifyClientMethod(axiosClient.patch),
  delete: apeifyClientMethod(axiosClient.delete),
};

// API Endpoints

export default {
  users: endpoints.getUsersEndpoints(apeClient),
  configs: endpoints.getConfigsEndpoints(apeClient),
  results: endpoints.getResultsEndpoints(apeClient),
  psas: endpoints.getPsasEndpoints(apeClient),
  quotes: endpoints.getQuotesEndpoints(apeClient),
  leaderboards: endpoints.getLeaderboardsEndpoints(apeClient),
} as Ape.Endpoints;
