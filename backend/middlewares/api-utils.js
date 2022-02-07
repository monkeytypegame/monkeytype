const _ = require("lodash");
const joi = require("joi");
const MonkeyError = require("../handlers/error");

class MonkeyResponse {
  constructor(status, message, data) {
    this.status = status;
    this.message = message;
    this.data = data;
  }
}

/**
 * This utility checks that the server's configuration matches
 * the criteria.
 */
function validateConfiguration(options) {
  const { criteria, invalidMessage } = options;

  return (req, res, next) => {
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
function asyncHandlerWrapper(handler) {
  return async (req, res, next) => {
    try {
      const handlerData = await handler(req, res);
      res.body = handlerData;

      return handleResponse(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

function requestValidation(validationSchema) {
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

  return (req, res, next) => {
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

function handleResponse(request, response, next) {
  var resBody = response.encryptedBody || response.body || {};
  var { status } = resBody;
  var handler =
    [301, 302].indexOf(status) > -1 ? _redirectResponse : _sendResponse;
  handler(request, response, next);
}

function _sendResponse(request, response) {
  var resBody = response.encryptedBody || response.body || {};
  var { status, message, data } = resBody;

  if (!resBody || !status) {
    resBody = new MonkeyResponse(500, "Response Data Not Found!");
  }

  return response.status(resBody.status).json({ message, data });
}

function _redirectResponse(request, response) {
  var resBody = response.encryptedBody || response.body || {};
  var { status, data } = resBody;
  return response.status(status).redirect(data);
}

module.exports = {
  MonkeyResponse,
  validateConfiguration,
  asyncHandlerWrapper,
  requestValidation,
};
