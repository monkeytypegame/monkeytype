import { initContract } from "@ts-rest/core";
import { z } from "zod";
import {
  CommonResponses,
  EndpointMetadata,
  MonkeyResponseSchema,
  responseWithData,
} from "./schemas/api";
import { IdSchema } from "./schemas/util";

export const ToggleBanRequestSchema = z.object({
  uid: IdSchema,
});
export type ToggleBanRequest = z.infer<typeof ToggleBanRequestSchema>;

export const ToggleBanResponseSchema = responseWithData(
  z.object({
    banned: z.boolean(),
  })
);
export type ToggleBanResponse = z.infer<typeof ToggleBanResponseSchema>;

export const AcceptReportsRequestSchema = z
  .array(z.object({ reportId: z.string() }).strict())
  .nonempty();
export type AcceptReportsRequest = z.infer<typeof AcceptReportsRequestSchema>;

export const RejectReportsRequestSchema = z
  .array(
    z.object({ reportId: z.string(), reason: z.string().optional() }).strict()
  )
  .nonempty();
export type RejectReportsRequest = z.infer<typeof RejectReportsRequestSchema>;

export const SendForgotPasswordEmailRequestSchema = z.object({
  email: z.string().email(),
});
export type SendForgotPasswordEmailRequest = z.infer<
  typeof SendForgotPasswordEmailRequestSchema
>;

const c = initContract();
export const adminContract = c.router(
  {
    test: {
      summary: "test permission",
      description: "Check for admin permission for the current user",
      method: "GET",
      path: "/",
      responses: {
        200: MonkeyResponseSchema,
      },
    },
    toggleBan: {
      summary: "toggle user ban",
      description: "Ban an unbanned user or unban a banned user.",
      method: "POST",
      path: "/toggleBan",
      body: ToggleBanRequestSchema.strict(),
      responses: {
        200: ToggleBanResponseSchema,
      },
    },
    acceptReports: {
      summary: "accept reports",
      description: "Accept one or many reports",
      method: "POST",
      path: "/report/accept",
      body: AcceptReportsRequestSchema,
      responses: {
        200: MonkeyResponseSchema,
      },
    },
    rejectReports: {
      summary: "reject reports",
      description: "Reject one or many reports",
      method: "POST",
      path: "/report/reject",
      body: RejectReportsRequestSchema,
      responses: {
        200: MonkeyResponseSchema,
      },
    },
    sendForgotPasswordEmail: {
      summary: "send forgot password email",
      description: "Send a forgot password email to the given user email",
      method: "POST",
      path: "/sendForgotPasswordEmail",
      body: SendForgotPasswordEmailRequestSchema.strict(),
      responses: {
        200: MonkeyResponseSchema,
      },
    },
  },
  {
    pathPrefix: "/admin",
    strictStatusCodes: true,
    metadata: {
      openApiTags: "admin",
      authenticationOptions: { noCache: true }, //TODO test
    } as EndpointMetadata,

    commonResponses: CommonResponses,
  }
);
