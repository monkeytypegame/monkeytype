import { z, ZodSchema } from "zod";

export type OpenApiTag = "configs" | "presets" | "ape-keys" | "admin";

export type EndpointMetadata = {
  /** Authentication options, by default a bearer token is required. */
  authenticationOptions?: RequestAuthenticationOptions;
  openApiTags?: OpenApiTag | OpenApiTag[];
};

export type RequestAuthenticationOptions = {
  /** Endpoint is accessible without any authentication. If `false` bearer authentication is required. */
  isPublic?: boolean;
  /** Endpoint is accessible with ape key authentication in  _addition_ to the bearer authentication. */
  acceptApeKeys?: boolean;
  /** Endpoint requires an authentication token which is younger than one minute.  */
  requireFreshToken?: boolean;
  noCache?: boolean;
};

export const MonkeyResponseSchema = z.object({
  message: z.string(),
});
export type MonkeyResponseType = z.infer<typeof MonkeyResponseSchema>;

export const MonkeyValidationErrorSchema = MonkeyResponseSchema.extend({
  validationErrors: z.array(z.string()).nonempty(),
});
export type MonkeyValidationError = z.infer<typeof MonkeyValidationErrorSchema>;

export const MonkeyClientError = MonkeyResponseSchema;
export const MonkeyServerError = MonkeyClientError.extend({
  errorId: z.string(),
  uid: z.string().optional(),
});
export type MonkeyServerErrorType = z.infer<typeof MonkeyServerError>;

export function responseWithNullableData<T extends ZodSchema>(
  dataSchema: T
): z.ZodObject<
  z.objectUtil.extendShape<
    typeof MonkeyResponseSchema.shape,
    {
      data: z.ZodNullable<T>;
    }
  >
> {
  return MonkeyResponseSchema.extend({
    data: dataSchema.nullable(),
  });
}

export function responseWithData<T extends ZodSchema>(
  dataSchema: T
): z.ZodObject<
  z.objectUtil.extendShape<
    typeof MonkeyResponseSchema.shape,
    {
      data: T;
    }
  >
> {
  return MonkeyResponseSchema.extend({
    data: dataSchema,
  });
}

export const CommonResponses = {
  400: MonkeyClientError.describe("Generic client error"),
  401: MonkeyClientError.describe(
    "Authentication required but not provided or invalid"
  ),
  403: MonkeyClientError.describe("Operation not permitted"),
  422: MonkeyValidationErrorSchema.describe("Request validation failed"),
  429: MonkeyClientError.describe("Rate limit exceeded"),
  500: MonkeyServerError.describe("Generic server error"),
};
