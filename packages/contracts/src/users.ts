import { initContract } from "@ts-rest/core";
import { z } from "zod";

import {
  CommonResponses,
  EndpointMetadata,
  MonkeyResponseSchema,
  responseWithData,
} from "./schemas/api";
import { ResultFiltersSchema, UserSchema } from "./schemas/users";
import { Mode2Schema, ModeSchema } from "./schemas/shared";
import { IdSchema, LanguageSchema } from "./schemas/util";

export const GetUserResponseSchema = responseWithData(UserSchema);
export type GetUserResponse = z.infer<typeof GetUserResponseSchema>;

const UserNameSchema = z
  .string()
  .min(1)
  .max(16)
  .regex(/^[\da-zA-Z_-]+$/); //todo profanity

export const CreateUserRequestSchema = z.object({
  email: z.string().email(),
  name: UserNameSchema,
  uid: z.string(), //defined by firebase, no validation should be applied
  captcha: z.string(), //defined by google recaptcha, no validation should be applied
});
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;

export const CheckNamePathParametersSchema = z.object({
  name: UserNameSchema,
});
export type CheckNamePathParameters = z.infer<
  typeof CheckNamePathParametersSchema
>;

export const UpdateUserNameRequestSchema = z.object({
  name: UserNameSchema,
});
export type UpdateUserNameRequest = z.infer<typeof UpdateUserNameRequestSchema>;

export const UpdateLeaderboardMemoryRequestSchema = z.object({
  mode: ModeSchema,
  mode2: Mode2Schema,
  language: LanguageSchema,
  rank: z.number().int().nonnegative(),
});
export type UpdateLeaderboardMemoryRequest = z.infer<
  typeof UpdateLeaderboardMemoryRequestSchema
>;

export const UpdateEmailRequestSchema = z.object({
  newEmail: z.string().email(),
  previousEmail: z.string().email(),
});
export type UpdateEmailRequestSchema = z.infer<typeof UpdateEmailRequestSchema>;

export const UpdatePasswordRequestSchema = z.object({
  newPassword: z.string().min(6),
});
export type UpdatePasswordRequest = z.infer<typeof UpdatePasswordRequestSchema>;

export const AddResultFilterPresetRequestSchema = ResultFiltersSchema;
export type AddResultFilterPresetRequest = z.infer<
  typeof AddResultFilterPresetRequestSchema
>;
export const AddResultFilterPresetResponseSchema = responseWithData(
  IdSchema.describe("Id of the created result filter preset")
);
export type AddResultFilterPresetResponse = z.infer<
  typeof AddResultFilterPresetResponseSchema
>;

const c = initContract();

export const usersContract = c.router(
  {
    get: {
      summary: "get user",
      description: "Get a user's data.",
      method: "GET",
      path: "",
      responses: {
        200: GetUserResponseSchema,
      },
    },
    create: {
      summary: "create user",
      description: "Creates a new user",
      method: "POST",
      path: "/signup",
      body: CreateUserRequestSchema.strict(),
      responses: {
        200: MonkeyResponseSchema,
      },
    },
    getNameAvailability: {
      summary: "check name",
      description: "Checks to see if a username is available",
      method: "GET",
      path: "/checkName:name",
      pathParams: CheckNamePathParametersSchema.strict(),
      responses: {
        200: MonkeyResponseSchema.describe("Name is available"),
        400: MonkeyResponseSchema.describe("Name is not available"),
      },
      metadata: {
        authenticationOptions: {
          isPublic: true,
        },
      } as EndpointMetadata,
    },
    delete: {
      summary: "delete user",
      description: "Deletes a user's account",
      method: "DELETE",
      path: "",
      body: c.noBody(),
      responses: {
        200: MonkeyResponseSchema,
      },
      metadata: {
        authenticationOptions: {
          requireFreshToken: true,
        },
      } as EndpointMetadata,
    },
    reset: {
      summary: "reset user",
      description: "Completely resets a user's account to a blank state",
      method: "PATCH",
      path: "/reset",
      body: c.noBody(),
      responses: {
        200: MonkeyResponseSchema,
      },
      metadata: {
        authenticationOptions: {
          requireFreshToken: true,
        },
      } as EndpointMetadata,
    },
    updateName: {
      summary: "update username",
      description: "Updates a user's name",
      method: "PATCH",
      path: "/name",
      body: UpdateUserNameRequestSchema.strict(),
      responses: {
        200: MonkeyResponseSchema,
      },
      metadata: {
        authenticationOptions: {
          requireFreshToken: true,
        },
      } as EndpointMetadata,
    },
    updateLeaderboardMemory: {
      summary: "update lbMemory",
      description: "Updates a user's cached leaderboard state",
      method: "PATCH",
      path: "/leaderboardMemory",
      body: UpdateLeaderboardMemoryRequestSchema.strict(),
      responses: {
        200: MonkeyResponseSchema,
      },
    },
    updateEmail: {
      summary: "update email",
      description: "Updates a user's email",
      method: "PATCH",
      path: "/email",
      body: UpdateEmailRequestSchema.strict(),
      responses: {
        200: MonkeyResponseSchema,
      },
      metadata: {
        authenticationOptions: {
          requireFreshToken: true,
        },
      } as EndpointMetadata,
    },
    updatePassword: {
      summary: "update password",
      description: "Updates a user's email",
      method: "PATCH",
      path: "/password",
      body: UpdatePasswordRequestSchema.strict(),
      responses: {
        200: MonkeyResponseSchema,
      },
      metadata: {
        authenticationOptions: {
          requireFreshToken: true,
        },
      } as EndpointMetadata,
    },
    deletePersonalBests: {
      summary: "delete personal bests",
      description: "Deletes a user's personal bests",
      method: "DELETE",
      path: "/personalBests",
      body: c.noBody(),
      responses: {
        200: MonkeyResponseSchema,
      },
      metadata: {
        authenticationOptions: {
          requireFreshToken: true,
        },
      } as EndpointMetadata,
    },
    optOutOfLeaderboards: {
      summary: "leaderboards opt out",
      description: "Opt out of the leaderboards",
      method: "POST",
      path: "/optOutOfLeaderboards",
      body: c.noBody(),
      responses: {
        200: MonkeyResponseSchema,
      },
      metadata: {
        authenticationOptions: {
          requireFreshToken: true,
        },
      } as EndpointMetadata,
    },
    addResultFilterPreset: {
      summary: "add result filter preset",
      description: "Sdd a result filter preset",
      method: "POST",
      path: "/resultFilterPresets",
      body: AddResultFilterPresetRequestSchema.strict(),
      responses: {
        200: AddResultFilterPresetResponseSchema,
      },
    },
  },
  {
    pathPrefix: "/users",
    strictStatusCodes: true,
    metadata: {
      openApiTags: "users",
    } as EndpointMetadata,

    commonResponses: CommonResponses,
  }
);
