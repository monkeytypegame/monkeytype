import { z, ZodSchema } from "zod";
import { RateLimitIds, RateLimiterId } from "../rate-limit";
import { RequireConfiguration } from "../require-configuration";

export type OpenApiTag =
  | "configs"
  | "presets"
  | "ape-keys"
  | "admin"
  | "psas"
  | "public"
  | "leaderboards"
  | "results"
  | "configuration"
  | "development"
  | "users"
  | "quotes"
  | "webhooks"
  | "connections";

export type PermissionId =
  | "quoteMod"
  | "canReport"
  | "canManageApeKeys"
  | "admin";

export type EndpointMetadata = {
  /** Authentication options, by default a bearer token is required. */
  authenticationOptions?: RequestAuthenticationOptions;

  openApiTags?: OpenApiTag | OpenApiTag[];

  /** RateLimitId or RateLimitIds.
   * Only specifying RateLimiterId will use  a default limiter with 30 requests/minute for ApeKey requests.
   */
  rateLimit?: RateLimiterId | RateLimitIds;

  /** Role/Rples needed to  access the endpoint*/
  requirePermission?: PermissionId | PermissionId[];

  /** Endpoint is only available if configuration allows it */
  requireConfiguration?: RequireConfiguration | RequireConfiguration[];
};

/**
 *
 * @param metadata Ensure the type of metadata is `EndpointMetadata`.
 * Ts-rest does not allow to specify the type of `metadata`.
 * @returns
 */
export function meta(metadata: EndpointMetadata): EndpointMetadata {
  return metadata;
}

export type RequestAuthenticationOptions = {
  /** Endpoint is accessible without any authentication. If `false` bearer authentication is required. */
  isPublic?: boolean;
  /** Endpoint is accessible with ape key authentication in  _addition_ to the bearer authentication. */
  acceptApeKeys?: boolean;
  /** Endpoint requires an authentication token which is younger than one minute.  */
  requireFreshToken?: boolean;
  noCache?: boolean;
  /** Allow unauthenticated requests on dev  */
  isPublicOnDev?: boolean;
  /** Endpoint is a webhook only to be called by Github */
  isGithubWebhook?: boolean;
};

export const MonkeyResponseSchema = z.object({
  message: z.string(),
});
export type MonkeyResponseType = z.infer<typeof MonkeyResponseSchema>;

export const MonkeyValidationErrorSchema = MonkeyResponseSchema.extend({
  validationErrors: z.array(z.string()),
});
export type MonkeyValidationError = z.infer<typeof MonkeyValidationErrorSchema>;

export const MonkeyClientError = MonkeyResponseSchema;
export type MonkeyClientErrorType = z.infer<typeof MonkeyClientError>;

export const MonkeyServerError = MonkeyClientError.extend({
  errorId: z.string(),
  uid: z.string().optional(),
});
export type MonkeyServerErrorType = z.infer<typeof MonkeyServerError>;

export function responseWithNullableData<T extends ZodSchema>(
  dataSchema: T,
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
  dataSchema: T,
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
    "Authentication required but not provided or invalid",
  ),
  403: MonkeyClientError.describe("Operation not permitted"),
  422: MonkeyValidationErrorSchema.describe("Request validation failed"),
  429: MonkeyClientError.describe("Rate limit exceeded"),
  470: MonkeyClientError.describe("Invalid ApeKey"),
  471: MonkeyClientError.describe("ApeKey is inactive"),
  472: MonkeyClientError.describe("ApeKey is malformed"),
  479: MonkeyClientError.describe("ApeKey rate limit exceeded"),
  500: MonkeyServerError.describe("Generic server error"),
  503: MonkeyServerError.describe(
    "Endpoint disabled or server is under maintenance",
  ),
};

export type CommonResponsesType =
  | {
      status: 400 | 401 | 403 | 429 | 470 | 471 | 472 | 479;
      body: MonkeyClientErrorType;
    }
  | {
      status: 422;
      body: MonkeyValidationError;
    }
  | {
      status: 500 | 503;
      body: MonkeyServerErrorType;
    };
