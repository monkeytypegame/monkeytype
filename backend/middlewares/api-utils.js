const joi = require("joi");
const MonkeyError = require("../handlers/error");

/**
 * This utility serves as an alternative to wrapping express handlers with try/catch statements.
 * Any routes that use an async handler function should wrap the handler with this function.
 * Without this, any errors thrown will not be caught by the error handling middleware, and
 * the app will hang!
 */
function asyncHandlerWrapper(handler) {
  return async (req, res, next) => {
    try {
      const handlerData = await handler(req, res);
      if (!res.headersSent && handlerData) {
        res.json(handlerData);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

function requestValidation(validationSchema) {
  return (req, res, next) => {
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

    Object.keys(validationSchema).forEach((key) => {
      const schema = validationSchema[key];
      const joiSchema = joi.object().keys(schema);
      const { error } = joiSchema.validate(req[key] ?? {});
      if (error) {
        const errorMessage = error.details[0].message;
        throw new MonkeyError(400, `Invalid request: ${errorMessage}`);
      }
    });

    next();
  };
}

module.exports = {
  asyncHandlerWrapper,
  requestValidation,
};
