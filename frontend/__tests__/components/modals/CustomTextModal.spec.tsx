import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@solidjs/testing-library";
import { beforeEach, describe, expect, it, vi } from "vitest";

import englishLanguage from "../../../static/languages/english.json";
import qwertyLayout from "../../../static/layouts/qwerty.json";

vi.mock("../../../src/ts/test/test-logic", () => ({
  restartTest: vi.fn(),
}));

vi.mock("../../../src/ts/utils/lyrics-provider", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("../../../src/ts/utils/lyrics-provider")
  >()),
  searchTracks: vi.fn(async () => [
    {
      id: "1",
      title: "Song",
      artist: "Artist",
      album: "Album",
      lyrics: "[Chorus]\nhello world\nfoo bar",
    },
  ]),
  fetchTrackInfo: vi.fn(async () => null),
}));

// The test state module fetches the input/keymap layout on module load and
// the word filter modal fetches the language data, so stub the static files.
vi.stubGlobal(
  "fetch",
  vi.fn(async (input: string) => {
    const body =
      input === "/layouts/qwerty.json"
        ? qwertyLayout
        : input === "/languages/english.json"
          ? englishLanguage
          : undefined;
    if (body === undefined) {
      throw new Error(`unexpected fetch: ${input}`);
    }
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
);

const PIPE_TEXT = "a|b c d|e";

describe("components/modals/CustomTextModal.tsx", () => {
  // The custom-text module holds module-level LocalStorageWithSchema instances
  // with in-memory caches, so re-import the module (and the modals, so they
  // share the same instance) for a clean state per test.
  let CustomText: typeof import("../../../src/ts/test/custom-text");
  let CustomTextModal: (typeof import("../../../src/ts/components/modals/CustomTextModal"))["CustomTextModal"];
  let showModal: (typeof import("../../../src/ts/states/modals"))["showModal"];

  const textareaPlaceholder = "type or paste your custom text";

  beforeEach(async () => {
    localStorage.clear();
    vi.resetModules();

    // jsdom does not implement the dialog methods
    HTMLDialogElement.prototype.showModal = vi.fn();
    HTMLDialogElement.prototype.show = vi.fn();
    HTMLDialogElement.prototype.close = vi.fn();

    const [customText, modal, modals] = await Promise.all([
      import("../../../src/ts/test/custom-text"),
      import("../../../src/ts/components/modals/CustomTextModal"),
      import("../../../src/ts/states/modals"),
    ]);
    CustomText = customText;
    CustomTextModal = modal.CustomTextModal;
    showModal = modals.showModal;
  });

  /**
   * Opens the chained saved texts modal and loads the given text, waiting for
   * the custom text modal to be pre-filled with it.
   */
  async function openSavedText(name: string): Promise<void> {
    fireEvent.click(screen.getByText("saved texts"));
    await screen.findByText(name);
    fireEvent.click(screen.getByText(name));
    await waitFor(() => {
      expect(screen.getByPlaceholderText(textareaPlaceholder)).toHaveValue(
        PIPE_TEXT,
      );
    });
  }

  // clicks the closest <selector> ancestor of the first element with the
  // given text, throwing if either is missing
  function clickAncestor(text: string, selector: string): void {
    const el = screen.getAllByText(text).at(0)?.closest(selector);
    if (el === null || el === undefined) {
      throw new Error(`no <${selector}> ancestor for text "${text}"`);
    }
    fireEvent.click(el);
  }

  /** searches for the mocked song in the lyrics modal and opens it */
  async function openMockedSong(): Promise<void> {
    const searchInput = await screen.findByPlaceholderText(
      "search by song, artist or album and press enter",
    );
    fireEvent.input(searchInput, { target: { value: "song" } });
    fireEvent.keyDown(searchInput, { key: "Enter" });
    fireEvent.click(await screen.findByText("Song"));
  }

  function submitSaveDialog(): void {
    const saveDialog = document.getElementById("SaveCustomTextModal");
    if (saveDialog === null) {
      throw new Error("save custom text dialog not found");
    }
    fireEvent.click(within(saveDialog).getByText("save"));
  }

  it("pre-fills the delimiter option from a saved pipe text and keeps sections intact", async () => {
    localStorage.setItem(
      "customText",
      JSON.stringify({ saved: { text: PIPE_TEXT, isPipeDelimiter: true } }),
    );

    showModal("CustomText");
    render(() => <CustomTextModal />);

    await openSavedText("saved");

    // the word delimiter option is filled from the stored flag
    const pipeButton = screen.getByText("pipe").closest("button");
    expect(pipeButton?.className).toContain("themable-button-active");

    fireEvent.click(screen.getByText("ok"));

    // the test gets sections, "b c d" is not split up
    await waitFor(() => {
      expect(CustomText.getText()).toStrictEqual(["a", "b c d", "e"]);
    });
    expect(CustomText.getPipeDelimiter()).toBe(true);
    expect(CustomText.getLimitMode()).toBe("section");
    expect(CustomText.getLimitValue()).toBe(3);
  });

  it("splits sections into words when the user switches the delimiter to space", async () => {
    localStorage.setItem(
      "customText",
      JSON.stringify({ saved: { text: PIPE_TEXT, isPipeDelimiter: true } }),
    );

    showModal("CustomText");
    render(() => <CustomTextModal />);

    await openSavedText("saved");

    // first match is the word delimiter toggle, the other is the
    // "replace new lines" option
    clickAncestor("space", "button");

    fireEvent.click(screen.getByText("ok"));

    await waitFor(() => {
      expect(CustomText.getText()).toStrictEqual(["a", "b", "c", "d", "e"]);
    });
    expect(CustomText.getPipeDelimiter()).toBe(false);
  });

  it("saves text with pipes and stores the pipe delimiter flag", async () => {
    showModal("CustomText");
    render(() => <CustomTextModal />);

    fireEvent.input(screen.getByPlaceholderText(textareaPlaceholder), {
      target: { value: PIPE_TEXT },
    });
    clickAncestor("pipe", "button");
    clickAncestor("save", "button");

    const nameInput = await screen.findByPlaceholderText("name");
    fireEvent.input(nameInput, { target: { value: "book" } });

    submitSaveDialog();

    await waitFor(() => {
      expect(
        JSON.parse(localStorage.getItem("customText") ?? "null"),
      ).toStrictEqual({ book: { text: PIPE_TEXT, isPipeDelimiter: true } });
    });
    expect(CustomText.getCustomText("book")).toStrictEqual(["a", "b c d", "e"]);
    expect(CustomText.getCustomTextIsPipeDelimiter("book")).toBe(true);
  });

  it("saves long text with pipes and the pipe delimiter flag", async () => {
    localStorage.setItem(
      "customText",
      JSON.stringify({ saved: { text: PIPE_TEXT, isPipeDelimiter: true } }),
    );

    showModal("CustomText");
    render(() => <CustomTextModal />);

    await openSavedText("saved");

    // re-save the loaded text as a long text
    clickAncestor("save", "button");
    const nameInput = await screen.findByPlaceholderText("name");
    fireEvent.input(nameInput, { target: { value: "book" } });
    // the checkbox input is hidden (class "hidden"), so click its label
    clickAncestor("Long text (book mode)", "label");

    submitSaveDialog();

    await waitFor(() => {
      expect(
        JSON.parse(localStorage.getItem("customTextLong") ?? "null"),
      ).toStrictEqual({
        book: { text: PIPE_TEXT, progress: 0, isPipeDelimiter: true },
      });
    });
    expect(CustomText.getCustomText("book", true)).toStrictEqual([
      "a",
      "b c d",
      "e",
    ]);
    expect(CustomText.getCustomTextIsPipeDelimiter("book", true)).toBe(true);
  });

  it("fills the text with lyrics chosen from the lyrics search instead of starting a test", async () => {
    const { restartTest } = await import("../../../src/ts/test/test-logic");
    vi.mocked(restartTest).mockClear();

    showModal("CustomText");
    render(() => <CustomTextModal />);

    fireEvent.input(screen.getByPlaceholderText(textareaPlaceholder), {
      target: { value: "old text" },
    });

    fireEvent.click(screen.getByText("load lyrics"));
    await openMockedSong();
    fireEvent.click(await screen.findByText("use lyrics"));

    // back in the custom text modal, with the cleaned up lyrics in the textarea
    await waitFor(() => {
      expect(screen.getByPlaceholderText(textareaPlaceholder)).toHaveValue(
        "hello world foo bar",
      );
    });
    expect(restartTest).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("ok"));

    await waitFor(() => {
      expect(CustomText.getText()).toStrictEqual([
        "hello",
        "world",
        "foo",
        "bar",
      ]);
    });
    expect(CustomText.getPipeDelimiter()).toBe(false);
    expect(CustomText.getLimitValue()).toBe(4);
  });

  it("starts the test right away when the lyrics search is opened on its own", async () => {
    const { restartTest } = await import("../../../src/ts/test/test-logic");
    vi.mocked(restartTest).mockClear();

    showModal("LyricsSearch");
    render(() => <CustomTextModal />);

    await openMockedSong();
    fireEvent.click(await screen.findByText("start typing"));

    await waitFor(() => {
      expect(CustomText.getText()).toStrictEqual([
        "hello",
        "world",
        "foo",
        "bar",
      ]);
    });
    expect(restartTest).toHaveBeenCalled();
  });
});
