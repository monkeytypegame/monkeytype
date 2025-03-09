import { z } from "zod";
import { IdSchema, TagSchema } from "./util";
import {
  ConfigGroupName,
  ConfigGroupNameSchema,
  PartialConfigSchema,
} from "./configs";

export const PresetNameSchema = z
  .string()
  .regex(/^[0-9a-zA-Z_-]+$/)
  .max(16);
export type PresentName = z.infer<typeof PresetNameSchema>;

export const PresetTypeSchema = z.enum(["full", "partial"]);
export type PresetType = z.infer<typeof PresetTypeSchema>;

const PresetSettingsGroupsSchema = z
  .array(ConfigGroupNameSchema)
  .min(1)
  .superRefine((settingList, ctx) => {
    ConfigGroupNameSchema.options.forEach(
      (presetSettingGroup: ConfigGroupName) => {
        const duplicateElemExits: boolean =
          settingList.filter(
            (settingGroup: ConfigGroupName) =>
              settingGroup === presetSettingGroup
          ).length > 1;
        if (duplicateElemExits) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `No duplicates allowed.`,
          });
        }
      }
    );
  });

export const PresetSchema = z.object({
  _id: IdSchema,
  name: PresetNameSchema,
  settingGroups: PresetSettingsGroupsSchema.nullable().optional(),
  config: PartialConfigSchema.extend({
    tags: z.array(TagSchema).optional(),
  }),
});
export type Preset = z.infer<typeof PresetSchema>;

export const EditPresetRequestSchema = PresetSchema.partial({
  config: true,
  settingGroups: true,
});

export type EditPresetRequest = z.infer<typeof EditPresetRequestSchema>;
