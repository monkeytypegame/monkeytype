import { Response } from "express";
import { getCodesRangeStart } from "../constants/monkey-status-codes";

export class MonkeyResponse {
  message: string;
  data: any;
  status: number;

  constructor(message?: string, data?: any, status = 200) {
    this.message = message ?? "ok";
    this.data = data ?? null;
    this.status = status;
  }
}

export function handleMonkeyResponse(handlerData: any, res: Response): void {
  const isMonkeyResponse = handlerData instanceof MonkeyResponse;
  const monkeyResponse = !isMonkeyResponse
    ? new MonkeyResponse("ok", handlerData)
    : handlerData;
  const { message, data, status } = monkeyResponse;

  res.status(status);
  if (status >= getCodesRangeStart()) {
    res.statusMessage = message;
  }

  //@ts-ignore ignored so that we can see message in swagger stats
  res.monkeyMessage = message;
  if ([301, 302].includes(status)) {
    return res.redirect(data);
  }

  res.json({ message, data });
}
