import _ from "lodash";
import joi from "joi";
import MonkeyError from "../handlers/error";
import { handleMonkeyResponse } from "../handlers/monkey-response";

/**
 * This utility checks that the server's configuration matches
 * the criteria.
 */
function validateConfiguration(options) {
  const { criteria, invalidMessage } = options;

  return (req, _res, next) => {
    const configuration = req.ctx.configuration;

    const validated = criteria(configuration);
    if (!validated) {
      throw new MonkeyError(
        503,
        invalidMessage ?? "This service is currently unavailable."
      );
    }

    next();
  };
}

/**
 * This utility serves as an alternative to wrapping express handlers with try/catch statements.
 * Any routes that use an async handler function should wrap the handler with this function.
 * Without this, any errors thrown will not be caught by the error handling middleware, and
 * the app will hang!
 */
function asyncHandler(handler) {
  return async (req, res, next) => {
    try {
      const handlerData = await handler(req, res);
      return handleMonkeyResponse(handlerData, res);
    } catch (error) {
      next(error);
    }
  };
}

function validateRequest(validationSchema) {
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
  const normalizedValidationSchema = _.omit(
    validationSchema,
    "validationErrorMessage"
  );

  return (req, _res, next) => {
    _.each(normalizedValidationSchema, (schema, key) => {
      const joiSchema = joi.object().keys(schema);

      const { error } = joiSchema.validate(req[key] ?? {});
      if (error) {
        const errorMessage = error.details[0].message;
        throw new MonkeyError(
          500,
          validationErrorMessage ??
            `${errorMessage} (${error.details[0].context.value})`
        );
      }
    });

    next();
  };
}

export { validateConfiguration, asyncHandler, validateRequest };
