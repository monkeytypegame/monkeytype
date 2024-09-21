type Mode = import("@monkeytype/contracts/schemas/shared").Mode;
// type Result<M extends Mode> =
//   import("@monkeytype/contracts/schemas/results").Result<M>;
type IncompleteTest =
  import("@monkeytype/contracts/schemas/results").IncompleteTest;

declare namespace MonkeyTypes {
  type CustomTextLimit = {
    value: number;
    mode: import("@monkeytype/contracts/schemas/util").CustomTextLimitMode;
  };

  type CustomTextData = Omit<
    import("@monkeytype/contracts/schemas/results").CustomTextDataWithTextLen,
    "textLen"
  > & {
    text: string[];
  };
}
