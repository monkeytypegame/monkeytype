import { Response } from "express";
import { isCustomCode } from "../constants/monkey-status-codes";

//TODO use MonkeyResponse<T> ?!
export class MonkeyResponse<T> {
  message: string;
  data: T | null;
  status: number;

  constructor(message?: string, data?: T, status = 200) {
    this.message = message ?? "ok";
    this.data = data ?? null;
    this.status = status;
  }

  public static unwrap<U extends { _id: string }>(
    message?: string,
    data?: MonkeyTypes.WithObjectId<U>,
    status = 200
  ): MonkeyResponse<U> {
    return new MonkeyResponse(
      message,
      { ...data, _id: data?._id.toString() } as U,
      status
    );
  }

  public static unwrapArray<U extends { _id: string }>(
    message?: string,
    data?: MonkeyTypes.WithObjectId<U>[],
    status = 200
  ): MonkeyResponse<U[]> {
    return new MonkeyResponse(
      message,
      data?.map((it) => ({ ...it, _id: it._id.toString() })) as U[],
      status
    );
  }
}

export function handleMonkeyResponse<T>(
  monkeyResponse: MonkeyResponse<T>,
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
    return res.redirect(String.prototype.toString.call(data));
  }

  res.json({ message, data });
}
