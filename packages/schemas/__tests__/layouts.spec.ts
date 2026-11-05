import { it, expect, describe } from "vitest";
import { LayoutNameSchema, LayoutObjectSchema } from "../src/layouts";

const validAnsILayout = {
  keymapShowTopRow: true,
  matrixShowRightColumn: false,
  type: "ansi",
  keys: {
    row1: [
      ["`", "~"],
      ["1", "!"],
      ["2", "@"],
      ["3", "#"],
      ["4", "$"],
      ["5", "%"],
      ["6", "^"],
      ["7", "&"],
      ["8", "*"],
      ["9", "("],
      ["0", ")"],
      ["-", "_"],
      ["=", "+"],
    ],
    row2: [
      ["q", "Q"],
      ["w", "W"],
      ["e", "E"],
      ["r", "R"],
      ["t", "T"],
      ["y", "Y"],
      ["u", "U"],
      ["i", "I"],
      ["o", "O"],
      ["p", "P"],
      ["[", "{"],
      ["]", "}"],
      ["\\", "|"],
    ],
    row3: [
      ["a", "A"],
      ["s", "S"],
      ["d", "D"],
      ["f", "F"],
      ["g", "G"],
      ["h", "H"],
      ["j", "J"],
      ["k", "K"],
      ["l", "L"],
      [";", ":"],
      ["'", '"'],
    ],
    row4: [
      ["z", "Z"],
      ["x", "X"],
      ["c", "C"],
      ["v", "V"],
      ["b", "B"],
      ["n", "N"],
      ["m", "M"],
      [",", "<"],
      [".", ">"],
      ["/", "?"],
    ],
    row5: [[" "]],
  },
};

const validIsoLayout = {
  keymapShowTopRow: true,
  matrixShowRightColumn: false,
  type: "iso",
  keys: {
    row1: [
      ["\\", "|"],
      ["1", "!"],
      ["2", '"'],
      ["3", "#"],
      ["4", "$"],
      ["5", "%"],
      ["6", "&"],
      ["7", "/"],
      ["8", "("],
      ["9", ")"],
      ["0", "="],
      ["'", "?"],
      ["«", "»"],
    ],
    row2: [
      ["q", "Q"],
      ["w", "W"],
      ["e", "E"],
      ["r", "R"],
      ["t", "T"],
      ["y", "Y"],
      ["u", "U"],
      ["i", "I"],
      ["o", "O"],
      ["p", "P"],
      ["+", "*"],
      ["´", "`"],
    ],
    row3: [
      ["a", "A"],
      ["s", "S"],
      ["d", "D"],
      ["f", "F"],
      ["g", "G"],
      ["h", "H"],
      ["j", "J"],
      ["k", "K"],
      ["l", "L"],
      ["ç", "Ç"],
      ["º", "ª"],
      ["~", "^"],
    ],
    row4: [
      ["<", ">"],
      ["z", "Z"],
      ["x", "X"],
      ["c", "C"],
      ["v", "V"],
      ["b", "B"],
      ["n", "N"],
      ["m", "M"],
      [",", ";"],
      [".", ":"],
      ["-", "_"],
    ],
    row5: [[" "]],
  },
};

const validMatrixLayout = {
  keymapShowTopRow: true,
  matrixShowRightColumn: false,
  type: "matrix",
  keys: {
    row1: [],
    row2: [
      ["q", "Q"],
      ["w", "W"],
      ["e", "E"],
      ["r", "R"],
      ["t", "T"],
      ["y", "Y"],
      ["u", "U"],
      ["i", "I"],
      ["o", "O"],
      ["p", "P"],
    ],
    row3: [
      ["a", "A"],
      ["s", "S"],
      ["d", "D"],
      ["f", "F"],
      ["g", "G"],
      ["h", "H"],
      ["j", "J"],
      ["k", "K"],
      ["l", "L"],
      [";", ":"],
    ],
    row4: [
      ["z", "Z"],
      ["x", "X"],
      ["c", "C"],
      ["v", "V"],
    ],
    row5: [],
  },
};

describe("layouts schemas", () => {
  describe("LayoutObjectSchema", () => {
    it.each([
      { description: "valid ansi layout", input: validAnsILayout },
      { description: "valid iso layout", input: validIsoLayout },
      { description: "valid matrix layout", input: validMatrixLayout },
      {
        description: "invalid - missing required field",
        input: { keymapShowTopRow: true },
        expectedError: "Invalid input",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(LayoutObjectSchema).toReject(input, expectedError);
      } else {
        expect(LayoutObjectSchema).toValidate(input);
      }
    });
  });

  describe("LayoutNameSchema", () => {
    it.each([
      { description: "valid layout qwerty", input: "qwerty" },
      { description: "valid layout dvorak", input: "dvorak" },
      { description: "valid layout colemak_dh", input: "colemak_dh" },
      {
        description: "invalid layout",
        input: "invalid_layout",
        expectedError: "Must be a supported layout",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(LayoutNameSchema).toReject(input, expectedError);
      } else {
        expect(LayoutNameSchema).toValidate(input);
      }
    });
  });
});
