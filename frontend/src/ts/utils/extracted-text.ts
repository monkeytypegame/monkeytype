/**
 * Helpers to turn raw text extracted from documents (PDF text layers, OCR)
 * into text that is pleasant to type: visual line wraps are removed,
 * paragraphs are kept and page numbers are dropped.
 */

/** The subset of a pdf.js `TextItem` needed to rebuild lines. */
export type TextItemLike = {
  str: string;
  hasEOL: boolean;
  /** pdf.js transformation matrix, index 4 and 5 are the x and y position */
  transform: number[];
  height: number;
  /** text direction: "ltr", "rtl" or "ttb" */
  dir?: string;
};

export type PositionedLine = {
  text: string;
  /** position of the start of the line */
  x: number;
  /** baseline position, PDF coordinates grow towards the top of the page */
  y: number;
  height: number;
  /** the line is not written left to right */
  notLtr?: boolean;
};

export type PageLines = {
  lines: PositionedLine[];
  /** y position of the bottom edge of the page */
  bottom: number;
  /** y position of the top edge of the page */
  top: number;
};

/** A gap this many times larger than the usual line gap starts a paragraph. */
const PARAGRAPH_GAP_FACTOR = 1.4;
/** Lines whose font size differs by more than this are not the same paragraph. */
const FONT_SIZE_TOLERANCE = 0.15;
/** A line indented by this many times its height starts a paragraph. */
const INDENT_FACTOR = 0.8;
/** Share of the page height at the top and bottom used by headers and footers. */
const PAGE_MARGIN = 0.08;

/** Bullet characters which cannot be typed on a keyboard. */
const BULLET = /^[•◦▪‣∙●○■□▸▹➢➤◆◇]\s*/u;
const LIST_MARKER =
  /^(?:[•◦▪‣∙●○■□▸▹➢➤◆◇]|[-–—*]\s|\d{1,2}[.)]\s|[a-z]\)\s|\(\w{1,2}\)\s)/u;
const SENTENCE_END = /[.!?:;…。！？]["'”’)\]]*$/u;

const CJK_END = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]$/u;
const CJK_START = /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;

const PAGE_NUMBER =
  /^[\s\-–—|()[\]]*(?:page\s*)?\d{1,4}(?:\s*(?:\/|of)\s*\d{1,4})?[\s\-–—|()[\]]*$/i;

const LIGATURES: Record<string, string> = {
  ﬀ: "ff",
  ﬁ: "fi",
  ﬂ: "fl",
  ﬃ: "ffi",
  ﬄ: "ffl",
  ﬅ: "st",
  ﬆ: "st",
};

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function median(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle];
  return ((sorted[middle - 1] as number) + (sorted[middle] as number)) / 2;
}

/**
 * Rebuild the visual lines of a page from pdf.js text items.
 * Empty lines are dropped.
 */
export function textItemsToLines(items: TextItemLike[]): PositionedLine[] {
  const lines: PositionedLine[] = [];
  let text = "";
  let start: { x: number; y: number; notLtr: boolean } | undefined;
  let height = 0;

  const flush = (): void => {
    const collapsed = collapseWhitespace(text);
    if (collapsed !== "" && start !== undefined) {
      const line: PositionedLine = {
        text: collapsed,
        x: start.x,
        y: start.y,
        height,
      };
      if (start.notLtr) line.notLtr = true;
      lines.push(line);
    }
    text = "";
    start = undefined;
    height = 0;
  };

  for (const item of items) {
    if (item.str.trim() !== "") {
      start ??= {
        x: item.transform[4] ?? 0,
        y: item.transform[5] ?? 0,
        notLtr: item.dir !== undefined && item.dir !== "ltr",
      };
      height = Math.max(height, item.height);
    }
    text += item.str;
    if (item.hasEOL) flush();
  }
  flush();

  return lines;
}

/**
 * Join the wrapped lines of one paragraph into a single line.
 * Words hyphenated across a line break are put back together.
 */
export function joinWrappedLines(lines: string[]): string {
  let result = "";

  for (const line of lines) {
    const current = collapseWhitespace(line);
    if (current === "") continue;

    if (result === "") {
      result = current;
    } else if (/\p{L}-$/u.test(result) && /^\p{Ll}/u.test(current)) {
      //"combina-" + "tion" => "combination"
      result = result.slice(0, -1) + current;
    } else if (/\S-$/.test(result)) {
      //"pre-" + "2020" => "pre-2020"
      result += current;
    } else if (CJK_END.test(result) && CJK_START.test(current)) {
      result += current;
    } else {
      result += ` ${current}`;
    }
  }

  return result;
}

/**
 * Group the lines of one page into paragraphs.
 * A paragraph starts when the vertical gap is larger than usual, the font size
 * changes, the text moves back up the page (new column, header, footer), the
 * line is indented or the line is a list item.
 */
