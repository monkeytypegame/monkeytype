declare namespace Ape {
  type RequestOptions<TQuery> = {
    headers?: Record<string, string>;
    searchQuery?: Record<string, TQuery>;
  };

  type HttpClientMethod = <TQuery, TData>(
    endpoint: string,
    options?: Ape.RequestOptions<TQuery>
  ) => Ape.EndpointResponse<TData>;

  type RequestOptionsWithPayload<TQuery, TPayload> = {
    headers?: Record<string, string>;
    searchQuery?: Record<string, TQuery>;
    payload?: TPayload;
  };

  type HttpClientMethodWithPayload = <TQuery, TPayload, TData>(
    endpoint: string,
    options?: Ape.RequestOptionsWithPayload<TQuery, TPayload>
  ) => Ape.EndpointResponse<TData>;

  type HttpClientResponse<TData> = {
    status: number;
    message: string;
    data: TData | null;
  };

  type EndpointResponse<TData> = Promise<HttpClientResponse<TData>>;

  type HttpClient = {
    get: HttpClientMethod;
    post: HttpClientMethodWithPayload;
    put: HttpClientMethodWithPayload;
    patch: HttpClientMethodWithPayload;
    delete: HttpClientMethodWithPayload;
  };

  type HttpMethodTypes = keyof HttpClient;
}
