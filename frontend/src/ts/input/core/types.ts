export type SupportedInputType =
  | "insertText"
  | "insertCompositionText"
  | "deleteWordBackward"
  | "insertLineBreak"
  | "deleteContentBackward";

export type InputEventHandler = {
  event: Event;
  now: number;
  inputType: SupportedInputType;
};

export type OnInsertTextParams = InputEventHandler & {
  data: string;
};
