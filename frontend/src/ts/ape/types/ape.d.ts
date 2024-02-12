declare namespace Ape {
  type RequestOptions = {
    headers?: Record<string, string>;
    searchQuery?: Record<string, any>;
    payload?: any;
  };

  type HttpClientResponse<Data> = {
    status: number;
    message: string;
    data: Data | null;
  };

  type EndpointResponse<Data = any> = Promise<HttpClientResponse<Data>>;

  type HttpClientMethod<Data = any> = (
    endpoint: string,
    config?: RequestOptions
  ) => EndpointResponse<Data>;

  type HttpClient = {
    get: HttpClientMethod;
    post: HttpClientMethod;
    put: HttpClientMethod;
    patch: HttpClientMethod;
    delete: HttpClientMethod;
  };

  type HttpMethodTypes = keyof HttpClient;
}
