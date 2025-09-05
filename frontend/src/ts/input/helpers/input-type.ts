export type InsertInputType =
  | "insertText"
  | "insertCompositionText"
  | "insertLineBreak";

export type DeleteInputType = "deleteWordBackward" | "deleteContentBackward";

export type SupportedInputType = InsertInputType | DeleteInputType;

const SUPPORTED_INPUT_TYPES: Set<SupportedInputType> = new Set([
  "insertText",
  "insertCompositionText",
  "deleteWordBackward",
  "insertLineBreak",
  "deleteContentBackward",
]);

export function isSupportedInputType(
  inputType: string
): inputType is SupportedInputType {
  return SUPPORTED_INPUT_TYPES.has(inputType as SupportedInputType);
}

const IGNORED_INPUT_TYPES = [
  "insertReplacementText", //todo reconsider
  "insertParagraph",
  "insertOrderedList",
  "insertUnorderedList",
  "insertHorizontalRule",
  "insertFromYank",
  "insertFromDrop",
  "insertFromPaste",
  "insertFromPasteAsQuotation",
  "insertTranspose",
  "insertLink",
  "deleteSoftLineBackward",
  "deleteSoftLineForward",
  "deleteEntireSoftLine",
  "deleteHardLineBackward",
  "deleteHardLineForward",
  "deleteByDrag",
  "deleteByCut",
  "deleteContent", // might break things?
  "deleteContentForward",
  "history*",
  "format*",
] as const;

export function isIgnoredInputType(inputType: string): boolean {
  return IGNORED_INPUT_TYPES.some((type) => {
    if (type.endsWith("*")) {
      return inputType.startsWith(type.slice(0, -1));
    } else {
      return inputType === type;
    }
  });
}
