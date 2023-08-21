declare namespace Ape {
  interface RequestOptions {
    headers?: Record<string, string>;
    searchQuery?: Record<string, any>;
    payload?: any;
  }

  interface HttpClientResponse<DataType> {
    status: number;
    message: string;
    data: DataType | null;
  }

  type EndpointData<ResponseDataType = any> = Promise<
    HttpClientResponse<ResponseDataType>
  >;

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
