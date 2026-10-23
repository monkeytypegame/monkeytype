import { render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";

// opens indexedDB on import, which jsdom lacks
vi.mock("../../../../src/ts/controllers/theme-controller", () => ({
  randomizeTheme: vi.fn(),
}));
// uses matchMedia on import, which jsdom lacks
vi.mock("../../../../src/ts/controllers/ad-controller", () => ({
  destroyResult: vi.fn(),
}));
// funbox functions pull in test state, which fetches keyboard layouts on load
vi.mock("../../../../src/ts/utils/json-data", async (importOriginal) => ({
  ...(await importOriginal()),
  getLayout: vi.fn(async () => new Promise(() => undefined)),
}));
const onKeyDown = vi.hoisted(() => vi.fn());
vi.mock("../../../../src/ts/input/listeners/key", () => ({
  onKeyDown,
  onKeyUp: vi.fn(),
}));

import { WordsInput } from "../../../../src/ts/components/pages/test/WordsInput";
import { getInputElement } from "../../../../src/ts/input/input-element";
import { setWordsInputPosition } from "../../../../src/ts/states/test";

function renderInput(): HTMLTextAreaElement {
  const { container } = render(() => <WordsInput />);
  return container.querySelector("#wordsInput") as HTMLTextAreaElement;
}

describe("WordsInput", () => {
  afterEach(() => {
    setWordsInputPosition({ top: 0, left: 0 });
    onKeyDown.mockClear();
  });

  it("registers its textarea as the input element", () => {
    const input = renderInput();
    expect(getInputElement()).toBe(input);
  });

  it("listens on the textarea itself, not delegated to document", () => {
    const input = renderInput();
    input.addEventListener("keydown", (e) => e.stopPropagation());

    input.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));

    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });

  it("blocks pasting", () => {
    const input = renderInput();
    const paste = new Event("paste", { cancelable: true });

    input.dispatchEvent(paste);

    expect(paste.defaultPrevented).toBe(true);
  });

  it("follows the words input position", () => {
    const input = renderInput();

    setWordsInputPosition({ top: 12, left: 34, width: 56, maxWidth: 90 });

    expect(input.style.top).toBe("12px");
    expect(input.style.left).toBe("34px");
    expect(input.style.width).toBe("56px");
    expect(input.style.maxWidth).toBe("90%");

    setWordsInputPosition({ top: 0, left: 0 });

    expect(input.style.width).toBe("");
    expect(input.style.maxWidth).toBe("");
  });
});
