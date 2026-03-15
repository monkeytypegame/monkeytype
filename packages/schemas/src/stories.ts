import { z } from "zod";

export const StoryLengthSchema = z.enum(["flash", "short", "epic"]);
export type StoryLength = z.infer<typeof StoryLengthSchema>;

export const StorySchema = z.object({
  id: z.number(),
  title: z.string(),
  length: StoryLengthSchema,
  paragraphs: z.array(z.string()),
});
export type Story = z.infer<typeof StorySchema>;

export const StoryFileSchema = z.object({
  language: z.string(),
  stories: z.array(StorySchema),
});
export type StoryFile = z.infer<typeof StoryFileSchema>;
