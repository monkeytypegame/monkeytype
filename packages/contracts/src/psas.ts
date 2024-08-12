import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { PSASchema } from "./schemas/psas";

import {
  CommonResponses,
  EndpointMetadata,
  responseWithData,
} from "./schemas/api";
export const GetPsaResponseSchema = responseWithData(z.array(PSASchema));
export type GetPsaResponse = z.infer<typeof GetPsaResponseSchema>;

const c = initContract();
export const psasContract = c.router(
  {
    get: {
      summary: "get psas",
      description: "Get list of public service announcements",
      method: "GET",
      path: "",
      responses: {
        200: GetPsaResponseSchema,
      },
    },
  },
  {
    pathPrefix: "/psas",
    strictStatusCodes: true,
    metadata: {
      openApiTags: "psas",
      authenticationOptions: {
        isPublic: true,
      },
    } as EndpointMetadata,
    commonResponses: CommonResponses,
  }
);
