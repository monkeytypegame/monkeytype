import { fireEvent, render } from "@solidjs/testing-library";
import { decompressFromURI } from "lz-ts";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { ShareTestSettings } from "../../../src/ts/components/modals/ShareTestSettings";
import { setConfigStore } from "../../../src/ts/config/store";
import { hideModal, showModal } from "../../../src/ts/states/modals";

vi.mock("../../../src/ts/test/test-logic", () => ({
  restart: vi.fn(),
}));

vi.mock("../../../src/ts/states/test", () => ({
  getCurrentQuote: () => null,
  setSelectedQuoteId: vi.fn(),
}));

function checkbox(name: string): HTMLInputElement {
  const input = document.getElementById(name);
  if (input === null) throw new Error(`checkbox "${name}" not found`);
  return input as HTMLInputElement;
}

function setChecked(name: string, checked: boolean): void {
  fireEvent.change(checkbox(name), { target: { checked } });
}

// happy-dom keeps the textarea value in the attribute, browsers in the property
function sharedSettings(container: HTMLElement): unknown[] {
  const box = container.getElementsByTagName("textarea")[0];
  if (box === undefined) throw new Error("url textarea not found");
  const url = box.value !== "" ? box.value : (box.getAttribute("value") ?? "");
  const prefix = `${location.origin}?testSettings=`;
  if (!url.startsWith(prefix)) throw new Error(`unexpected url: ${url}`);
  const json = decompressFromURI(url.slice(prefix.length));
  if (json === null) throw new Error("failed to decompress url");
  return JSON.parse(json) as unknown[];
}

describe("ShareTestSettings", () => {
  beforeEach(() => {
    showModal("ShareTestSettings");
    vi.clearAllMocks();

    // Mock dialog methods that don't exist in jsdom
    HTMLDialogElement.prototype.showModal = vi.fn();
    HTMLDialogElement.prototype.show = vi.fn();
    HTMLDialogElement.prototype.close = vi.fn();

    setConfigStore("mode", "time");
  });

  afterEach(() => {
    hideModal("ShareTestSettings");
  });

  it("unchecking mode clears mode2", () => {
    const { container } = render(() => <ShareTestSettings />);

    setChecked("mode", true);
    setChecked("mode2", true);
    expect(checkbox("mode")).toBeChecked();
    expect(checkbox("mode2")).toBeChecked();

    setChecked("mode", false);

    expect(checkbox("mode")).not.toBeChecked();
    expect(checkbox("mode2")).not.toBeChecked();
    expect(sharedSettings(container)).toEqual([
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ]);
  });

  it("unchecking mode clears custom text", () => {
    setConfigStore("mode", "custom");
    const { container } = render(() => <ShareTestSettings />);

    setChecked("mode", true);
    setChecked("customText", true);
    expect(checkbox("customText")).toBeChecked();

    setChecked("mode", false);

    expect(checkbox("customText")).not.toBeChecked();
    expect(sharedSettings(container)[2]).toBeNull();
  });

  it("keeps mode2 while mode is checked", () => {
    const { container } = render(() => <ShareTestSettings />);

    setChecked("mode", true);
    setChecked("mode2", true);

    const [mode, mode2] = sharedSettings(container);
    expect(mode).toBe("time");
    expect(typeof mode2).toBe("string");
  });

  it("re-checking mode does not restore mode2", () => {
    const { container } = render(() => <ShareTestSettings />);

    setChecked("mode", true);
    setChecked("mode2", true);
    setChecked("mode", false);
    setChecked("mode", true);

    expect(checkbox("mode")).toBeChecked();
    expect(checkbox("mode2")).not.toBeChecked();
    expect(sharedSettings(container)[1]).toBeNull();
  });
});
