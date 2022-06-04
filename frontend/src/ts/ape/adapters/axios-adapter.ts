import { Auth } from "../../firebase";
import { getIdToken } from "firebase/auth";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

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

async function adaptRequestOptions(
  options: Ape.RequestOptions
): Promise<AxiosRequestConfig> {
  const currentUser = Auth.currentUser;
  const idToken = currentUser && (await getIdToken(currentUser));

  return {
    params: options.searchQuery,
    data: options.payload,
    headers: {
      ...options.headers,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(idToken && { Authorization: `Bearer ${idToken}` }),
    },
  };
}

function apeifyClientMethod(
  clientMethod: AxiosClientMethods,
  methodType: Ape.HttpMethodTypes
): Ape.HttpClientMethod {
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
