import { z } from "zod";
import { IdSchema, TagSchema } from "./util";
import { PartialConfigSchema } from "./configs";

export const PresetNameSchema = z
  .string()
  .regex(/^[0-9a-zA-Z_-]+$/)
  .max(16);
export type PresentName = z.infer<typeof PresetNameSchema>;

export enum SettingGroup {
  behaviour = "behaviour",
  input = "input",
  sound = "sound",
  caret = "caret",
  theme = "theme",
  hideElements = "hide elements",
  tags = "tags",
  ads = "ads",
}
export const presetSettingGroupSchema = z.nativeEnum(SettingGroup);
export type PresetSettingGroup = z.infer<typeof presetSettingGroupSchema>;
export const activeSettingGroupsSchema = z
  .array(presetSettingGroupSchema) //add unique property here
  .min(1)
  .superRefine((settingList, ctx) => {
    settingList.forEach((val1, ind1) => {
      settingList.forEach((val2, ind2) => {
        if (ind1 === ind2) return;
        if (val1 === val2) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `No duplicates allowed.`,
          });
        }
      });
    });
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
