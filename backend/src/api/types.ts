import { TsRestRequest as TsRestRequestGeneric } from "@ts-rest/express";
import type { AppRoute, AppRouter } from "@ts-rest/core";
import { Request as ExpressRequest } from "express";
import { Context } from "../middlewares/context";

export type TsRestRequest = TsRestRequestGeneric<AppRoute | AppRouter>;

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
  TParams = undefined,
> = {
  query: Readonly<TQuery>;
  body: Readonly<TBody>;
  params: Readonly<TParams>;
  ctx: Readonly<Context>;
  raw: Readonly<TsRestRequest>;
};