export function groupLinesIntoParagraphs(lines: PositionedLine[]): string[] {
  const gaps: number[] = [];
  for (let i = 1; i < lines.length; i++) {
    const gap =
      (lines[i - 1] as PositionedLine).y - (lines[i] as PositionedLine).y;
    if (gap > 0) gaps.push(gap);
  }
  const usualGap = median(gaps);

  const paragraphs: string[][] = [];
  let previous: PositionedLine | undefined;
  let inListItem = false;

  for (const line of lines) {
    const isListItem = LIST_MARKER.test(line.text);
    let startsParagraph = previous === undefined || isListItem;

    if (previous !== undefined && !startsParagraph) {
      const gap = previous.y - line.y;
      const largerHeight = Math.max(previous.height, line.height);
      const sameFontSize =
        Math.abs(previous.height - line.height) <=
        largerHeight * FONT_SIZE_TOLERANCE;
      //wrapped lines of a list item are indented as well
      const indented =
        !inListItem &&
        line.notLtr !== true &&
        previous.notLtr !== true &&
        line.x - previous.x > largerHeight * INDENT_FACTOR;

      startsParagraph =
        gap <= 0 ||
        !sameFontSize ||
        indented ||
        (usualGap !== undefined && gap > usualGap * PARAGRAPH_GAP_FACTOR);
    }

    if (startsParagraph) {
      paragraphs.push([line.text]);
      inListItem = isListItem;
    } else {
      (paragraphs[paragraphs.length - 1] as string[]).push(line.text);
    }
    previous = line;
  }

  return paragraphs.map(joinWrappedLines).filter((it) => it !== "");
}

/**
 * Remove page numbers and running headers and footers.
 * Only lines in the top and bottom margin of a page are considered. They are
 * removed if they are a page number or if they repeat on most of the pages.
 */
export function removeMarginalText(pages: PageLines[]): PositionedLine[][] {
  const isMarginal = (line: PositionedLine, page: PageLines): boolean => {
    const margin = (page.top - page.bottom) * PAGE_MARGIN;
    return line.y > page.top - margin || line.y < page.bottom + margin;
  };
  //page numbers inside of a header change from page to page
  const getKey = (line: PositionedLine): string =>
    line.text.toLowerCase().replace(/\d+/g, "#");

  const pagesByKey = new Map<string, number>();
  for (const page of pages) {
    const keys = new Set(
      page.lines.filter((line) => isMarginal(line, page)).map(getKey),
    );
    for (const key of keys) {
      pagesByKey.set(key, (pagesByKey.get(key) ?? 0) + 1);
    }
  }

  const repeats = (line: PositionedLine): boolean => {
    const count = pagesByKey.get(getKey(line)) ?? 0;
    return count >= 2 && count > pages.length / 2;
  };

  return pages.map((page) =>
    page.lines.filter(
      (line) =>
        !isMarginal(line, page) ||
        (!PAGE_NUMBER.test(line.text) && !repeats(line)),
    ),
  );
}

/**
 * Join paragraphs which were split in the middle of a sentence, e.g. by a
 * page break or by the layout analysis of the OCR.
 */
export function mergeBrokenParagraphs(paragraphs: string[]): string[] {
  const result: string[] = [];

  for (const paragraph of paragraphs) {
    const previous = result[result.length - 1];
    if (
      previous !== undefined &&
      !SENTENCE_END.test(previous) &&
      /^\p{Ll}/u.test(paragraph) &&
      !LIST_MARKER.test(paragraph)
    ) {
      result[result.length - 1] = joinWrappedLines([previous, paragraph]);
    } else {
      result.push(paragraph);
    }
  }

  return result;
}

/**
 * Split plain text (e.g. OCR output) into paragraphs.
 * Blank lines separate paragraphs, single line breaks are treated as wraps.
 */
export function splitPlainTextIntoParagraphs(text: string): string[] {
  return text
    .replace(/\r\n?/g, "\n")
    .split(/\n[^\S\n]*\n/)
    .map((paragraph) => joinWrappedLines(paragraph.split("\n")))
    .filter((it) => it !== "");
}

/**
 * Remove a page number at the start or end of a page.
 * A page which only consists of a number is kept.
 */
export function removePageNumbers(paragraphs: string[]): string[] {
  const result = [...paragraphs];
  if (result.length > 1 && PAGE_NUMBER.test(result[0] as string)) {
    result.shift();
  }
  if (
    result.length > 1 &&
    PAGE_NUMBER.test(result[result.length - 1] as string)
  ) {
    result.pop();
  }
  return result;
}

/**
 * Build the final text, one paragraph per line.
 * Bullet characters are removed, they cannot be typed.
 */
export function paragraphsToText(paragraphs: string[]): string {
  return paragraphs
    .map((paragraph) =>
      collapseWhitespace(
        paragraph
          .replace(BULLET, "")
          .replace(/[ﬀ-ﬆ]/g, (it) => LIGATURES[it] ?? it),
      ),
    )
    .filter((it) => it !== "")
    .join("\n");
}
