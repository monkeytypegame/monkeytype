import { describe, expect, it } from "vitest";
import { convertLayoutToKeymap } from "../../../../src/ts/components/pages/test/keymapConverter";

import qwertyLayout from "../../../../static/layouts/qwerty.json";
import { LayoutObject } from "@monkeytype/schemas/layouts";

describe("keymap converter", () => {
  describe("convertLayoutToKeymap", () => {
    it("converts qwerty staggered", () => {
      const result = convertLayoutToKeymap(qwertyLayout as LayoutObject, {
        displayName: "qwerty",
        keymapStyle: "staggered",
        showAllKeys: false,
      });

      expect(result.row1).toEqual([
        {
          height: 1,
          legends: ["1", "!", "1", "!"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["2", "@", "2", "@"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["3", "#", "3", "#"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["4", "$", "4", "$"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["5", "%", "5", "%"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["6", "^", "6", "^"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["7", "&", "7", "&"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["8", "*", "8", "*"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["9", "(", "9", "("],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["0", ")", "0", ")"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["-", "_", "-", "_"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["=", "+", "=", "+"],
          width: 1,
          x: 0,
        },
      ]);

      expect(result.row2).toEqual([
        {
          height: 1,
          legends: ["q", "Q", "q", "Q"],
          width: 1,
          x: 2,
        },
        {
          height: 1,
          legends: ["w", "W", "w", "W"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["e", "E", "e", "E"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["r", "R", "r", "R"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["t", "T", "t", "T"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["y", "Y", "y", "Y"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["u", "U", "u", "U"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["i", "I", "i", "I"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["o", "O", "o", "O"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["p", "P", "p", "P"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["[", "{", "[", "{"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["]", "}", "]", "}"],
          width: 1,
          x: 0,
        },
      ]);

      expect(result.row3).toEqual([
        {
          height: 1,
          legends: ["a", "A", "a", "A"],
          width: 1,
          x: 4,
        },
        {
          height: 1,
          legends: ["s", "S", "s", "S"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["d", "D", "d", "D"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["f", "F", "f", "F"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["g", "G", "g", "G"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["h", "H", "h", "H"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["j", "J", "j", "J"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["k", "K", "k", "K"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["l", "L", "l", "L"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: [";", ":", ";", ":"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["'", '"', "'", '"'],
          width: 1,
          x: 0,
        },
      ]);

      expect(result.row4).toEqual([
        {
          height: 1,
          legends: ["z", "Z", "z", "Z"],
          width: 1,
          x: 6,
        },
        {
          height: 1,
          legends: ["x", "X", "x", "X"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["c", "C", "c", "C"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["v", "V", "v", "V"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["b", "B", "b", "B"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["n", "N", "n", "N"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["m", "M", "m", "M"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: [",", "<", ",", "<"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: [".", ">", ".", ">"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["/", "?", "/", "?"],
          width: 1,
          x: 0,
        },
      ]);

      expect(result.row5).toEqual([
        {
          legends: ["qwerty", "qwerty", "qwerty", "qwerty"],
          height: 1,
          width: 6.25,
          x: 3,
        },
      ]);
    });

    it("converts qwerty staggered", () => {
      const result = convertLayoutToKeymap(qwertyLayout as LayoutObject, {
        displayName: "qwerty",
        keymapStyle: "staggered",
        showAllKeys: true,
      });

      expect(result.row1).toEqual([
        {
          height: 1,
          legends: ["`", "~", "`", "~"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["1", "!", "1", "!"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["2", "@", "2", "@"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["3", "#", "3", "#"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["4", "$", "4", "$"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["5", "%", "5", "%"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["6", "^", "6", "^"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["7", "&", "7", "&"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["8", "*", "8", "*"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["9", "(", "9", "("],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["0", ")", "0", ")"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["-", "_", "-", "_"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["=", "+", "=", "+"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["BS", "BS", "BS", "BS"],
          width: 2,
          x: 0,
        },
      ]);

      expect(result.row2).toEqual([
        {
          height: 1,
          legends: ["Tab", "Tab", "Tab", "Tab"],
          width: 1.5,
          x: 0,
        },
        {
          height: 1,
          legends: ["q", "Q", "q", "Q"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["w", "W", "w", "W"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["e", "E", "e", "E"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["r", "R", "r", "R"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["t", "T", "t", "T"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["y", "Y", "y", "Y"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["u", "U", "u", "U"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["i", "I", "i", "I"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["o", "O", "o", "O"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["p", "P", "p", "P"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["[", "{", "[", "{"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["]", "}", "]", "}"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["\\", "|", "\\", "|"],
          width: 1.5,
          x: 0,
        },
      ]);

      expect(result.row3).toEqual([
        {
          height: 1,
          legends: ["Caps", "Caps", "Caps", "Caps"],
          width: 1.75,
          x: 0,
        },
        {
          height: 1,
          legends: ["a", "A", "a", "A"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["s", "S", "s", "S"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["d", "D", "d", "D"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["f", "F", "f", "F"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["g", "G", "g", "G"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["h", "H", "h", "H"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["j", "J", "j", "J"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["k", "K", "k", "K"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["l", "L", "l", "L"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: [";", ":", ";", ":"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["'", '"', "'", '"'],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["Enter", "Enter", "Enter", "Enter"],
          width: 2.25,
          x: 0,
        },
      ]);

      expect(result.row4).toEqual([
        {
          height: 1,
          legends: ["Shift", "Shift", "Shift", "Shift"],
          width: 2.25,
          x: 0,
        },
        {
          height: 1,
          legends: ["z", "Z", "z", "Z"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["x", "X", "x", "X"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["c", "C", "c", "C"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["v", "V", "v", "V"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["b", "B", "b", "B"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["n", "N", "n", "N"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["m", "M", "m", "M"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: [",", "<", ",", "<"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: [".", ">", ".", ">"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["/", "?", "/", "?"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["Shift", "Shift", "Shift", "Shift"],
          width: 2.75,
          x: 0,
        },
      ]);

      expect(result.row5).toEqual([
        {
          height: 1,
          legends: ["Alt", "Alt", "Alt", "Alt"],
          width: 1.25,
          x: 0,
        },
        {
          height: 1,
          legends: ["Monke", "Monke", "Monke", "Monke"],
          width: 1.25,
          x: 0,
        },
        {
          height: 1,
          legends: ["Ctrl", "Ctrl", "Ctrl", "Ctrl"],
          width: 1.25,
          x: 0,
        },
        {
          height: 1,
          legends: ["qwerty", "qwerty", "qwerty", "qwerty"],
          width: 6.25,
          x: 0,
        },
        {
          height: 1,
          legends: ["Ctrl", "Ctrl", "Ctrl", "Ctrl"],
          width: 1.25,
          x: 0,
        },
        {
          height: 1,
          legends: ["Monke", "Monke", "Monke", "Monke"],
          width: 1.25,
          x: 0,
        },
        {
          height: 1,
          legends: ["Meta", "Meta", "Meta", "Meta"],
          width: 1.25,
          x: 0,
        },
        {
          height: 1,
          legends: ["Ctrl", "Ctrl", "Ctrl", "Ctrl"],
          width: 1.25,
          x: 0,
        },
      ]);
    });

    it("converts qwerty split", () => {
      const result = convertLayoutToKeymap(qwertyLayout as LayoutObject, {
        displayName: "qwerty",
        keymapStyle: "split",
        showAllKeys: false,
      });

      expect(result.row1).toEqual([
        {
          height: 1,
          legends: ["1", "!", "1", "!"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["2", "@", "2", "@"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["3", "#", "3", "#"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["4", "$", "4", "$"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["5", "%", "5", "%"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["6", "^", "6", "^"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["7", "&", "7", "&"],
          width: 1,
          x: 8,
        },
        {
          height: 1,
          legends: ["8", "*", "8", "*"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["9", "(", "9", "("],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["0", ")", "0", ")"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["-", "_", "-", "_"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["=", "+", "=", "+"],
          width: 1,
          x: 0,
        },
      ]);

      expect(result.row2).toEqual([
        {
          height: 1,
          legends: ["q", "Q", "q", "Q"],
          width: 1,
          x: 2,
        },
        {
          height: 1,
          legends: ["w", "W", "w", "W"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["e", "E", "e", "E"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["r", "R", "r", "R"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["t", "T", "t", "T"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["y", "Y", "y", "Y"],
          width: 1,
          x: 8,
        },
        {
          height: 1,
          legends: ["u", "U", "u", "U"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["i", "I", "i", "I"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["o", "O", "o", "O"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["p", "P", "p", "P"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["[", "{", "[", "{"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["]", "}", "]", "}"],
          width: 1,
          x: 0,
        },
      ]);

      expect(result.row3).toEqual([
        {
          height: 1,
          legends: ["a", "A", "a", "A"],
          width: 1,
          x: 4,
        },
        {
          height: 1,
          legends: ["s", "S", "s", "S"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["d", "D", "d", "D"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["f", "F", "f", "F"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["g", "G", "g", "G"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["h", "H", "h", "H"],
          width: 1,
          x: 8,
        },
        {
          height: 1,
          legends: ["j", "J", "j", "J"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["k", "K", "k", "K"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["l", "L", "l", "L"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: [";", ":", ";", ":"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["'", '"', "'", '"'],
          width: 1,
          x: 0,
        },
      ]);

      expect(result.row4).toEqual([
        {
          height: 1,
          legends: ["z", "Z", "z", "Z"],
          width: 1,
          x: 6,
        },
        {
          height: 1,
          legends: ["x", "X", "x", "X"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["c", "C", "c", "C"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["v", "V", "v", "V"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["b", "B", "b", "B"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["n", "N", "n", "N"],
          width: 1,
          x: 8,
        },
        {
          height: 1,
          legends: ["m", "M", "m", "M"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: [",", "<", ",", "<"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: [".", ">", ".", ">"],
          width: 1,
          x: 0,
        },
        {
          height: 1,
          legends: ["/", "?", "/", "?"],
          width: 1,
          x: 0,
        },
      ]);

      expect(result.row5).toEqual([
        {
          legends: ["qwerty", "qwerty", "qwerty", "qwerty"],
          height: 1,
          width: 3,
          x: 23,
        },
        {
          legends: ["", "", "", ""],
          height: 1,
          width: 3,
          x: 8,
        },
      ]);
    });
  });
});
