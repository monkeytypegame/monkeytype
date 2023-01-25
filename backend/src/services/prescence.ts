import Logger from "../utils/logger";
import * as RedisClient from "../init/redis";
import { NextFunction, RequestHandler, Response } from "express";

const prescenceLog = new Set<string>();

const PRESCENCE_NAMESPACE = `prescence`;

const VALID_PRESCENCE_REQUESTS = new Set<string>([
  "GET /configs",
  "GET /psas",
  "PATCH /configs",
  "POST /results",
]);

const VALID_STATUS_CODES = new Set<number>([200, 304]);

export async function isPresent(
  configuration: MonkeyTypes.Configuration,
  uid: string
): Promise<boolean> {
  if (!configuration.users.prescence.enabled) {
    return false;
  }

  if (prescenceLog.has(uid)) {
    return true;
  }

  const client = RedisClient.getConnection();
  if (!client) {
    return false;
  }

  return (await client.exists(`${PRESCENCE_NAMESPACE}:${uid}`)) === 1;
}

async function syncPrescence(
  configuration: MonkeyTypes.Configuration["users"]["prescence"]
): Promise<void> {
  const client = RedisClient.getConnection();
  if (prescenceLog.size === 0 || !client) {
    return;
  }

  const pipeline = client.pipeline();

  prescenceLog.forEach((uid) => {
    pipeline.setex(`prescence:${uid}`, configuration.expirationSeconds, "");
  });

  prescenceLog.clear();

  await pipeline.exec();
}

export function getPrescenceMiddleware(): RequestHandler {
  let lastSync = Date.now();

  return async (
    req: MonkeyTypes.Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    res.on("finish", async () => {
      const requestSignature = `${req.method} ${req.baseUrl}`;

      const {
        decodedToken: { type, uid },
        configuration,
      } = req.ctx;
      const shouldLogPrescence =
        type === "Bearer" && !!uid && VALID_STATUS_CODES.has(res.statusCode);

      const prescenceConfig = configuration.users.prescence;

      if (
        !prescenceConfig.enabled ||
        !VALID_PRESCENCE_REQUESTS.has(requestSignature) ||
        !shouldLogPrescence
      ) {
        return;
      }

      prescenceLog.add(uid);

      const now = Date.now();
      const elapsed = now - lastSync;

      if (
        elapsed >= prescenceConfig.syncDelayMs ||
        prescenceLog.size >= prescenceConfig.maxLogSize
      ) {
        lastSync = now;

        const start = performance.now();
        Logger.info("Starting prescence sync");

        await syncPrescence(prescenceConfig);

        Logger.info(
          `Prescence sync completed in ${performance.now() - start}ms`
        );
      }
    });

    next();
  };
}
