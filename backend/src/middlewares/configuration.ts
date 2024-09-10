import type { Response, NextFunction } from "express";
import { TsRestRequestWithCtx } from "./auth";
import { TsRestRequestHandler } from "@ts-rest/express";
import { EndpointMetadata } from "@monkeytype/contracts/schemas/api";
import MonkeyError from "../utils/error";

export function verifyRequiredConfiguration<
  T extends AppRouter | AppRoute
>(): TsRestRequestHandler<T> {
  return async (
    req: TsRestRequestWithCtx,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    const requiredConfig = (req.tsRestRoute["metadata"] as EndpointMetadata)
      ?.requireConfiguration;
    if (requiredConfig === undefined) {
      next();
      return;
    }
    const keys = (requiredConfig.path as string).split(".");
    let value = req.ctx.configuration;
    for (const key of keys) {
      value = value[key];
    }

    //@ts-expect-error
    if (value !== true) {
      next(
        new MonkeyError(
          503,
          requiredConfig.invalidMessage ??
            "This service is currently unavailable."
        )
      );
      return;
    }

    next();
    return;
  };
}
