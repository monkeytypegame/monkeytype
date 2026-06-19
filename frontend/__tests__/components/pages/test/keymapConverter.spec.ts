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

      expect(result.row3, "row3").toEqual([
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

      expect(result.row4, "row4").toEqual([
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

      expect(result.row5, "row5").toEqual([
        {
          legends: [" ", " ", " ", " "],
          width: 6,
          x: 3.5,
          isLayoutIndicator: true,
        },
      ]);
    });

    it("converts qwerty staggered all keys", () => {
      const result = convertLayoutToKeymap(qwertyLayout as LayoutObject, {
        displayName: "qwerty",
        keymapStyle: "staggered",
        showAllKeys: true,
      });

      // Test only keys added when showAllKeys is true (not covered by basic staggered test)
      // Row1: BS added at end
      expect(result.row1[result.row1.length - 1], "row1 last").toEqual({
        legends: ["BS", "BS", "BS", "BS"],
        width: 2,
      });

      // Row2: Tab added at start
      expect(result.row2[0], "row2 first").toEqual({
        legends: ["Tab", "Tab", "Tab", "Tab"],
        width: 1.5,
      });

      // Row3: Caps added at start, Enter added at end
      expect(result.row3[0], "row3 first").toEqual({
        legends: ["Caps", "Caps", "Caps", "Caps"],
        width: 1.75,
      });
      expect(result.row3[result.row3.length - 1], "row3 last").toEqual({
        legends: ["Enter", "Enter", "Enter", "Enter"],
        width: 2.25,
      });

      // Row4: Shift added at start and end
      expect(result.row4[0], "row4 first").toEqual({
        legends: ["Shift", "Shift", "Shift", "Shift"],
        width: 2.25,
      });
      expect(result.row4[result.row4.length - 1], "row4 last").toEqual({
        legends: ["Shift", "Shift", "Shift", "Shift"],
        width: 2.75,
      });

      // Row5: Ctrl, Monke, Alt at start; Alt, Monke, Meta, Ctrl at end
      expect(result.row5[0], "row5 first").toEqual({
        legends: ["Ctrl", "Ctrl", "Ctrl", "Ctrl"],
        width: 1.25,
      });
      expect(result.row5[1], "row5 second").toEqual({
        legends: ["Monke", "Monke", "Monke", "Monke"],
        width: 1.25,
      });
      expect(result.row5[2], "row5 third").toEqual({
        legends: ["Alt", "Alt", "Alt", "Alt"],
        width: 1.25,
      });
      expect(result.row5[result.row5.length - 4], "row5 Alt right").toEqual({
        legends: ["Alt", "Alt", "Alt", "Alt"],
        width: 1.25,
      });
      expect(result.row5[result.row5.length - 3], "row5 Monke right").toEqual({
        legends: ["Monke", "Monke", "Monke", "Monke"],
        width: 1.25,
      });
      expect(result.row5[result.row5.length - 2], "row5 Meta").toEqual({
        legends: ["Meta", "Meta", "Meta", "Meta"],
        width: 1.25,
      });
      expect(result.row5[result.row5.length - 1], "row5 last").toEqual({
        legends: ["Ctrl", "Ctrl", "Ctrl", "Ctrl"],
        width: 1.25,
      });

      // Also verify total counts are as expected with extra keys
      expect(result.row1.length, "row1 length").toBe(14);
      expect(result.row2.length, "row2 length").toBe(14);
      expect(result.row3.length, "row3 length").toBe(13);
      expect(result.row4.length, "row4 length").toBe(12);
    });

    it("converts qwerty split", () => {
      const result = convertLayoutToKeymap(qwertyLayout as LayoutObject, {
        displayName: "qwerty",
        keymapStyle: "split",
        showAllKeys: false,
      });

      // Test split-specific differences from staggered (not covered by basic test)
      // Split adds x=8 gap after column 7 for rows 1-4, and row5 has 2 keys with gap

      // Row 1: col7 (index 6) = '7' gets x=8
      expect(result.row1[6], "row1 key 7").toEqual({
        legends: ["7", "&", "7", "&"],
        x: 1,
      });

      // Row 2: col6 (index 5) = 'y' gets x=8
      expect(result.row2[5], "row2 key y").toEqual({
        legends: ["y", "Y", "y", "Y"],
        x: 1,
      });

      // Row 3: col6 (index 5) = 'h' gets x=8
      expect(result.row3[5], "row3 key h").toEqual({
        legends: ["h", "H", "h", "H"],
        x: 1,
      });

      // Row 4: col6 (index 5) = 'n' gets x=8
      expect(result.row4[5], "row4 key n").toEqual({
        legends: ["n", "N", "n", "N"],
        x: 1,
      });

      // Row 5: split has two keys with gap in middle
      expect(result.row5.length, "row5 length").toBe(2);
      expect(result.row5[0], "row5 left").toEqual({
        legends: [" ", " ", " ", " "],
        width: 3,
        x: 3.5,
        isLayoutIndicator: true,
      });
      expect(result.row5[1], "row5 right").toEqual({
        legends: [" ", " ", " ", " "],
        width: 3,
        x: 1,
      });
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

      expect(result.row3, "row3").toEqual([
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

      expect(result.row4, "row4").toEqual([
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

      expect(result.row5, "row5").toEqual([
        {
          legends: [" ", " ", " ", " "],
          width: 6,
          x: 3.5,
          isLayoutIndicator: true,
        },
      ]);
    });

    it("converts qwertz staggered all keys", () => {
      const result = convertLayoutToKeymap(qwertzLayout as LayoutObject, {
        displayName: "qwertz",
        keymapStyle: "staggered",
        showAllKeys: true,
      });

      // Test only keys added when showAllKeys is true (not covered by basic staggered test)

      // Row1: BS added at end
      expect(result.row1[result.row1.length - 1], "row1 last").toEqual({
        legends: ["BS", "BS", "BS", "BS"],
        width: 2,
      });

      // Row2: Tab added at start, Enter (with height) added at end
      expect(result.row2[0], "row2 first").toEqual({
        legends: ["Tab", "Tab", "Tab", "Tab"],
        width: 1.5,
      });
      expect(result.row2[result.row2.length - 1], "row2 last").toEqual({
        legends: ["Enter", "Enter", "Enter", "Enter"],
        height: 2,
        width: 1.5,
      });

      // Row3: Caps added at start
      expect(result.row3[0], "row3 first").toEqual({
        legends: ["Caps", "Caps", "Caps", "Caps"],
        width: 1.75,
      });

      // Row4: Shift added at start and end
      expect(result.row4[0], "row4 first").toEqual({
        legends: ["Shift", "Shift", "Shift", "Shift"],
        width: 1.25,
      });
      expect(result.row4[result.row4.length - 1], "row4 last").toEqual({
        legends: ["Shift", "Shift", "Shift", "Shift"],
        width: 2.75,
      });

      // Row5: Ctrl, Monke, Alt at start; Alt, Monke, Meta, Ctrl at end
      expect(result.row5[0], "row5 first").toEqual({
        legends: ["Ctrl", "Ctrl", "Ctrl", "Ctrl"],
        width: 1.25,
      });
      expect(result.row5[1], "row5 second").toEqual({
        legends: ["Monke", "Monke", "Monke", "Monke"],
        width: 1.25,
      });
      expect(result.row5[2], "row5 third").toEqual({
        legends: ["Alt", "Alt", "Alt", "Alt"],
        width: 1.25,
      });
      expect(result.row5[result.row5.length - 4], "row5 Alt right").toEqual({
        legends: ["Alt", "Alt", "Alt", "Alt"],
        width: 1.25,
      });
      expect(result.row5[result.row5.length - 3], "row5 Monke right").toEqual({
        legends: ["Monke", "Monke", "Monke", "Monke"],
        width: 1.25,
      });
      expect(result.row5[result.row5.length - 2], "row5 Meta").toEqual({
        legends: ["Meta", "Meta", "Meta", "Meta"],
        width: 1.25,
      });
      expect(result.row5[result.row5.length - 1], "row5 last").toEqual({
        legends: ["Ctrl", "Ctrl", "Ctrl", "Ctrl"],
        width: 1.25,
      });

      // Also verify total counts are as expected with extra keys
      expect(result.row1.length, "row1 length").toBe(14);
      expect(result.row2.length, "row2 length").toBe(14);
      expect(result.row3.length, "row3 length").toBe(13);
      expect(result.row4.length, "row4 length").toBe(13);
    });

    it("converts qwertz split", () => {
      const result = convertLayoutToKeymap(qwertzLayout as LayoutObject, {
        displayName: "qwertz",
        keymapStyle: "split",
        showAllKeys: false,
      });

      // Test split-specific differences from staggered (not covered by basic test)

      // Row 1: col7 (index 6) = '7' gets x=8
      expect(result.row1[6], "row1 key 7").toEqual({
        legends: ["7", "/", "7", "/"],
        x: 1,
      });

      // Row 2: col6 (index 5) = 'z' gets x=8
      expect(result.row2[5], "row2 key z").toEqual({
        legends: ["z", "Z", "z", "Z"],
        x: 1,
      });

      // Row 3: col6 (index 5) = 'h' gets x=8
      expect(result.row3[5], "row3 key h").toEqual({
        legends: ["h", "H", "h", "H"],
        x: 1,
      });

      // Row 4: col5 (index 5) = 'b' gets x=8
      expect(result.row4[5], "row4 key b").toEqual({
        legends: ["b", "B", "b", "B"],
        x: 1,
      });

      // Row 5: split has two keys with gap in middle
      expect(result.row5.length, "row5 length").toBe(2);
      expect(result.row5[0], "row5 left").toEqual({
        legends: [" ", " ", " ", " "],
        width: 3,
        x: 3.5,
        isLayoutIndicator: true,
      });
      expect(result.row5[1], "row5 right").toEqual({
        legends: [" ", " ", " ", " "],
        width: 3,
        x: 1,
      });
    });
  });

  it("converts qwerty matrix", () => {
    const result = convertLayoutToKeymap(qwertyLayout as LayoutObject, {
      displayName: "qwerty",
      keymapStyle: "matrix",
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
    ]);

    expect(result.row2, "row2").toEqual([
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

    expect(result.row3, "row3").toEqual([
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

    expect(result.row4, "row4").toEqual([
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

    expect(result.row5, "row5").toEqual([
      {
        legends: [" ", " ", " ", " "],
        width: 4,
        x: 3,
        isLayoutIndicator: true,
      },
    ]);
  });

  it("converts qwerty matrix all keys", () => {
    const result = convertLayoutToKeymap(qwertyLayout as LayoutObject, {
      displayName: "qwerty",
      keymapStyle: "matrix",
      showAllKeys: true,
    });

    // Test only keys added when showAllKeys is true (not covered by basic matrix test)
    //Row1: starting with `
    expect(result.row1[0], "row1 first").toEqual({
      legends: ["`", "~", "`", "~"],
    });

    // Row1: BS added at end
    expect(result.row1[result.row1.length - 1], "row1 last").toEqual({
      legends: ["BS", "BS", "BS", "BS"],
    });

    // Row2: Tab added at start
    expect(result.row2[0], "row2 first").toEqual({
      legends: ["Tab", "Tab", "Tab", "Tab"],
    });

    // Row2: Del added at end
    expect(result.row2[result.row2.length - 1], "row2 last").toEqual({
      legends: ["Del", "Del", "Del", "Del"],
    });

    // Row3: Esc added at start
    expect(result.row3[0], "row3 first").toEqual({
      legends: ["Esc", "Esc", "Esc", "Esc"],
    });

    // Row3: ends with '
    expect(result.row3[result.row3.length - 1], "row3 last").toEqual({
      legends: ["'", '"', "'", '"'],
    });

    // Row4: Shift added at start and end
    expect(result.row4[0], "row4 first").toEqual({
      legends: ["Shift", "Shift", "Shift", "Shift"],
    });
    expect(result.row4[result.row4.length - 1], "row4 last").toEqual({
      legends: ["Enter", "Enter", "Enter", "Enter"],
    });

    // Row5: Ctrl, Monke, Alt at start; Alt,  Meta, Ctrl at end
    expect(result.row5[0], "row5 first").toEqual({
      legends: ["Ctrl", "Ctrl", "Ctrl", "Ctrl"],
    });
    expect(result.row5[1], "row5 second").toEqual({
      legends: ["Monke", "Monke", "Monke", "Monke"],
    });
    expect(result.row5[2], "row5 third").toEqual({
      legends: ["Alt", "Alt", "Alt", "Alt"],
    });
    expect(result.row5[result.row5.length - 3], "row5 Alt right").toEqual({
      legends: ["Alt", "Alt", "Alt", "Alt"],
    });
    expect(result.row5[result.row5.length - 2], "row5 Meta").toEqual({
      legends: ["Meta", "Meta", "Meta", "Meta"],
    });
    expect(result.row5[result.row5.length - 1], "row5 last").toEqual({
      legends: ["Ctrl", "Ctrl", "Ctrl", "Ctrl"],
    });

    // Also verify total counts are as expected with extra keys
    expect(result.row1.length, "row1 length").toBe(12);
    expect(result.row2.length, "row2 length").toBe(12);
    expect(result.row3.length, "row3 length").toBe(12);
    expect(result.row4.length, "row4 length").toBe(12);
  });

  it("converts qwerty split  matrix", () => {
    const result = convertLayoutToKeymap(qwertyLayout as LayoutObject, {
      displayName: "qwerty",
      keymapStyle: "split_matrix",
      showAllKeys: false,
    });

    // Row 1: col6 (index 5) = '6' gets x=8
    expect(result.row1[5], "row1 key 7").toEqual({
      legends: ["6", "^", "6", "^"],
      x: 1,
    });

    // Row 2: col6 (index 5) = 'y' gets x=8
    expect(result.row2[5], "row2 key y").toEqual({
      legends: ["y", "Y", "y", "Y"],
      x: 1,
    });

    // Row 3: col6 (index 5) = 'h' gets x=8
    expect(result.row3[5], "row3 key h").toEqual({
      legends: ["h", "H", "h", "H"],
      x: 1,
    });

    // Row 4: col6 (index 5) = 'n' gets x=8
    expect(result.row4[5], "row4 key n").toEqual({
      legends: ["n", "N", "n", "N"],
      x: 1,
    });

    // Row 5: split has two keys with gap in middle
    expect(result.row5.length, "row5 length").toBe(2);
    expect(result.row5[0], "row5 left").toEqual({
      legends: [" ", " ", " ", " "],
      width: 3,
      x: 2,
      isLayoutIndicator: true,
    });
    expect(result.row5[1], "row5 right").toEqual({
      legends: [" ", " ", " ", " "],
      width: 3,
      x: 1,
    });
  });

  it("converts steno", () => {
    const result = convertLayoutToKeymap({} as any, {
      displayName: "steno",
      keymapStyle: "steno",
      showAllKeys: false,
    });

    expect(result.row1, "row1").toEqual([]);
    expect(result.row2, "row2").toEqual([
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
    expect(result.row3, "row3").toEqual([
      { legends: ["k", "K", "k", "K"], x: 1 },
      { legends: ["w", "W", "w", "W"] },
      { legends: ["r", "R", "r", "R"] },
      { legends: ["r", "R", "r", "R"], x: 1 },
      { legends: ["b", "B", "b", "B"] },
      { legends: ["g", "G", "g", "G"] },
      { legends: ["s", "S", "s", "S"] },
      { legends: ["z", "Z", "z", "Z"] },
    ]);
    expect(result.row4, "row4").toEqual([
      { legends: ["a", "A", "a", "A"], x: 2.25 },
      { legends: ["o", "O", "o", "O"] },
      { legends: ["e", "E", "e", "E"], x: 0.5 },
      { legends: ["u", "U", "u", "U"] },
    ]);
    expect(result.row5, "row5").toEqual([]);
  });

  it("converts steno matrix", () => {
    const result = convertLayoutToKeymap({} as any, {
      displayName: "steno matrix",
      keymapStyle: "steno_matrix",
      showAllKeys: false,
    });

    expect(result.row1, "row1").toEqual([]);
    expect(result.row2, "row2").toEqual([
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
    expect(result.row3, "row3").toEqual([
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
    expect(result.row4, "row4").toEqual([
      { legends: ["a", "A", "a", "A"], x: 3 },
      { legends: ["o", "O", "o", "O"] },
      { legends: ["e", "E", "e", "E"], x: 1 },
      { legends: ["u", "U", "u", "U"] },
    ]);
    expect(result.row5, "row5").toEqual([]);
  });
});
