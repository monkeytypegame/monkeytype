import { TsRestRequest as TsRestRequestGeneric } from "@ts-rest/express";
import { Context } from "../middlewares/context";
import { Request as ExpressRequest } from "express";
import { ObjectId } from "mongodb";

export type WithObjectId<T extends { _id: string }> = Omit<T, "_id"> & {
  _id: ObjectId;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TsRestRequest = TsRestRequestGeneric<any>;

export type ExpressRequestWithContext = {
  ctx: Readonly<Context>;
} & TsRestRequest &
  ExpressRequest;

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
