import { z } from "zod";
import { IdSchema, TagSchema } from "./util";
import { PartialConfigSchema } from "./configs";

export const PresetNameSchema = z
  .string()
  .regex(/^[0-9a-zA-Z_-]+$/)
  .max(16);
export type PresentName = z.infer<typeof PresetNameSchema>;

export const presetSettingGroupSchema = z.enum([
  "test",
  "account",
  "behaviour",
  "input",
  "sound",
  "caret",
  "appearance",
  "theme",
  "hide elements",
  "ads",
]);
export type PresetSettingGroup = z.infer<typeof presetSettingGroupSchema>;
export const activeSettingGroupsSchema = z
  .array(presetSettingGroupSchema)
  .min(1)
  .superRefine((settingList, ctx) => {
    presetSettingGroupSchema.options.forEach(
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
export type ActiveSettingGroups = z.infer<typeof activeSettingGroupsSchema>;

export const PresetSchema = z.object({
  _id: IdSchema,
  name: PresetNameSchema,
  config: PartialConfigSchema.extend({
    tags: z.array(TagSchema).optional(),
    settingGroups: activeSettingGroupsSchema,
  }),
});
export type Preset = z.infer<typeof PresetSchema>;
