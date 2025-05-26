import cors from "cors";
import helmet from "helmet";
import { addApiRoutes } from "./api/routes";
import express, { urlencoded, json } from "express";
import contextMiddleware from "./middlewares/context";
import errorHandlingMiddleware from "./middlewares/error";
import {
  badAuthRateLimiterHandler,
  rootRateLimiter,
} from "./middlewares/rate-limit";
import { compatibilityCheckMiddleware } from "./middlewares/compatibilityCheck";
import {
  COMPATIBILITY_CHECK,
  COMPATIBILITY_CHECK_HEADER,
} from "@monkeytype/contracts";
import { default as etag } from "etag";

const etagFn = createETagGenerator({ weak: true });

function buildApp(): express.Application {
  const app = express();

  app.use(urlencoded({ extended: true }));
  app.use(json());
  app.use(cors({ exposedHeaders: [COMPATIBILITY_CHECK_HEADER] }));
  app.use(helmet());

  app.set("trust proxy", 1);

  app.use(compatibilityCheckMiddleware);
  app.use(contextMiddleware);

  app.use(badAuthRateLimiterHandler);
  app.use(rootRateLimiter);

  app.set("etag", etagFn);

  addApiRoutes(app);

  app.use(errorHandlingMiddleware);

  return app;
}

/**
 * create etag generator, based on the express implementation https://github.com/expressjs/express/blob/9f4dbe3a1332cd883069ba9b73a9eed99234cfc7/lib/utils.js#L247
 * Adds the api COMPATIBILITY_CHECK version in front of the etag.
 * @param options
 * @returns
 */
function createETagGenerator(options: {
  weak: boolean;
}): (body: Buffer | string, encoding: BufferEncoding | undefined) => string {
  return function generateETag(body, encoding) {
    const buf = !Buffer.isBuffer(body) ? Buffer.from(body, encoding) : body;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const generatedTag: string = etag(buf, options);
    if (generatedTag.startsWith("W/")) {
      return `W/"V${COMPATIBILITY_CHECK}-${generatedTag.slice(3)}`;
    }
    return `"V${COMPATIBILITY_CHECK}-${generatedTag.slice(1)}`;
  };
}

export default buildApp();
