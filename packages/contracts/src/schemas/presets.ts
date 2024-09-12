import { z } from "zod";
import { IdSchema, TagSchema } from "./util";
import { PartialConfigSchema } from "./configs";

export const PresetNameSchema = z
  .string()
  .regex(/^[0-9a-zA-Z_-]+$/)
  .max(16);
export type PresentName = z.infer<typeof PresetNameSchema>;

export const PresetTypeSchema = z.enum(["full", "partial"]);
export type PresetType = z.infer<typeof PresetTypeSchema>;

export const PresetSettingGroupSchema = z.enum([
  "test",
  "behavior",
  "input",
  "sound",
  "caret",
  "appearance",
  "theme",
  "hideElements",
  "ads",
  "hidden",
]);
export type PresetSettingGroup = z.infer<typeof PresetSettingGroupSchema>;
export const ActiveSettingGroupsSchema = z
  .array(PresetSettingGroupSchema)
  .min(1)
  .superRefine((settingList, ctx) => {
    PresetSettingGroupSchema.options.forEach(
      (presetSettingGroup: PresetSettingGroup) => {
        const duplicateElemExits: boolean =
          settingList.filter(
            (settingGroup: PresetSettingGroup) =>
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
export type ActiveSettingGroups = z.infer<typeof ActiveSettingGroupsSchema>;

export const PresetSchema = z.object({
  _id: IdSchema,
  name: PresetNameSchema,
  settingGroups: ActiveSettingGroupsSchema.nullable().optional(),
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
