export type InsertInputType =
  | "insertText"
  | "insertCompositionText"
  | "insertFromComposition"
  | "insertLineBreak";
export type DeleteInputType = "deleteWordBackward" | "deleteContentBackward";

type SupportedInputType = InsertInputType | DeleteInputType;
const SUPPORTED_INPUT_TYPES: Set<SupportedInputType> = new Set([
  "insertText",
  "insertCompositionText",
  "insertFromComposition",
  "insertLineBreak",
  "deleteWordBackward",
  "deleteContentBackward",
]);

export function isSupportedInputType(
  inputType: string
): inputType is SupportedInputType {
  return SUPPORTED_INPUT_TYPES.has(inputType as SupportedInputType);
}
