import { type Response } from "express";
import { isCustomCode } from "../constants/monkey-status-codes";
import { MonkeyResponseType } from "@monkeytype/contracts/schemas/api";

export type MonkeyDataAware<T> = {
  data: T | null;
};
//TODO FIX ANYS

export class MonkeyResponse {
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  status: number;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(message?: string, data?: any, status = 200) {
    this.message = message ?? "ok";
    this.data = data ?? null;
    this.status = status;
  }
}

export function handleMonkeyResponse(
  monkeyResponse: MonkeyResponse,
  res: Response
): void {
  const { message, data, status } = monkeyResponse;

  res.status(status);
  if (isCustomCode(status)) {
    res.statusMessage = message;
  }

  //@ts-expect-error ignored so that we can see message in swagger stats
  res.monkeyMessage = message;
  if ([301, 302].includes(status)) {
    // todo add stronger types here, maybe a MonkeyRedirectResponse
    res.redirect(data as string);
    return;
  }

  res.json({ message, data });
}

export class MonkeyResponse2<T = null>
  implements MonkeyResponseType, MonkeyDataAware<T>
{
  public message: string;
  public data: T;

  constructor(message: string, data: T) {
    this.message = message;
    this.data = data;
  }
}
