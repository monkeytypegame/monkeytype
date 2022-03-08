import _ from "lodash";
import joi from "joi";
import MonkeyError from "../utils/error";
import { Response, NextFunction, RequestHandler } from "express";
import { handleMonkeyResponse, MonkeyResponse } from "../utils/monkey-response";
import UsersDAO from "../dao/user";

interface ValidationOptions<T> {
  criteria: (data: T) => boolean;
  invalidMessage?: string;
}

/**
 * This utility checks that the server's configuration matches
 * the criteria.
 */
function validateConfiguration(
  options: ValidationOptions<MonkeyTypes.Configuration>
): RequestHandler {
  const {
    criteria,
    invalidMessage = "This service is currently unavailable.",
  } = options;

  return (req: MonkeyTypes.Request, _res: Response, next: NextFunction) => {
    const configuration = req.ctx.configuration;

    const validated = criteria(configuration);
    if (!validated) {
      throw new MonkeyError(503, invalidMessage);
    }

    next();
  };
}

/**
 * Check user permissions before handling request.
 * Note that this middleware must be used after authentication in the middleware stack.
 */
function checkUserPermissions(
  options: ValidationOptions<MonkeyTypes.User>
): RequestHandler {
  const { criteria, invalidMessage = "You don't have permission to do this." } =
    options;

  return async (
    req: MonkeyTypes.Request,
    _res: Response,
    next: NextFunction
  ) => {
    try {
      const { uid } = req.ctx.decodedToken;

      const userData = (await UsersDAO.getUser(
        uid
      )) as unknown as MonkeyTypes.User;
      const hasPermission = criteria(userData);

      if (!hasPermission) {
        throw new MonkeyError(403, invalidMessage);
      }
    } catch (error) {
      next(error);
    }

    next();
  };
}

type AsyncHandler = (
  req: MonkeyTypes.Request,
  res?: Response
) => Promise<MonkeyResponse>;

/**
 * This utility serves as an alternative to wrapping express handlers with try/catch statements.
 * Any routes that use an async handler function should wrap the handler with this function.
 * Without this, any errors thrown will not be caught by the error handling middleware, and
 * the app will hang!
 */
function asyncHandler(handler: AsyncHandler): RequestHandler {
  return async (
    req: MonkeyTypes.Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const handlerData = await handler(req, res);
      return handleMonkeyResponse(handlerData, res);
    } catch (error) {
      next(error);
    }
  };
}

interface ValidationSchema {
  body?: object;
  query?: object;
  params?: object;
  validationErrorMessage?: string;
}

function validateRequest(validationSchema: ValidationSchema): RequestHandler {
  /**
   * In dev environments, as an alternative to token authentication,
   * you can pass the authentication middleware by having a user id in the body.
   * Inject the user id into the schema so that validation will not fail.
   */
  if (process.env.MODE === "dev") {
    validationSchema.body = {
      uid: joi.any(),
      ...(validationSchema.body ?? {}),
    };
  }

  const { validationErrorMessage } = validationSchema;
  const normalizedValidationSchema: ValidationSchema = _.omit(
    validationSchema,
    "validationErrorMessage"
  );

  return (req: MonkeyTypes.Request, _res: Response, next: NextFunction) => {
    _.each(
      normalizedValidationSchema,
      (schema: object, key: keyof ValidationSchema) => {
        const joiSchema = joi.object().keys(schema);

        const { error } = joiSchema.validate(req[key] ?? {});
        if (error) {
          const errorMessage = error.details[0].message;
          throw new MonkeyError(
            422,
            validationErrorMessage ??
              `${errorMessage} (${error.details[0]?.context?.value})`
          );
        }
      }
    );

    next();
  };
}

export {
  validateConfiguration,
  checkUserPermissions,
  asyncHandler,
  validateRequest,
};
