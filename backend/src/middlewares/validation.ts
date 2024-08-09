import _ from "lodash";
import joi from "joi";
import MonkeyError from "../utils/error";
import type { Response, NextFunction, RequestHandler } from "express";

type ValidationSchema = {
  body?: object;
  query?: object;
  params?: object;
  headers?: object;
};

type ValidationSchemaOption = {
  allowUnknown?: boolean;
};

type ValidationHandlingOptions = {
  validationErrorMessage?: string;
};

type ValidationSchemaOptions = {
  [_schema in keyof ValidationSchema]?: ValidationSchemaOption;
} & ValidationHandlingOptions;

const VALIDATION_SCHEMA_DEFAULT_OPTIONS: ValidationSchemaOptions = {
  body: { allowUnknown: false },
  headers: { allowUnknown: true },
  params: { allowUnknown: false },
  query: { allowUnknown: false },
};

export function validateRequest(
  validationSchema: ValidationSchema,
  validationOptions: ValidationSchemaOptions = VALIDATION_SCHEMA_DEFAULT_OPTIONS
): RequestHandler {
  const options = {
    ...VALIDATION_SCHEMA_DEFAULT_OPTIONS,
    ...validationOptions,
  };
  const { validationErrorMessage } = options;
  const normalizedValidationSchema: ValidationSchema = _.omit(
    validationSchema,
    "validationErrorMessage"
  );

  return (req: MonkeyTypes.Request, _res: Response, next: NextFunction) => {
    _.each(
      normalizedValidationSchema,
      (schema: object, key: keyof ValidationSchema) => {
        const joiSchema = joi
          .object()
          .keys(schema)
          .unknown(options[key]?.allowUnknown);

        const { error } = joiSchema.validate(req[key] ?? {});
        if (error) {
          const errorMessage = error.details[0]?.message;
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
