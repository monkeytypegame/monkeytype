import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, it, expect } from "vitest";
import {
  getFileKind,
  supportedFileTypes,
} from "../../src/ts/utils/file-text-extractor";

describe("file-text-extractor", () => {
  describe("getFileKind", () => {
    it.each([
      ["notes.txt", "text/plain", "text"],
      ["notes.pdf", "application/pdf", "pdf"],
      ["shot.png", "image/png", "image"],
      ["photo.jpg", "image/jpeg", "image"],
      ["photo.webp", "image/webp", "image"],
      ["scan.bmp", "image/bmp", "image"],
    ] as const)("detects %s by mime type", (name, type, expected) => {
      expect(getFileKind({ name, type })).toBe(expected);
    });

    it("ignores the case of the mime type", () => {
      expect(getFileKind({ name: "a", type: "Application/PDF" })).toBe("pdf");
    });

    it.each([
      ["notes.txt", "text"],
      ["NOTES.PDF", "pdf"],
      ["photo.JPEG", "image"],
    ] as const)(
      "falls back to the extension of %s without a mime type",
      (name, expected) => {
        expect(getFileKind({ name, type: "" })).toBe(expected);
      },
    );

    it.each([
      ["archive.zip", "application/zip"],
      ["page.html", "text/html"],
      ["animation.gif", "image/gif"],
      ["vector.svg", "image/svg+xml"],
      ["noextension", ""],
      ["notes.docx", ""],
    ])("rejects %s", (name, type) => {
      expect(getFileKind({ name, type })).toBeUndefined();
    });

    it("does not trust the extension over the mime type", () => {
      expect(
        getFileKind({ name: "fake.pdf", type: "application/zip" }),
      ).toBeUndefined();
    });

    it("accepts every extension offered in the file picker", () => {
      for (const extension of supportedFileTypes.split(",")) {
        expect(
          getFileKind({ name: `file${extension}`, type: "" }),
        ).not.toBeUndefined();
      }
    });
  });

  describe("pdf.js", () => {
    it("does not polyfill the frozen Math object", () => {
      //Math is frozen in index.ts. A pdf.js build which adds a polyfill to
      //Math fails to load in every browser that is missing that feature,
      //while still working in the newest browsers.
      const require = createRequire(import.meta.url);
      const source = readFileSync(
        require.resolve("pdfjs-dist/legacy/build/pdf.mjs"),
        "utf8",
      );
      expect(source).not.toMatch(
        /target:\s*['"]Math['"]|\bMath\.\w+\s*=[^=]|defineProperty\(\s*Math\b/,
      );
    });
  });
});
