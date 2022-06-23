declare namespace Ape {
  interface RequestOptions {
    headers?: Record<string, string>;
    searchQuery?: Record<string, any>;
    payload?: any;
  }

  interface HttpClientResponse {
    status: number;
    message: string;
    data?: any;
  }

  type EndpointData = Promise<HttpClientResponse>;

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

  interface ApiResponse {
    message: string;
    data: any | null;
  }
}
