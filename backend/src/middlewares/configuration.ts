import type { Response, NextFunction } from "express";
import { TsRestRequestWithCtx } from "./auth";
import { TsRestRequestHandler } from "@ts-rest/express";
import { EndpointMetadata } from "@monkeytype/contracts/schemas/api";
import MonkeyError from "../utils/error";
import { Configuration } from "@monkeytype/contracts/schemas/configuration";
import {
  ConfigurationPath,
  RequireConfiguration,
} from "@monkeytype/contracts/require-configuration/index";

export function verifyRequiredConfiguration<
  T extends AppRouter | AppRoute
>(): TsRestRequestHandler<T> {
  return async (
    req: TsRestRequestWithCtx,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    const requiredConfigurations = getRequireConfigurations(
      req.tsRestRoute["metadata"] as EndpointMetadata | undefined
    );

    if (requiredConfigurations === undefined) {
      next();
      return;
    }
    try {
      for (const requireConfiguration of requiredConfigurations) {
        const value = getValue(
          req.ctx.configuration,
          requireConfiguration.path
        );
        if (!value) {
          throw new MonkeyError(
            503,
            requireConfiguration.invalidMessage ??
              "This endpoint is currently unavailable."
          );
        }
      }
      next();
      return;
    } catch (e) {
      next(e);
      return;
    }
  };
}

function getValue(
  configuration: Configuration,
  path: ConfigurationPath
): boolean {
  const keys = (path as string).split(".");
  let result = configuration;

  for (const key of keys) {
    if (result === undefined || result === null)
      throw new MonkeyError(500, `Invalid configuration path: "${path}"`);
    result = result[key];
  }

  if (result === undefined || result === null)
    throw new MonkeyError(
      500,
      `Required configuration doesnt exist: "${path}"`
    );
  if (typeof result !== "boolean")
    throw new MonkeyError(
      500,
      `Required configuration is not a boolean: "${path}"`
    );
  return result;
}

function getRequireConfigurations(
  metadata: EndpointMetadata | undefined
): RequireConfiguration[] | undefined {
  if (metadata === undefined || metadata.requireConfiguration === undefined)
    return undefined;

  if (Array.isArray(metadata.requireConfiguration))
    return metadata.requireConfiguration;
  return [metadata.requireConfiguration];
}
