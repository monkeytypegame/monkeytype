import { initContract } from "@ts-rest/core";
import { z } from "zod";

import {
  CommonResponses,
  EndpointMetadata,
  MonkeyResponseSchema,
  responseWithData,
} from "./schemas/api";
import { PresetSchema } from "./schemas/presets";
import { IdSchema } from "./schemas/util";

export const GetPresetResponseSchema = responseWithData(z.array(PresetSchema));
export type GetPresetResponse = z.infer<typeof GetPresetResponseSchema>;

export const AddPresetRequestSchema = PresetSchema.omit({ _id: true });
export type AddPresetRequest = z.infer<typeof AddPresetRequestSchema>;

export const AddPresetResponseSchemna = responseWithData(
  z.object({ presetId: IdSchema })
);
export type AddPresetResponse = z.infer<typeof AddPresetResponseSchemna>;

export const DeletePresetsParamsSchema = z.object({
  presetId: IdSchema,
});
export type DeletePresetsParams = z.infer<typeof DeletePresetsParamsSchema>;

const c = initContract();

export const presetsContract = c.router(
  {
    get: {
      summary: "get presets",
      description: "Get presets of the current user.",
      method: "GET",
      path: "",
      responses: {
        200: GetPresetResponseSchema,
      },
    },
    add: {
      summary: "add preset",
      description: "Add a new preset for the current user.",
      method: "POST",
      path: "",
      body: AddPresetRequestSchema.strict(),
      responses: {
        200: AddPresetResponseSchemna,
      },
    },
    save: {
      summary: "update preset",
      description: "Update an existing preset for the current user.",
      method: "PATCH",
      path: "",
      body: PresetSchema.strict(),
      responses: {
        200: MonkeyResponseSchema,
      },
    },
    delete: {
      method: "DELETE",
      path: "/:presetId",
      pathParams: DeletePresetsParamsSchema,
      body: c.noBody(),
      responses: {
        200: MonkeyResponseSchema,
      },
      summary: "delete preset",
      description: "Delete preset by id.",
    },
  },
  {
    pathPrefix: "/presets",
    strictStatusCodes: true,
    metadata: {
      openApiTags: "presets",
    } as EndpointMetadata,

    commonResponses: CommonResponses,
  }
);
