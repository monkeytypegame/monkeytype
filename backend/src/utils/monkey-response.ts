import { Response } from "express";
import { isCustomCode } from "../constants/monkey-status-codes";
import { MonkeyResonseType as MonkeyResponseType } from "@shared/contract/common.contract";
import { omit } from "lodash";

export type MonkeyStatusAware = {
  status: number;
};
//TODO FIX ANYS

export class MonkeyResponse implements MonkeyStatusAware {
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
    return res.redirect(data);
  }

  res.json({ message, data });
}

export class MonkeyResponse2<T>
  implements MonkeyResponseType, MonkeyStatusAware
{
  message: string;
  data?: T;
  status: number;

  constructor(message?: string, data?: T, status = 200) {
    this.message = message ?? "ok";
    this.data = data;
    this.status = status;
  }

  public static fromDB<T extends { _id: string }>(
    message: string,
    data: MonkeyTypes.WithObjectId<T>,
    status = 200
  ): MonkeyResponse2<T> {
    return new MonkeyResponse2(
      message,
      { _id: data._id.toString(), ...omit(data, "_id") } as unknown as T,
      status
    );
  }
}
