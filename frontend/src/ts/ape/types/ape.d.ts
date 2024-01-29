declare namespace Ape {
  interface RequestOptions {
    headers?: Record<string, string>;
    searchQuery?: Record<string, any>;
    payload?: any;
  }

  interface HttpClientResponse<Data> {
    status: number;
    message: string;
    data: Data | null;
  }

  type EndpointResponse<Data = any> = Promise<HttpClientResponse<Data>>;

  type HttpClientMethod<Data = any> = (
    endpoint: string,
    config?: RequestOptions
  ) => EndpointResponse<Data>;

  type HttpMethodTypes = "get" | "post" | "put" | "patch" | "delete";

  type HttpClient = {
    [Method in HttpMethodTypes]: <Data = unknown>(
      endpoint: string,
      config?: RequestOptions
    ) => EndpointResponse<Data>;
  };
}
