import { AppRoute, AppRouter } from "@ts-rest/core";
import { TsRestRequest } from "@ts-rest/express";
import { MonkeyResponse2 } from "../utils/monkey-response";
export function callController<
  TRoute extends AppRoute | AppRouter,
  TQuery,
  TBody,
  TParams,
  TResponse,
  //ignoring as it might be used in the future
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
  TStatus = 200
>(
  handler: Handler<TQuery, TBody, TParams, TResponse>
): (all: RequestType2<TRoute, TQuery, TBody, TParams>) => Promise<{
  status: TStatus;
  body: { message: string; data: TResponse };
}> {
  return async (all) => {
    const req: MonkeyTypes.Request2<TQuery, TBody, TParams> = {
      body: all.body as TBody,
      query: all.query as TQuery,
      params: all.params as TParams,
      raw: all.req,
      ctx: all.req["ctx"],
    };

    const result = await handler(req);
    const response = {
      status: 200 as TStatus,
      body: {
        message: result.message,
        data: result.data,
      },
    };

    return response;
  };
}

type WithBody<T> = {
  body: T;
};
type WithQuery<T> = {
  query: T;
};

type WithParams<T> = {
  params: T;
};

type WithoutBody = {
  body?: never;
};
type WithoutQuery = {
  query?: never;
};
type WithoutParams = {
  params?: never;
};

type Handler<TQuery, TBody, TParams, TResponse> = (
  req: MonkeyTypes.Request2<TQuery, TBody, TParams>
) => Promise<MonkeyResponse2<TResponse>>;

type RequestType2<
  TRoute extends AppRoute | AppRouter,
  TQuery,
  TBody,
  TParams
> = {
  req: TsRestRequest<TRoute>;
} & (TQuery extends undefined ? WithoutQuery : WithQuery<TQuery>) &
  (TBody extends undefined ? WithoutBody : WithBody<TBody>) &
  (TParams extends undefined ? WithoutParams : WithParams<TParams>);
