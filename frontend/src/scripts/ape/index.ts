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
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: idToken && `Bearer ${idToken}`,
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
    try {
      const requestOptions = await adaptRequestOptions(options);
      const response = await clientMethod(endpoint, requestOptions);

      const { message, data } = response.data;

      return {
        status: response.status,
        message,
        data,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.data) {
          return error.response.data as Ape.Response;
        }
        return {
          status: 500,
          message: error.message,
        };
      }
    }

    return {
      status: 500,
      message: "Something went wrong",
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
  ...endpoints.getUsersEndpoints(apeClient),
  ...endpoints.getConfigsEndpoints(apeClient),
  ...endpoints.getResultsEndpoints(apeClient),
  ...endpoints.getPsasEndpoints(apeClient),
  ...endpoints.getQuotesEndpoints(apeClient),
  ...endpoints.getLeaderboardsEndpoints(apeClient),
} as Ape.AllEndpoints;
