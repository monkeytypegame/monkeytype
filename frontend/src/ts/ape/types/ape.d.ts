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

  type HttpClientMethod = (
    endpoint: string,
    config?: RequestOptions
  ) => Promise<HttpClientResponse>;

  interface HttpClient {
    get: HttpClientMethod;
    post: HttpClientMethod;
    put: HttpClientMethod;
    patch: HttpClientMethod;
    delete: HttpClientMethod;
  }

  type HttpMethodTypes = keyof HttpClient;
}
