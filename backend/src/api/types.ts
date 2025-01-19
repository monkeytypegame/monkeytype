import { TsRestRequest as TsRestRequestGeneric } from "@ts-rest/express";
import { Request as ExpressRequest } from "express";
import { Context } from "../middlewares/context";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TsRestRequest = TsRestRequestGeneric<any>;

export type ExpressRequestWithContext = {
  ctx: Readonly<Context>;
} & ExpressRequest;

export type TsRestRequestWithContext = {
  ctx: Readonly<Context>;
} & TsRestRequest &
  ExpressRequest;

export type MonkeyRequest<
  TQuery = undefined,
  TBody = undefined,
  TParams = undefined
> = {
  query: Readonly<TQuery>;
  body: Readonly<TBody>;
  params: Readonly<TParams>;
  ctx: Readonly<Context>;
  raw: Readonly<TsRestRequest>;
};
