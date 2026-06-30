import { describe, expect, it } from "vitest";
import { convertLayoutToKeymap } from "../../../../src/ts/components/pages/test/keymapConverter";

import qwertyLayout from "../../../../static/layouts/qwerty.json";
import qwertzLayout from "../../../../static/layouts/qwertz.json";

import { LayoutObject } from "@monkeytype/schemas/layouts";
import {
  Alt,
  BackspaceShort,
  Ctrl,
  EnterShort,
  Hyper,
  HyperShort,
  Meta,
  Shift,
} from "../../../../src/ts/components/pages/test/keymapLayouts";

function expectLegend(...legends: string[]): { legends: string[] } {
  if (legends.length === 1) {
    return { legends: [...legends, ...legends, ...legends, ...legends] };
  }
  if (legends.length === 2) {
    return { legends: [...legends, "", ""] };
  }

  return { legends };
}

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
          { ...expectLegend("1", "!") },
          { ...expectLegend("2", "@") },
          { ...expectLegend("3", "#") },
          { ...expectLegend("4", "$") },
          { ...expectLegend("5", "%") },
          { ...expectLegend("6", "^") },
          { ...expectLegend("7", "&") },
          { ...expectLegend("8", "*") },
          { ...expectLegend("9", "(") },
          { ...expectLegend("0", ")") },
          { ...expectLegend("-", "_") },
          { ...expectLegend("=", "+") },
        ]);

        expect(row2, "row2").toEqual([
          { ...expectLegend("q", "Q"), x: 0.5 },
          { ...expectLegend("w", "W") },
          { ...expectLegend("e", "E") },
          { ...expectLegend("r", "R") },
          { ...expectLegend("t", "T") },
          { ...expectLegend("y", "Y") },
          { ...expectLegend("u", "U") },
          { ...expectLegend("i", "I") },
          { ...expectLegend("o", "O") },
          { ...expectLegend("p", "P") },
          { ...expectLegend("[", "{") },
          { ...expectLegend("]", "}") },
        ]);

        expect(row3, "row3").toEqual([
          { ...expectLegend("a", "A"), x: 1 },
          { ...expectLegend("s", "S") },
          { ...expectLegend("d", "D") },
          { ...expectLegend("f", "F"), isHoming: true },
          { ...expectLegend("g", "G") },
          { ...expectLegend("h", "H") },
          { ...expectLegend("j", "J"), isHoming: true },
          { ...expectLegend("k", "K") },
          { ...expectLegend("l", "L") },
          { ...expectLegend(";", ":") },
          { ...expectLegend("'", '"') },
        ]);

        expect(row4, "row4").toEqual([
          { ...expectLegend("z", "Z"), x: 1.5 },
          { ...expectLegend("x", "X") },
          { ...expectLegend("c", "C") },
          { ...expectLegend("v", "V") },
          { ...expectLegend("b", "B") },
          { ...expectLegend("n", "N") },
          { ...expectLegend("m", "M") },
          { ...expectLegend(",", "<") },
          { ...expectLegend(".", ">") },
          { ...expectLegend("/", "?") },
        ]);

        expect(row5, "row5").toEqual([
          {
            ...expectLegend(" "),
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
          ...expectLegend("Backspace"),
          width: 2,
        });

        // Row2: Tab added at start
        expect(row2?.[0], "row2 first").toEqual({
          ...expectLegend("Tab"),
          width: 1.5,
        });

        // Row3: Caps added at start, Enter added at end
        expect(row3?.[0], "row3 first").toEqual({
          ...expectLegend("Caps"),
          width: 1.75,
        });
        expect(row3?.[row3?.length - 1], "row3 last").toEqual({
          ...expectLegend("Enter"),
          width: 2.25,
        });

        // Row4: Shift added at start and end
        expect(row4?.[0], "row4 first").toEqual({
          ...expectLegend(Shift),
          width: 2.25,
        });
        expect(row4?.[row4.length - 1], "row4 last").toEqual({
          ...expectLegend(Shift),
          width: 2.75,
        });

        // Row5: Ctrl, Monke, Alt at start; Alt, Monke, Meta, Ctrl at end
        expect(row5, "row5").toEqual([
          {
            ...expectLegend(Ctrl),
            width: 1.25,
          },
          {
            ...expectLegend(Meta),
            width: 1.25,
          },
          {
            ...expectLegend(Alt),
            width: 1.25,
          },
          {
            isLayoutIndicator: true,
            ...expectLegend(" "),
            width: 6.25,
            x: 0,
          },
          {
            ...expectLegend(Alt),
            width: 1.25,
          },
          {
            ...expectLegend(Meta),
            width: 1.25,
          },
          {
            ...expectLegend(Hyper),
            width: 1.25,
          },
          {
            ...expectLegend(Ctrl),
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
          { ...expectLegend("1", "!") },
          { ...expectLegend("2", `"`) },
          { ...expectLegend("3", "§") },
          { ...expectLegend("4", "$") },
          { ...expectLegend("5", "%") },
          { ...expectLegend("6", "&") },
          { ...expectLegend("7", "/") },
          { ...expectLegend("8", "(") },
          { ...expectLegend("9", ")") },
          { ...expectLegend("0", "=") },
          { ...expectLegend("ß", "?") },
          { ...expectLegend("´", "`") },
        ]);

        expect(row2, "row2").toEqual([
          { ...expectLegend("q", "Q"), x: 0.5 },
          { ...expectLegend("w", "W") },
          { ...expectLegend("e", "E") },
          { ...expectLegend("r", "R") },
          { ...expectLegend("t", "T") },
          { ...expectLegend("z", "Z") },
          { ...expectLegend("u", "U") },
          { ...expectLegend("i", "I") },
          { ...expectLegend("o", "O") },
          { ...expectLegend("p", "P") },
          { ...expectLegend("ü", "Ü") },
          { ...expectLegend("+", "*") },
        ]);

        expect(row3, "row3").toEqual([
          { ...expectLegend("a", "A"), x: 1 },
          { ...expectLegend("s", "S") },
          { ...expectLegend("d", "D") },
          { ...expectLegend("f", "F"), isHoming: true },
          { ...expectLegend("g", "G") },
          { ...expectLegend("h", "H") },
          { ...expectLegend("j", "J"), isHoming: true },
          { ...expectLegend("k", "K") },
          { ...expectLegend("l", "L") },
          { ...expectLegend("ö", "Ö") },
          { ...expectLegend("ä", "Ä") },
          { ...expectLegend("#", "'") },
        ]);

        expect(row4, "row4").toEqual([
          { ...expectLegend("<", ">"), x: 0.25 },
          { ...expectLegend("y", "Y") },
          { ...expectLegend("x", "X") },
          { ...expectLegend("c", "C") },
          { ...expectLegend("v", "V") },
          { ...expectLegend("b", "B") },
          { ...expectLegend("n", "N") },
          { ...expectLegend("m", "M") },
          { ...expectLegend(",", ";") },
          { ...expectLegend(".", ":") },
          { ...expectLegend("-", "_") },
        ]);

        expect(row5, "row5").toEqual([
          {
            ...expectLegend(" "),
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
          ...expectLegend("Backspace"),
          width: 2,
        });

        // Row2: Tab added at start, Enter (with height) added at end
        expect(row2?.[0], "row2 first").toEqual({
          ...expectLegend("Tab"),
          width: 1.5,
        });
        expect(row2?.[row2.length - 1], "row2 last").toEqual({
          ...expectLegend("Enter"),
          height: 2,
          width: 1.5,
          align: "top",
        });

        // Row3: Caps added at start
        expect(row3?.[0], "row3 first").toEqual({
          ...expectLegend("Caps"),
          width: 1.75,
        });

        // Row4: Shift added at start and end
        expect(row4?.[0], "row4 first").toEqual({
          ...expectLegend(Shift),
          width: 1.25,
        });
        expect(row4?.[row4.length - 1], "row4 last").toEqual({
          ...expectLegend(Shift),
          width: 2.75,
        });

        // Row5: Ctrl, Monke, Alt at start; Alt, Monke, Meta, Ctrl at end
        expect(row5, "row5").toEqual([
          {
            ...expectLegend(Ctrl),
            width: 1.25,
          },
          {
            ...expectLegend(Meta),
            width: 1.25,
          },
          {
            ...expectLegend(Alt),
            width: 1.25,
          },
          {
            isLayoutIndicator: true,
            ...expectLegend(" "),
            width: 6.25,
            x: 0,
          },
          {
            ...expectLegend(Alt),
            width: 1.25,
          },
          {
            ...expectLegend(Meta),
            width: 1.25,
          },
          {
            ...expectLegend(Hyper),
            width: 1.25,
          },
          {
            ...expectLegend(Ctrl),
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
          ...expectLegend("7", "&"),
          x: 1,
        });

        // Row 2: col6 (index 5) = 'y' gets gap x=1
        expect(row2?.[5], "row2 key y").toEqual({
          ...expectLegend("y", "Y"),
          x: 1,
        });

        // Row 3: col6 (index 5) = 'h' gets gap x=1
        expect(row3?.[5], "row3 key h").toEqual({
          ...expectLegend("h", "H"),
          x: 1,
        });

        // Row 4: col6 (index 5) = 'n' gets gap x=1
        expect(row4?.[5], "row4 key n").toEqual({
          ...expectLegend("n", "N"),
          x: 1,
        });

        // Row 5: split has two keys with gap in middle
        expect(row5?.length, "row5 length").toBe(2);
        expect(row5?.[0], "row5 left").toEqual({
          ...expectLegend(" "),
          width: 3,
          x: 3.5,
          isLayoutIndicator: true,
        });
        expect(row5?.[1], "row5 right").toEqual({
          ...expectLegend(" "),
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
          ...expectLegend(" "),
          width: 3,
          x: 0,
          isLayoutIndicator: true,
        });
        expect(row5?.[4], "row5 right shift").toEqual({
          ...expectLegend(" "),
          width: 3,
          x: 1.25,
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
          ...expectLegend("7", "/"),
          x: 1,
        });

        // Row 2: col6 (index 5) = 'z' gets gap x=1
        expect(row2?.[5], "row2 key z").toEqual({
          ...expectLegend("z", "Z"),
          x: 1,
        });

        // Row 3: col6 (index 5) = 'h' gets gap x=1
        expect(row3?.[5], "row3 key h").toEqual({
          ...expectLegend("h", "H"),
          x: 1,
        });

        // Row 4: col5 (index 6) = 'b' gets gap x=1
        expect(row4?.[6], "row4 key n").toEqual({
          ...expectLegend("n", "N"),
          x: 1,
        });

        // Row 5: split has two keys with gap in middle
        expect(row5?.length, "row5 length").toBe(2);
        expect(row5?.[0], "row5 left").toEqual({
          ...expectLegend(" "),
          width: 3,
          x: 3.5,
          isLayoutIndicator: true,
        });
        expect(row5?.[1], "row5 right").toEqual({
          ...expectLegend(" "),
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
          ...expectLegend(" "),
          width: 3,
          x: 0,
          isLayoutIndicator: true,
        });
        expect(row5?.[4], "row5 right shift").toEqual({
          ...expectLegend(" "),
          width: 3,
          x: 1.25,
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
          { ...expectLegend("1", "!") },
          { ...expectLegend("2", "@") },
          { ...expectLegend("3", "#") },
          { ...expectLegend("4", "$") },
          { ...expectLegend("5", "%") },
          { ...expectLegend("6", "^") },
          { ...expectLegend("7", "&") },
          { ...expectLegend("8", "*") },
          { ...expectLegend("9", "(") },
          { ...expectLegend("0", ")") },
        ]);

        expect(row2, "row2").toEqual([
          { ...expectLegend("q", "Q") },
          { ...expectLegend("w", "W") },
          { ...expectLegend("e", "E") },
          { ...expectLegend("r", "R") },
          { ...expectLegend("t", "T") },
          { ...expectLegend("y", "Y") },
          { ...expectLegend("u", "U") },
          { ...expectLegend("i", "I") },
          { ...expectLegend("o", "O") },
          { ...expectLegend("p", "P") },
        ]);

        expect(row3, "row3").toEqual([
          { ...expectLegend("a", "A") },
          { ...expectLegend("s", "S") },
          { ...expectLegend("d", "D") },
          { ...expectLegend("f", "F"), isHoming: true },
          { ...expectLegend("g", "G") },
          { ...expectLegend("h", "H") },
          { ...expectLegend("j", "J"), isHoming: true },
          { ...expectLegend("k", "K") },
          { ...expectLegend("l", "L") },
          { ...expectLegend(";", ":") },
        ]);

        expect(row4, "row4").toEqual([
          { ...expectLegend("z", "Z") },
          { ...expectLegend("x", "X") },
          { ...expectLegend("c", "C") },
          { ...expectLegend("v", "V") },
          { ...expectLegend("b", "B") },
          { ...expectLegend("n", "N") },
          { ...expectLegend("m", "M") },
          { ...expectLegend(",", "<") },
          { ...expectLegend(".", ">") },
          { ...expectLegend("/", "?") },
        ]);

        expect(row5, "row5").toEqual([
          {
            ...expectLegend(" "),
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
          ...expectLegend("`", "~"),
        });

        // Row1: BS added at end
        expect(row1?.[row1.length - 1], "row1 last").toEqual({
          ...expectLegend(BackspaceShort),
        });

        // Row2: Tab added at start
        expect(row2?.[0], "row2 first").toEqual({
          ...expectLegend("Tab"),
        });

        // Row2: Del added at end
        expect(row2?.[row2.length - 1], "row2 last").toEqual({
          ...expectLegend("[", "{"),
        });

        // Row3: Esc added at start
        expect(row3?.[0], "row3 first").toEqual({
          ...expectLegend("Esc"),
        });

        // Row3: ends with '
        expect(row3?.[row3.length - 1], "row3 last").toEqual({
          ...expectLegend("'", '"'),
        });

        // Row4: Shift added at start and end
        expect(row4?.[0], "row4 first").toEqual({
          ...expectLegend(Shift),
        });
        expect(row4?.[row4.length - 1], "row4 last").toEqual({
          ...expectLegend(EnterShort),
        });

        // Row5: Ctrl, Monke, Alt at start; Alt,  Meta, Ctrl at end
        expect(row5, "row5").toEqual([
          {
            ...expectLegend(Ctrl),
          },
          {
            ...expectLegend(Meta),
          },
          {
            ...expectLegend(Alt),
          },
          {
            isLayoutIndicator: true,
            ...expectLegend(" "),
            width: 6,
            x: 0,
          },
          {
            ...expectLegend(Alt),
          },
          {
            ...expectLegend(HyperShort),
          },
          {
            ...expectLegend(Ctrl),
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
          ...expectLegend("6", "^"),
          x: 1,
        });

        // Row 2: col6 (index 5) = 'y' gets gap x=1
        expect(row2?.[5], "row2 key y").toEqual({
          ...expectLegend("y", "Y"),
          x: 1,
        });

        // Row 3: col6 (index 5) = 'h' gets gap x=1
        expect(row3?.[5], "row3 key h").toEqual({
          ...expectLegend("h", "H"),
          x: 1,
        });

        // Row 4: col6 (index 5) = 'n' gets gap x=1
        expect(row4?.[5], "row4 key n").toEqual({
          ...expectLegend("n", "N"),
          x: 1,
        });

        // Row 5: split has two keys with gap in middle
        expect(row5?.length, "row5 length").toBe(2);
        expect(row5?.[0], "row5 left").toEqual({
          ...expectLegend(" "),
          width: 3,
          x: 2,
          isLayoutIndicator: true,
        });
        expect(row5?.[1], "row5 right").toEqual({
          ...expectLegend(" "),
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
          { ...expectLegend("s", "S"), height: 2 },
          { ...expectLegend("t", "T") },
          { ...expectLegend("p", "P") },
          { ...expectLegend("h", "H") },
          { ...expectLegend("*"), height: 2 },
          { ...expectLegend("f", "F") },
          { ...expectLegend("p", "P") },
          { ...expectLegend("l", "L") },
          { ...expectLegend("t", "T") },
          { ...expectLegend("d", "D") },
        ]);
        expect(row3, "row3").toEqual([
          { ...expectLegend("k", "K"), x: 1 },
          { ...expectLegend("w", "W") },
          { ...expectLegend("r", "R") },
          { ...expectLegend("r", "R"), x: 1 },
          { ...expectLegend("b", "B") },
          { ...expectLegend("g", "G") },
          { ...expectLegend("s", "S") },
          { ...expectLegend("z", "Z") },
        ]);
        expect(row4, "row4").toEqual([
          { ...expectLegend("a", "A"), x: 2.25 },
          { ...expectLegend("o", "O") },
          { ...expectLegend("e", "E"), x: 0.5 },
          { ...expectLegend("u", "U") },
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
          { ...expectLegend("s", "S") },
          { ...expectLegend("t", "T") },
          { ...expectLegend("p", "P") },
          { ...expectLegend("h", "H") },
          { ...expectLegend("*") },
          { ...expectLegend("f", "F"), x: 1 },
          { ...expectLegend("p", "P") },
          { ...expectLegend("l", "L") },
          { ...expectLegend("t", "T") },
          { ...expectLegend("d", "D") },
        ]);
        expect(row3, "row3").toEqual([
          { ...expectLegend("s", "S") },
          { ...expectLegend("k", "K") },
          { ...expectLegend("w", "W") },
          { ...expectLegend("r", "R") },
          { ...expectLegend("*") },
          { ...expectLegend("r", "R"), x: 1 },
          { ...expectLegend("b", "B") },
          { ...expectLegend("g", "G") },
          { ...expectLegend("s", "S") },
          { ...expectLegend("z", "Z") },
        ]);
        expect(row4, "row4").toEqual([
          { ...expectLegend("a", "A"), x: 3 },
          { ...expectLegend("o", "O") },
          { ...expectLegend("e", "E"), x: 1 },
          { ...expectLegend("u", "U") },
        ]);
        expect(row5, "row5").toBeUndefined();
      });
    });
  });
});
