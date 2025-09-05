const SUPPORTED_INPUT_TYPES = [
  "insertText",
  "insertCompositionText",
  "deleteWordBackward",
  "insertLineBreak",
  "deleteContentBackward",
] as const;

export type SupportedInputType = (typeof SUPPORTED_INPUT_TYPES)[number];

export function isSupportedInputType(
  inputType: string
): inputType is SupportedInputType {
  return [
    "insertText",
    "insertCompositionText",
    "deleteWordBackward",
    "insertLineBreak",
    "deleteContentBackward",
  ].includes(inputType);
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
