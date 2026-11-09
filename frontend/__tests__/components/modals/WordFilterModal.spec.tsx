import { fireEvent, render, screen, waitFor } from "@solidjs/testing-library";
import { beforeEach, describe, expect, it, vi } from "vitest";

import englishLanguage from "../../../static/languages/english.json";

const { showNoticeNotification } = vi.hoisted(() => ({
  showNoticeNotification: vi.fn(),
}));

vi.mock("../../../src/ts/states/notifications", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("../../../src/ts/states/notifications")
  >()),
  showNoticeNotification,
}));

vi.stubGlobal(
  "fetch",
  vi.fn(async (input: string) => {
    if (input !== "/languages/english.json") {
      throw new Error(`unexpected fetch: ${input}`);
    }
    return new Response(JSON.stringify(englishLanguage), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
);

describe("components/modals/WordFilterModal.tsx", () => {
  let WordFilterModal: (typeof import("../../../src/ts/components/modals/WordFilterModal"))["WordFilterModal"];
  let showModal: (typeof import("../../../src/ts/states/modals"))["showModal"];

  beforeEach(async () => {
    vi.resetModules();
    showNoticeNotification.mockClear();

    // jsdom does not implement the dialog methods
    HTMLDialogElement.prototype.showModal = vi.fn();
    HTMLDialogElement.prototype.show = vi.fn();
    HTMLDialogElement.prototype.close = vi.fn();

    const [modal, modals] = await Promise.all([
      import("../../../src/ts/components/modals/WordFilterModal"),
      import("../../../src/ts/states/modals"),
    ]);
    WordFilterModal = modal.WordFilterModal;
    showModal = modals.showModal;
  });

  function regexInput(): HTMLInputElement {
    const input = screen
      .getByText("regex")
      .closest("div")
      ?.querySelector("input");
    if (input === null || input === undefined) {
      throw new Error("regex input not found");
    }
    return input;
  }

  it("shows an error for an invalid regex instead of throwing", async () => {
    const setChainedData = vi.fn();
    showModal("WordFilter");
    render(() => <WordFilterModal setChainedData={setChainedData} />);

    await screen.findByText(/words found/);

    fireEvent.input(regexInput(), { target: { value: "(" } });

    // preview shows the error
    await screen.findByText("Invalid regex", {}, { timeout: 2000 });

    fireEvent.click(screen.getByText("set"));

    await waitFor(() => {
      expect(showNoticeNotification).toHaveBeenCalledWith("Invalid regex");
    });
    expect(setChainedData).not.toHaveBeenCalled();

    // the modal recovers once the regex is valid again
    fireEvent.input(regexInput(), { target: { value: "^a" } });
    await screen.findByText(/words found/, {}, { timeout: 2000 });
  });
});
