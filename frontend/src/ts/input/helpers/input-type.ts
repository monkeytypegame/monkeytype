export type InsertInputType =
  | "insertText"
  | "insertCompositionText"
  | "insertLineBreak";

export type DeleteInputType = "deleteWordBackward" | "deleteContentBackward";

export type SupportedInputType = InsertInputType | DeleteInputType;

const SUPPORTED_INPUT_TYPES: Set<SupportedInputType> = new Set([
  "insertText",
  "insertCompositionText",
  "insertLineBreak",
  "deleteWordBackward",
  "deleteContentBackward",
]);

export function isSupportedInputType(
  inputType: string
): inputType is SupportedInputType {
  return SUPPORTED_INPUT_TYPES.has(inputType as SupportedInputType);
}
