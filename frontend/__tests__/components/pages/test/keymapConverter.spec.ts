import { describe, expect, it } from "vitest";
import { convertLayoutToKeymap } from "../../../../src/ts/components/pages/test/keymapConverter";

import qwertyLayout from "../../../../static/layouts/qwerty.json";
import qwertzLayout from "../../../../static/layouts/qwertz.json";

import { LayoutObject } from "@monkeytype/schemas/layouts";

describe("keymap converter", () => {
  describe("convertLayoutToKeymap", () => {
    it("converts qwerty staggered", () => {
      const result = convertLayoutToKeymap(qwertyLayout as LayoutObject, {
        displayName: "qwerty",
        keymapStyle: "staggered",
        showAllKeys: false,
      });

      expect(result.row1, "row1").toEqual([
        { legends: ["1", "!", "1", "!"] },
        { legends: ["2", "@", "2", "@"] },
        { legends: ["3", "#", "3", "#"] },
        { legends: ["4", "$", "4", "$"] },
        { legends: ["5", "%", "5", "%"] },
        { legends: ["6", "^", "6", "^"] },
        { legends: ["7", "&", "7", "&"] },
        { legends: ["8", "*", "8", "*"] },
        { legends: ["9", "(", "9", "("] },
        { legends: ["0", ")", "0", ")"] },
        { legends: ["-", "_", "-", "_"] },
        { legends: ["=", "+", "=", "+"] },
      ]);

      expect(result.row2, "row2").toEqual([
        { legends: ["q", "Q", "q", "Q"], x: 2 },
        { legends: ["w", "W", "w", "W"] },
        { legends: ["e", "E", "e", "E"] },
        { legends: ["r", "R", "r", "R"] },
        { legends: ["t", "T", "t", "T"] },
        { legends: ["y", "Y", "y", "Y"] },
        { legends: ["u", "U", "u", "U"] },
        { legends: ["i", "I", "i", "I"] },
        { legends: ["o", "O", "o", "O"] },
        { legends: ["p", "P", "p", "P"] },
        { legends: ["[", "{", "[", "{"] },
        { legends: ["]", "}", "]", "}"] },
      ]);

      expect(result.row3, "row3").toEqual([
        { legends: ["a", "A", "a", "A"], x: 4 },
        { legends: ["s", "S", "s", "S"] },
        { legends: ["d", "D", "d", "D"] },
        { legends: ["f", "F", "f", "F"] },
        { legends: ["g", "G", "g", "G"] },
        { legends: ["h", "H", "h", "H"] },
        { legends: ["j", "J", "j", "J"] },
        { legends: ["k", "K", "k", "K"] },
        { legends: ["l", "L", "l", "L"] },
        { legends: [";", ":", ";", ":"] },
        { legends: ["'", '"', "'", '"'] },
      ]);

      expect(result.row4, "row4").toEqual([
        { legends: ["z", "Z", "z", "Z"], x: 6 },
        { legends: ["x", "X", "x", "X"] },
        { legends: ["c", "C", "c", "C"] },
        { legends: ["v", "V", "v", "V"] },
        { legends: ["b", "B", "b", "B"] },
        { legends: ["n", "N", "n", "N"] },
        { legends: ["m", "M", "m", "M"] },
        { legends: [",", "<", ",", "<"] },
        { legends: [".", ">", ".", ">"] },
        { legends: ["/", "?", "/", "?"] },
      ]);

      expect(result.row5, "row5").toEqual([
        { legends: ["qwerty", "qwerty", "qwerty", "qwerty"], width: 6, x: 22 },
      ]);
    });

    it("converts qwerty staggered all keys", () => {
      const result = convertLayoutToKeymap(qwertyLayout as LayoutObject, {
        displayName: "qwerty",
        keymapStyle: "staggered",
        showAllKeys: true,
      });

      expect(result.row1, "row1").toEqual([
        { legends: ["`", "~", "`", "~"] },
        { legends: ["1", "!", "1", "!"] },
        { legends: ["2", "@", "2", "@"] },
        { legends: ["3", "#", "3", "#"] },
        { legends: ["4", "$", "4", "$"] },
        { legends: ["5", "%", "5", "%"] },
        { legends: ["6", "^", "6", "^"] },
        { legends: ["7", "&", "7", "&"] },
        { legends: ["8", "*", "8", "*"] },
        { legends: ["9", "(", "9", "("] },
        { legends: ["0", ")", "0", ")"] },
        { legends: ["-", "_", "-", "_"] },
        { legends: ["=", "+", "=", "+"] },
        { legends: ["BS", "BS", "BS", "BS"], width: 2 },
      ]);

      expect(result.row2, "row2").toEqual([
        { legends: ["Tab", "Tab", "Tab", "Tab"], width: 1.5 },
        { legends: ["q", "Q", "q", "Q"] },
        { legends: ["w", "W", "w", "W"] },
        { legends: ["e", "E", "e", "E"] },
        { legends: ["r", "R", "r", "R"] },
        { legends: ["t", "T", "t", "T"] },
        { legends: ["y", "Y", "y", "Y"] },
        { legends: ["u", "U", "u", "U"] },
        { legends: ["i", "I", "i", "I"] },
        { legends: ["o", "O", "o", "O"] },
        { legends: ["p", "P", "p", "P"] },
        { legends: ["[", "{", "[", "{"] },
        { legends: ["]", "}", "]", "}"] },
        { legends: ["\\", "|", "\\", "|"], width: 1.5 },
      ]);

      expect(result.row3, "row3").toEqual([
        { legends: ["Caps", "Caps", "Caps", "Caps"], width: 1.75 },
        { legends: ["a", "A", "a", "A"] },
        { legends: ["s", "S", "s", "S"] },
        { legends: ["d", "D", "d", "D"] },
        { legends: ["f", "F", "f", "F"] },
        { legends: ["g", "G", "g", "G"] },
        { legends: ["h", "H", "h", "H"] },
        { legends: ["j", "J", "j", "J"] },
        { legends: ["k", "K", "k", "K"] },
        { legends: ["l", "L", "l", "L"] },
        { legends: [";", ":", ";", ":"] },
        { legends: ["'", '"', "'", '"'] },
        { legends: ["Enter", "Enter", "Enter", "Enter"], width: 2.25 },
      ]);

      expect(result.row4, "row4").toEqual([
        { legends: ["Shift", "Shift", "Shift", "Shift"], width: 2.25 },
        { legends: ["z", "Z", "z", "Z"] },
        { legends: ["x", "X", "x", "X"] },
        { legends: ["c", "C", "c", "C"] },
        { legends: ["v", "V", "v", "V"] },
        { legends: ["b", "B", "b", "B"] },
        { legends: ["n", "N", "n", "N"] },
        { legends: ["m", "M", "m", "M"] },
        { legends: [",", "<", ",", "<"] },
        { legends: [".", ">", ".", ">"] },
        { legends: ["/", "?", "/", "?"] },
        { legends: ["Shift", "Shift", "Shift", "Shift"], width: 2.75 },
      ]);

      expect(result.row5, "row5").toEqual([
        { legends: ["Ctrl", "Ctrl", "Ctrl", "Ctrl"], width: 1.25 },
        { legends: ["Monke", "Monke", "Monke", "Monke"], width: 1.25 },
        { legends: ["Alt", "Alt", "Alt", "Alt"], width: 1.25 },
        { legends: ["qwerty", "qwerty", "qwerty", "qwerty"], width: 6.25 },
        { legends: ["Alt", "Alt", "Alt", "Alt"], width: 1.25 },
        { legends: ["Monke", "Monke", "Monke", "Monke"], width: 1.25 },
        { legends: ["Meta", "Meta", "Meta", "Meta"], width: 1.25 },
        { legends: ["Ctrl", "Ctrl", "Ctrl", "Ctrl"], width: 1.25 },
      ]);
    });

    it("converts qwerty split", () => {
      const result = convertLayoutToKeymap(qwertyLayout as LayoutObject, {
        displayName: "qwerty",
        keymapStyle: "split",
        showAllKeys: false,
      });

      expect(result.row1, "row1").toEqual([
        { legends: ["1", "!", "1", "!"] },
        { legends: ["2", "@", "2", "@"] },
        { legends: ["3", "#", "3", "#"] },
        { legends: ["4", "$", "4", "$"] },
        { legends: ["5", "%", "5", "%"] },
        { legends: ["6", "^", "6", "^"] },
        { legends: ["7", "&", "7", "&"], x: 8 },
        { legends: ["8", "*", "8", "*"] },
        { legends: ["9", "(", "9", "("] },
        { legends: ["0", ")", "0", ")"] },
        { legends: ["-", "_", "-", "_"] },
        { legends: ["=", "+", "=", "+"] },
      ]);

      expect(result.row2, "row2").toEqual([
        { legends: ["q", "Q", "q", "Q"], x: 2 },
        { legends: ["w", "W", "w", "W"] },
        { legends: ["e", "E", "e", "E"] },
        { legends: ["r", "R", "r", "R"] },
        { legends: ["t", "T", "t", "T"] },
        { legends: ["y", "Y", "y", "Y"], x: 8 },
        { legends: ["u", "U", "u", "U"] },
        { legends: ["i", "I", "i", "I"] },
        { legends: ["o", "O", "o", "O"] },
        { legends: ["p", "P", "p", "P"] },
        { legends: ["[", "{", "[", "{"] },
        { legends: ["]", "}", "]", "}"] },
      ]);

      expect(result.row3, "row3").toEqual([
        { legends: ["a", "A", "a", "A"], x: 4 },
        { legends: ["s", "S", "s", "S"] },
        { legends: ["d", "D", "d", "D"] },
        { legends: ["f", "F", "f", "F"] },
        { legends: ["g", "G", "g", "G"] },
        { legends: ["h", "H", "h", "H"], x: 8 },
        { legends: ["j", "J", "j", "J"] },
        { legends: ["k", "K", "k", "K"] },
        { legends: ["l", "L", "l", "L"] },
        { legends: [";", ":", ";", ":"] },
        { legends: ["'", '"', "'", '"'] },
      ]);

      expect(result.row4, "row4").toEqual([
        { legends: ["z", "Z", "z", "Z"], x: 6 },
        { legends: ["x", "X", "x", "X"] },
        { legends: ["c", "C", "c", "C"] },
        { legends: ["v", "V", "v", "V"] },
        { legends: ["b", "B", "b", "B"] },
        { legends: ["n", "N", "n", "N"], x: 8 },
        { legends: ["m", "M", "m", "M"] },
        { legends: [",", "<", ",", "<"] },
        { legends: [".", ">", ".", ">"] },
        { legends: ["/", "?", "/", "?"] },
      ]);

      expect(result.row5, "row5").toEqual([
        { legends: ["qwerty", "qwerty", "qwerty", "qwerty"], width: 3, x: 23 },
        { legends: ["", "", "", ""], width: 3, x: 8 },
      ]);
    });

    it("converts qwertz staggered", () => {
      const result = convertLayoutToKeymap(qwertzLayout as LayoutObject, {
        displayName: "qwertz",
        keymapStyle: "staggered",
        showAllKeys: false,
      });

      expect(result.row1, "row1").toEqual([
        { legends: ["1", "!", "1", "!"] },
        { legends: ["2", `"`, "2", `"`] },
        { legends: ["3", "§", "3", "§"] },
        { legends: ["4", "$", "4", "$"] },
        { legends: ["5", "%", "5", "%"] },
        { legends: ["6", "&", "6", "&"] },
        { legends: ["7", "/", "7", "/"] },
        { legends: ["8", "(", "8", "("] },
        { legends: ["9", ")", "9", ")"] },
        { legends: ["0", "=", "0", "="] },
        { legends: ["ß", "?", "ß", "?"] },
        { legends: ["´", "`", "´", "`"] },
      ]);

      expect(result.row2, "row2").toEqual([
        { legends: ["q", "Q", "q", "Q"], x: 2 },
        { legends: ["w", "W", "w", "W"] },
        { legends: ["e", "E", "e", "E"] },
        { legends: ["r", "R", "r", "R"] },
        { legends: ["t", "T", "t", "T"] },
        { legends: ["z", "Z", "z", "Z"] },
        { legends: ["u", "U", "u", "U"] },
        { legends: ["i", "I", "i", "I"] },
        { legends: ["o", "O", "o", "O"] },
        { legends: ["p", "P", "p", "P"] },
        { legends: ["ü", "Ü", "ü", "Ü"] },
        { legends: ["+", "*", "+", "*"] },
      ]);

      expect(result.row3, "row3").toEqual([
        { legends: ["a", "A", "a", "A"], x: 4 },
        { legends: ["s", "S", "s", "S"] },
        { legends: ["d", "D", "d", "D"] },
        { legends: ["f", "F", "f", "F"] },
        { legends: ["g", "G", "g", "G"] },
        { legends: ["h", "H", "h", "H"] },
        { legends: ["j", "J", "j", "J"] },
        { legends: ["k", "K", "k", "K"] },
        { legends: ["l", "L", "l", "L"] },
        { legends: ["ö", "Ö", "ö", "Ö"] },
        { legends: ["ä", "Ä", "ä", "Ä"] },
        { legends: ["#", "'", "#", "'"] },
      ]);

      expect(result.row4, "row4").toEqual([
        { legends: ["<", ">", "<", ">"], x: 1 },
        { legends: ["y", "Y", "y", "Y"] },
        { legends: ["x", "X", "x", "X"] },
        { legends: ["c", "C", "c", "C"] },
        { legends: ["v", "V", "v", "V"] },
        { legends: ["b", "B", "b", "B"] },
        { legends: ["n", "N", "n", "N"] },
        { legends: ["m", "M", "m", "M"] },
        { legends: [",", ";", ",", ";"] },
        { legends: [".", ":", ".", ":"] },
        { legends: ["-", "_", "-", "_"] },
      ]);

      expect(result.row5, "row5").toEqual([
        { legends: ["qwertz", "qwertz", "qwertz", "qwertz"], width: 6, x: 22 },
      ]);
    });

    it("converts qwertz staggered all keys", () => {
      const result = convertLayoutToKeymap(qwertzLayout as LayoutObject, {
        displayName: "qwertz",
        keymapStyle: "staggered",
        showAllKeys: true,
      });

      expect(result.row1, "row1").toEqual([
        { legends: ["^", "°", "^", "°"] },
        { legends: ["1", "!", "1", "!"] },
        { legends: ["2", `"`, "2", `"`] },
        { legends: ["3", "§", "3", "§"] },
        { legends: ["4", "$", "4", "$"] },
        { legends: ["5", "%", "5", "%"] },
        { legends: ["6", "&", "6", "&"] },
        { legends: ["7", "/", "7", "/"] },
        { legends: ["8", "(", "8", "("] },
        { legends: ["9", ")", "9", ")"] },
        { legends: ["0", "=", "0", "="] },
        { legends: ["ß", "?", "ß", "?"] },
        { legends: ["´", "`", "´", "`"] },
        { legends: ["BS", "BS", "BS", "BS"], width: 2 },
      ]);

      expect(result.row2, "row2").toEqual([
        { legends: ["Tab", "Tab", "Tab", "Tab"], width: 1.5 },
        { legends: ["q", "Q", "q", "Q"] },
        { legends: ["w", "W", "w", "W"] },
        { legends: ["e", "E", "e", "E"] },
        { legends: ["r", "R", "r", "R"] },
        { legends: ["t", "T", "t", "T"] },
        { legends: ["z", "Z", "z", "Z"] },
        { legends: ["u", "U", "u", "U"] },
        { legends: ["i", "I", "i", "I"] },
        { legends: ["o", "O", "o", "O"] },
        { legends: ["p", "P", "p", "P"] },
        { legends: ["ü", "Ü", "ü", "Ü"] },
        { legends: ["+", "*", "+", "*"] },
        {
          legends: ["Enter", "Enter", "Enter", "Enter"],
          height: 2,
          width: 1.5,
        },
      ]);

      expect(result.row3, "row3").toEqual([
        { legends: ["Caps", "Caps", "Caps", "Caps"], width: 1.75 },
        { legends: ["a", "A", "a", "A"] },
        { legends: ["s", "S", "s", "S"] },
        { legends: ["d", "D", "d", "D"] },
        { legends: ["f", "F", "f", "F"] },
        { legends: ["g", "G", "g", "G"] },
        { legends: ["h", "H", "h", "H"] },
        { legends: ["j", "J", "j", "J"] },
        { legends: ["k", "K", "k", "K"] },
        { legends: ["l", "L", "l", "L"] },
        { legends: ["ö", "Ö", "ö", "Ö"] },
        { legends: ["ä", "Ä", "ä", "Ä"] },
        { legends: ["#", "'", "#", "'"] },
      ]);

      expect(result.row4, "row4").toEqual([
        { legends: ["Shift", "Shift", "Shift", "Shift"], width: 1.25 },
        { legends: ["<", ">", "<", ">"] },
        { legends: ["y", "Y", "y", "Y"] },
        { legends: ["x", "X", "x", "X"] },
        { legends: ["c", "C", "c", "C"] },
        { legends: ["v", "V", "v", "V"] },
        { legends: ["b", "B", "b", "B"] },
        { legends: ["n", "N", "n", "N"] },
        { legends: ["m", "M", "m", "M"] },
        { legends: [",", ";", ",", ";"] },
        { legends: [".", ":", ".", ":"] },
        { legends: ["-", "_", "-", "_"] },
        { legends: ["Shift", "Shift", "Shift", "Shift"], width: 2.75 },
      ]);

      expect(result.row5, "row5").toEqual([
        { legends: ["Ctrl", "Ctrl", "Ctrl", "Ctrl"], width: 1.25 },
        { legends: ["Monke", "Monke", "Monke", "Monke"], width: 1.25 },
        { legends: ["Alt", "Alt", "Alt", "Alt"], width: 1.25 },
        { legends: ["qwertz", "qwertz", "qwertz", "qwertz"], width: 6.25 },
        { legends: ["Alt", "Alt", "Alt", "Alt"], width: 1.25 },
        { legends: ["Monke", "Monke", "Monke", "Monke"], width: 1.25 },
        { legends: ["Meta", "Meta", "Meta", "Meta"], width: 1.25 },
        { legends: ["Ctrl", "Ctrl", "Ctrl", "Ctrl"], width: 1.25 },
      ]);
    });

    it("converts qwertz split", () => {
      const result = convertLayoutToKeymap(qwertzLayout as LayoutObject, {
        displayName: "qwertz",
        keymapStyle: "split",
        showAllKeys: false,
      });

      expect(result.row1, "row1").toEqual([
        { legends: ["1", "!", "1", "!"] },
        { legends: ["2", `"`, "2", `"`] },
        { legends: ["3", "§", "3", "§"] },
        { legends: ["4", "$", "4", "$"] },
        { legends: ["5", "%", "5", "%"] },
        { legends: ["6", "&", "6", "&"] },
        { legends: ["7", "/", "7", "/"], x: 8 },
        { legends: ["8", "(", "8", "("] },
        { legends: ["9", ")", "9", ")"] },
        { legends: ["0", "=", "0", "="] },
        { legends: ["ß", "?", "ß", "?"] },
        { legends: ["´", "`", "´", "`"] },
      ]);

      expect(result.row2, "row2").toEqual([
        { legends: ["q", "Q", "q", "Q"], x: 2 },
        { legends: ["w", "W", "w", "W"] },
        { legends: ["e", "E", "e", "E"] },
        { legends: ["r", "R", "r", "R"] },
        { legends: ["t", "T", "t", "T"] },
        { legends: ["z", "Z", "z", "Z"], x: 8 },
        { legends: ["u", "U", "u", "U"] },
        { legends: ["i", "I", "i", "I"] },
        { legends: ["o", "O", "o", "O"] },
        { legends: ["p", "P", "p", "P"] },
        { legends: ["ü", "Ü", "ü", "Ü"] },
        { legends: ["+", "*", "+", "*"] },
      ]);

      expect(result.row3, "row3").toEqual([
        { legends: ["a", "A", "a", "A"], x: 4 },
        { legends: ["s", "S", "s", "S"] },
        { legends: ["d", "D", "d", "D"] },
        { legends: ["f", "F", "f", "F"] },
        { legends: ["g", "G", "g", "G"] },
        { legends: ["h", "H", "h", "H"], x: 8 },
        { legends: ["j", "J", "j", "J"] },
        { legends: ["k", "K", "k", "K"] },
        { legends: ["l", "L", "l", "L"] },
        { legends: ["ö", "Ö", "ö", "Ö"] },
        { legends: ["ä", "Ä", "ä", "Ä"] },
        { legends: ["#", "'", "#", "'"] },
      ]);

      expect(result.row4, "row4").toEqual([
        { legends: ["<", ">", "<", ">"], x: 1 },
        { legends: ["y", "Y", "y", "Y"] },
        { legends: ["x", "X", "x", "X"] },
        { legends: ["c", "C", "c", "C"] },
        { legends: ["v", "V", "v", "V"] },
        { legends: ["b", "B", "b", "B"], x: 8 },
        { legends: ["n", "N", "n", "N"] },
        { legends: ["m", "M", "m", "M"] },
        { legends: [",", ";", ",", ";"] },
        { legends: [".", ":", ".", ":"] },
        { legends: ["-", "_", "-", "_"] },
      ]);

      expect(result.row5, "row5").toEqual([
        { legends: ["qwertz", "qwertz", "qwertz", "qwertz"], width: 3, x: 23 },
        { legends: ["", "", "", ""], width: 3, x: 8 },
      ]);
    });
  });
});
