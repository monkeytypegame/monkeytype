import { describe, expect, it } from "vitest";
import { convertLayoutToKeymap } from "../../../../src/ts/components/pages/test/keymapConverter";

import qwertyLayout from "../../../../static/layouts/qwerty.json";
import qwertzLayout from "../../../../static/layouts/qwertz.json";

import { LayoutObject } from "@monkeytype/schemas/layouts";
import {
  Alt,
  Ctrl,
  Meta,
} from "../../../../src/ts/components/pages/test/keymapLayouts";

describe("keymap converter", () => {
  describe("convertLayoutToKeymap", () => {
    describe("staggered", () => {
      it("converts qwerty staggered", () => {
        const [row1, row2, row3, row4, row5] = convertLayoutToKeymap(
          qwertyLayout as LayoutObject,
          {
            keymapStyle: "staggered",
            showAllKeys: false,
          },
        );

        expect(row1, "row1").toEqual([
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

        expect(row2, "row2").toEqual([
          { legends: ["q", "Q", "q", "Q"], x: 0.5 },
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

        expect(row3, "row3").toEqual([
          { legends: ["a", "A", "a", "A"], x: 1 },
          { legends: ["s", "S", "s", "S"] },
          { legends: ["d", "D", "d", "D"] },
          { legends: ["f", "F", "f", "F"], isHoming: true },
          { legends: ["g", "G", "g", "G"] },
          { legends: ["h", "H", "h", "H"] },
          { legends: ["j", "J", "j", "J"], isHoming: true },
          { legends: ["k", "K", "k", "K"] },
          { legends: ["l", "L", "l", "L"] },
          { legends: [";", ":", ";", ":"] },
          { legends: ["'", '"', "'", '"'] },
        ]);

        expect(row4, "row4").toEqual([
          { legends: ["z", "Z", "z", "Z"], x: 1.5 },
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

        expect(row5, "row5").toEqual([
          {
            legends: [" ", " ", " ", " "],
            width: 6,
            x: 3.5,
            isLayoutIndicator: true,
          },
        ]);
      });

      it("converts qwerty staggered all keys", () => {
        const [row1, row2, row3, row4, row5] = convertLayoutToKeymap(
          qwertyLayout as LayoutObject,
          {
            keymapStyle: "staggered",
            showAllKeys: true,
          },
        );

        // Test only keys added when showAllKeys is true (not covered by basic staggered test)
        // Row1: BS added at end
        expect(row1?.[row1.length - 1], "row1 last").toEqual({
          legends: ["Backspace", "Backspace", "Backspace", "Backspace"],
          width: 2,
        });

        // Row2: Tab added at start
        expect(row2?.[0], "row2 first").toEqual({
          legends: ["Tab", "Tab", "Tab", "Tab"],
          width: 1.5,
        });

        // Row3: Caps added at start, Enter added at end
        expect(row3?.[0], "row3 first").toEqual({
          legends: ["Caps", "Caps", "Caps", "Caps"],
          width: 1.75,
        });
        expect(row3?.[row3?.length - 1], "row3 last").toEqual({
          legends: ["Enter", "Enter", "Enter", "Enter"],
          width: 2.25,
        });

        // Row4: Shift added at start and end
        expect(row4?.[0], "row4 first").toEqual({
          legends: ["Shift", "Shift", "Shift", "Shift"],
          width: 2.25,
        });
        expect(row4?.[row4.length - 1], "row4 last").toEqual({
          legends: ["Shift", "Shift", "Shift", "Shift"],
          width: 2.75,
        });

        // Row5: Ctrl, Monke, Alt at start; Alt, Monke, Meta, Ctrl at end
        expect(row5, "row5").toEqual([
          {
            legends: [Ctrl, Ctrl, Ctrl, Ctrl],
            width: 1.25,
          },
          {
            legends: [Meta, Meta, Meta, Meta],
            width: 1.25,
          },
          {
            legends: [Alt, Alt, Alt, Alt],
            width: 1.25,
          },
          {
            isLayoutIndicator: true,
            legends: [" ", " ", " ", " "],
            width: 6.25,
            x: 0,
          },
          {
            legends: [Alt, Alt, Alt, Alt],
            width: 1.25,
          },
          {
            legends: [Meta, Meta, Meta, Meta],
            width: 1.25,
          },
          {
            legends: ["Monke", "Monke", "Monke", "Monke"],
            width: 1.25,
          },
          {
            legends: [Ctrl, Ctrl, Ctrl, Ctrl],
            width: 1.25,
          },
        ]);

        // Also verify total counts are as expected with extra keys
        expect(row1?.length, "row1 length").toBe(14);
        expect(row2?.length, "row2 length").toBe(14);
        expect(row3?.length, "row3 length").toBe(13);
        expect(row4?.length, "row4 length").toBe(12);
      });

      it("converts qwertz staggered", () => {
        const [row1, row2, row3, row4, row5] = convertLayoutToKeymap(
          qwertzLayout as LayoutObject,
          {
            keymapStyle: "staggered",
            showAllKeys: false,
          },
        );

        expect(row1, "row1").toEqual([
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

        expect(row2, "row2").toEqual([
          { legends: ["q", "Q", "q", "Q"], x: 0.5 },
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

        expect(row3, "row3").toEqual([
          { legends: ["a", "A", "a", "A"], x: 1 },
          { legends: ["s", "S", "s", "S"] },
          { legends: ["d", "D", "d", "D"] },
          { legends: ["f", "F", "f", "F"], isHoming: true },
          { legends: ["g", "G", "g", "G"] },
          { legends: ["h", "H", "h", "H"] },
          { legends: ["j", "J", "j", "J"], isHoming: true },
          { legends: ["k", "K", "k", "K"] },
          { legends: ["l", "L", "l", "L"] },
          { legends: ["ö", "Ö", "ö", "Ö"] },
          { legends: ["ä", "Ä", "ä", "Ä"] },
          { legends: ["#", "'", "#", "'"] },
        ]);

        expect(row4, "row4").toEqual([
          { legends: ["<", ">", "<", ">"], x: 0.25 },
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

        expect(row5, "row5").toEqual([
          {
            legends: [" ", " ", " ", " "],
            width: 6,
            x: 3.5,
            isLayoutIndicator: true,
          },
        ]);
      });

      it("converts qwertz staggered all keys", () => {
        const [row1, row2, row3, row4, row5] = convertLayoutToKeymap(
          qwertzLayout as LayoutObject,
          {
            keymapStyle: "staggered",
            showAllKeys: true,
          },
        );

        // Test only keys added when showAllKeys is true (not covered by basic staggered test)

        // Row1: BS added at end
        expect(row1?.[row1.length - 1], "row1 last").toEqual({
          legends: ["Backspace", "Backspace", "Backspace", "Backspace"],
          width: 2,
        });

        // Row2: Tab added at start, Enter (with height) added at end
        expect(row2?.[0], "row2 first").toEqual({
          legends: ["Tab", "Tab", "Tab", "Tab"],
          width: 1.5,
        });
        expect(row2?.[row2.length - 1], "row2 last").toEqual({
          legends: ["Enter", "Enter", "Enter", "Enter"],
          height: 2,
          width: 1.5,
        });

        // Row3: Caps added at start
        expect(row3?.[0], "row3 first").toEqual({
          legends: ["Caps", "Caps", "Caps", "Caps"],
          width: 1.75,
        });

        // Row4: Shift added at start and end
        expect(row4?.[0], "row4 first").toEqual({
          legends: ["Shift", "Shift", "Shift", "Shift"],
          width: 1.25,
        });
        expect(row4?.[row4.length - 1], "row4 last").toEqual({
          legends: ["Shift", "Shift", "Shift", "Shift"],
          width: 2.75,
        });

        // Row5: Ctrl, Monke, Alt at start; Alt, Monke, Meta, Ctrl at end
        expect(row5, "row5").toEqual([
          {
            legends: [Ctrl, Ctrl, Ctrl, Ctrl],
            width: 1.25,
          },
          {
            legends: [Meta, Meta, Meta, Meta],
            width: 1.25,
          },
          {
            legends: [Alt, Alt, Alt, Alt],
            width: 1.25,
          },
          {
            isLayoutIndicator: true,
            legends: [" ", " ", " ", " "],
            width: 6.25,
            x: 0,
          },
          {
            legends: [Alt, Alt, Alt, Alt],
            width: 1.25,
          },
          {
            legends: [Meta, Meta, Meta, Meta],
            width: 1.25,
          },
          {
            legends: ["Monke", "Monke", "Monke", "Monke"],
            width: 1.25,
          },
          {
            legends: [Ctrl, Ctrl, Ctrl, Ctrl],
            width: 1.25,
          },
        ]);

        // Also verify total counts are as expected with extra keys
        expect(row1?.length, "row1 length").toBe(14);
        expect(row2?.length, "row2 length").toBe(14);
        expect(row3?.length, "row3 length").toBe(13);
        expect(row4?.length, "row4 length").toBe(13);
      });
    });

    describe("split", () => {
      it("converts qwerty split", () => {
        const [row1, row2, row3, row4, row5] = convertLayoutToKeymap(
          qwertyLayout as LayoutObject,
          {
            keymapStyle: "split",
            showAllKeys: false,
          },
        );

        // Test split-specific differences from staggered (not covered by basic test)
        // Split adds x=1 gap after column 7 for rows 1-4, and row5 has 2 keys with gap

        // Row 1: col7 (index 6) = '7' gets gap x=1
        expect(row1?.[6], "row1 key 7").toEqual({
          legends: ["7", "&", "7", "&"],
          x: 1,
        });

        // Row 2: col6 (index 5) = 'y' gets gap x=1
        expect(row2?.[5], "row2 key y").toEqual({
          legends: ["y", "Y", "y", "Y"],
          x: 1,
        });

        // Row 3: col6 (index 5) = 'h' gets gap x=1
        expect(row3?.[5], "row3 key h").toEqual({
          legends: ["h", "H", "h", "H"],
          x: 1,
        });

        // Row 4: col6 (index 5) = 'n' gets gap x=1
        expect(row4?.[5], "row4 key n").toEqual({
          legends: ["n", "N", "n", "N"],
          x: 1,
        });

        // Row 5: split has two keys with gap in middle
        expect(row5?.length, "row5 length").toBe(2);
        expect(row5?.[0], "row5 left").toEqual({
          legends: [" ", " ", " ", " "],
          width: 3,
          x: 3.5,
          isLayoutIndicator: true,
        });
        expect(row5?.[1], "row5 right").toEqual({
          legends: [" ", " ", " ", " "],
          width: 3,
          x: 1,
        });
      });

      it("converts qwerty split all keys", () => {
        const [_row1, _row2, _row3, _row4, row5] = convertLayoutToKeymap(
          qwertyLayout as LayoutObject,
          {
            keymapStyle: "split",
            showAllKeys: true,
          },
        );
        expect(row5?.[3], "row5 left shift").toEqual({
          legends: [" ", " ", " ", " "],
          width: 3,
          x: 0,
          isLayoutIndicator: true,
        });
        expect(row5?.[4], "row5 right shift").toEqual({
          legends: [" ", " ", " ", " "],
          width: 3,
          x: 1,
        });
      });

      it("converts qwertz split", () => {
        const [row1, row2, row3, row4, row5] = convertLayoutToKeymap(
          qwertzLayout as LayoutObject,
          {
            keymapStyle: "split",
            showAllKeys: false,
          },
        );

        // Test split-specific differences from staggered (not covered by basic test)

        // Row 1: col7 (index 6) = '7' gets gap x=1
        expect(row1?.[6], "row1 key 7").toEqual({
          legends: ["7", "/", "7", "/"],
          x: 1,
        });

        // Row 2: col6 (index 5) = 'z' gets gap x=1
        expect(row2?.[5], "row2 key z").toEqual({
          legends: ["z", "Z", "z", "Z"],
          x: 1,
        });

        // Row 3: col6 (index 5) = 'h' gets gap x=1
        expect(row3?.[5], "row3 key h").toEqual({
          legends: ["h", "H", "h", "H"],
          x: 1,
        });

        // Row 4: col5 (index 6) = 'b' gets gap x=1
        expect(row4?.[6], "row4 key n").toEqual({
          legends: ["n", "N", "n", "N"],
          x: 1,
        });

        // Row 5: split has two keys with gap in middle
        expect(row5?.length, "row5 length").toBe(2);
        expect(row5?.[0], "row5 left").toEqual({
          legends: [" ", " ", " ", " "],
          width: 3,
          x: 3.5,
          isLayoutIndicator: true,
        });
        expect(row5?.[1], "row5 right").toEqual({
          legends: [" ", " ", " ", " "],
          width: 3,
          x: 1,
        });
      });

      it("converts qwertz split all keys", () => {
        const [_row1, _row2, _row3, _row4, row5] = convertLayoutToKeymap(
          qwertzLayout as LayoutObject,
          {
            keymapStyle: "split",
            showAllKeys: true,
          },
        );
        expect(row5?.[3], "row5 left shift").toEqual({
          legends: [" ", " ", " ", " "],
          width: 3,
          x: 0,
          isLayoutIndicator: true,
        });
        expect(row5?.[4], "row5 right shift").toEqual({
          legends: [" ", " ", " ", " "],
          width: 3,
          x: 1,
        });
      });
    });

    describe("matrix", () => {
      it("converts qwerty matrix", () => {
        const [row1, row2, row3, row4, row5] = convertLayoutToKeymap(
          qwertyLayout as LayoutObject,
          {
            keymapStyle: "matrix",
            showAllKeys: false,
          },
        );

        expect(row1, "row1").toEqual([
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
        ]);

        expect(row2, "row2").toEqual([
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
        ]);

        expect(row3, "row3").toEqual([
          { legends: ["a", "A", "a", "A"] },
          { legends: ["s", "S", "s", "S"] },
          { legends: ["d", "D", "d", "D"] },
          { legends: ["f", "F", "f", "F"], isHoming: true },
          { legends: ["g", "G", "g", "G"] },
          { legends: ["h", "H", "h", "H"] },
          { legends: ["j", "J", "j", "J"], isHoming: true },
          { legends: ["k", "K", "k", "K"] },
          { legends: ["l", "L", "l", "L"] },
          { legends: [";", ":", ";", ":"] },
        ]);

        expect(row4, "row4").toEqual([
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
        ]);

        expect(row5, "row5").toEqual([
          {
            legends: [" ", " ", " ", " "],
            width: 4,
            x: 3,
            isLayoutIndicator: true,
          },
        ]);
      });

      it("converts qwerty matrix all keys", () => {
        const [row1, row2, row3, row4, row5] = convertLayoutToKeymap(
          qwertyLayout as LayoutObject,
          {
            keymapStyle: "matrix",
            showAllKeys: true,
          },
        );

        // Test only keys added when showAllKeys is true (not covered by basic matrix test)
        //Row1: starting with `
        expect(row1?.[0], "row1 first").toEqual({
          legends: ["`", "~", "`", "~"],
        });

        // Row1: BS added at end
        expect(row1?.[row1.length - 1], "row1 last").toEqual({
          legends: ["BS", "BS", "BS", "BS"],
        });

        // Row2: Tab added at start
        expect(row2?.[0], "row2 first").toEqual({
          legends: ["Tab", "Tab", "Tab", "Tab"],
        });

        // Row2: Del added at end
        expect(row2?.[row2.length - 1], "row2 last").toEqual({
          legends: ["Del", "Del", "Del", "Del"],
        });

        // Row3: Esc added at start
        expect(row3?.[0], "row3 first").toEqual({
          legends: ["Esc", "Esc", "Esc", "Esc"],
        });

        // Row3: ends with '
        expect(row3?.[row3.length - 1], "row3 last").toEqual({
          legends: ["'", '"', "'", '"'],
        });

        // Row4: Shift added at start and end
        expect(row4?.[0], "row4 first").toEqual({
          legends: ["Shift", "Shift", "Shift", "Shift"],
        });
        expect(row4?.[row4.length - 1], "row4 last").toEqual({
          legends: ["Enter", "Enter", "Enter", "Enter"],
        });

        // Row5: Ctrl, Monke, Alt at start; Alt,  Meta, Ctrl at end
        expect(row5, "row5").toEqual([
          {
            legends: [Ctrl, Ctrl, Ctrl, Ctrl],
          },
          {
            legends: [Meta, Meta, Meta, Meta],
          },
          {
            legends: [Alt, Alt, Alt, Alt],
          },
          {
            isLayoutIndicator: true,
            legends: [" ", " ", " ", " "],
            width: 6,
            x: 0,
          },
          {
            legends: [Alt, Alt, Alt, Alt],
          },
          {
            legends: ["Monke", "Monke", "Monke", "Monke"],
          },
          {
            legends: [Ctrl, Ctrl, Ctrl, Ctrl],
          },
        ]);
        // Also verify total counts are as expected with extra keys
        expect(row1?.length, "row1 length").toBe(12);
        expect(row2?.length, "row2 length").toBe(12);
        expect(row3?.length, "row3 length").toBe(12);
        expect(row4?.length, "row4 length").toBe(12);
      });
    });

    describe("split matrix", () => {
      it("converts qwerty split  matrix", () => {
        const [row1, row2, row3, row4, row5] = convertLayoutToKeymap(
          qwertyLayout as LayoutObject,
          {
            keymapStyle: "split_matrix",
            showAllKeys: false,
          },
        );

        // Row 1: col6 (index 5) = '6' gets gap x=1
        expect(row1?.[5], "row1 key 7").toEqual({
          legends: ["6", "^", "6", "^"],
          x: 1,
        });

        // Row 2: col6 (index 5) = 'y' gets gap x=1
        expect(row2?.[5], "row2 key y").toEqual({
          legends: ["y", "Y", "y", "Y"],
          x: 1,
        });

        // Row 3: col6 (index 5) = 'h' gets gap x=1
        expect(row3?.[5], "row3 key h").toEqual({
          legends: ["h", "H", "h", "H"],
          x: 1,
        });

        // Row 4: col6 (index 5) = 'n' gets gap x=1
        expect(row4?.[5], "row4 key n").toEqual({
          legends: ["n", "N", "n", "N"],
          x: 1,
        });

        // Row 5: split has two keys with gap in middle
        expect(row5?.length, "row5 length").toBe(2);
        expect(row5?.[0], "row5 left").toEqual({
          legends: [" ", " ", " ", " "],
          width: 3,
          x: 2,
          isLayoutIndicator: true,
        });
        expect(row5?.[1], "row5 right").toEqual({
          legends: [" ", " ", " ", " "],
          width: 3,
          x: 1,
        });
      });
    });

    describe("steno", () => {
      it("converts steno", () => {
        const [row1, row2, row3, row4, row5] = convertLayoutToKeymap(
          { type: "ansi" } as LayoutObject,
          {
            keymapStyle: "steno",
            showAllKeys: false,
          },
        );

        expect(row1, "row1").toEqual([]);
        expect(row2, "row2").toEqual([
          { legends: ["s", "S", "s", "S"], height: 2 },
          { legends: ["t", "T", "t", "T"] },
          { legends: ["p", "P", "p", "P"] },
          { legends: ["h", "H", "h", "H"] },
          { legends: ["*", "*", "*", "*"], height: 2 },
          { legends: ["f", "F", "f", "F"] },
          { legends: ["p", "P", "p", "P"] },
          { legends: ["l", "L", "l", "L"] },
          { legends: ["t", "T", "t", "T"] },
          { legends: ["d", "D", "d", "D"] },
        ]);
        expect(row3, "row3").toEqual([
          { legends: ["k", "K", "k", "K"], x: 1 },
          { legends: ["w", "W", "w", "W"] },
          { legends: ["r", "R", "r", "R"] },
          { legends: ["r", "R", "r", "R"], x: 1 },
          { legends: ["b", "B", "b", "B"] },
          { legends: ["g", "G", "g", "G"] },
          { legends: ["s", "S", "s", "S"] },
          { legends: ["z", "Z", "z", "Z"] },
        ]);
        expect(row4, "row4").toEqual([
          { legends: ["a", "A", "a", "A"], x: 2.25 },
          { legends: ["o", "O", "o", "O"] },
          { legends: ["e", "E", "e", "E"], x: 0.5 },
          { legends: ["u", "U", "u", "U"] },
        ]);
        expect(row5, "row5").toBeUndefined();
      });

      it("converts steno matrix", () => {
        const [row1, row2, row3, row4, row5] = convertLayoutToKeymap(
          { type: "ansi" } as LayoutObject,
          {
            keymapStyle: "steno_matrix",
            showAllKeys: false,
          },
        );

        expect(row1, "row1").toEqual([]);
        expect(row2, "row2").toEqual([
          { legends: ["s", "S", "s", "S"] },
          { legends: ["t", "T", "t", "T"] },
          { legends: ["p", "P", "p", "P"] },
          { legends: ["h", "H", "h", "H"] },
          { legends: ["*", "*", "*", "*"] },
          { legends: ["f", "F", "f", "F"], x: 1 },
          { legends: ["p", "P", "p", "P"] },
          { legends: ["l", "L", "l", "L"] },
          { legends: ["t", "T", "t", "T"] },
          { legends: ["d", "D", "d", "D"] },
        ]);
        expect(row3, "row3").toEqual([
          { legends: ["s", "S", "s", "S"] },
          { legends: ["k", "K", "k", "K"] },
          { legends: ["w", "W", "w", "W"] },
          { legends: ["r", "R", "r", "R"] },
          { legends: ["*", "*", "*", "*"] },
          { legends: ["r", "R", "r", "R"], x: 1 },
          { legends: ["b", "B", "b", "B"] },
          { legends: ["g", "G", "g", "G"] },
          { legends: ["s", "S", "s", "S"] },
          { legends: ["z", "Z", "z", "Z"] },
        ]);
        expect(row4, "row4").toEqual([
          { legends: ["a", "A", "a", "A"], x: 3 },
          { legends: ["o", "O", "o", "O"] },
          { legends: ["e", "E", "e", "E"], x: 1 },
          { legends: ["u", "U", "u", "U"] },
        ]);
        expect(row5, "row5").toBeUndefined();
      });
    });
  });
});
