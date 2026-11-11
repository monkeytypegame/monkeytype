import { render } from "@solidjs/testing-library";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { NoCssDetails } from "../../../src/ts/components/core/NoCssDetails";

function text(id: string): string {
  return (document.getElementById(id)?.textContent ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

describe("NoCssDetails", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="nocss">
        <span id="nocss-keys"></span>
        <span id="nocss-stylesheets"></span>
        <span id="nocss-js"></span>
      </div>`;
    document.head.innerHTML = `<link rel="stylesheet" href="/css/style.abc.css"><link rel="stylesheet" href="/other.css">`;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.head.innerHTML = "";
  });

  it("shows Ctrl outside mac", () => {
    vi.stubGlobal("navigator", { userAgent: "Mozilla/5.0 (X11; Linux)" });
    render(() => <NoCssDetails />);

    expect(text("nocss-keys")).toBe("Ctrl + Shift + R");
  });

  it("shows Cmd on mac", () => {
    vi.stubGlobal("navigator", { userAgent: "Mozilla/5.0 (Macintosh)" });
    render(() => <NoCssDetails />);

    expect(text("nocss-keys")).toBe("Cmd + Shift + R");
  });

  it("lists only the app stylesheets and the client version", () => {
    render(() => <NoCssDetails />);

    expect(text("nocss-stylesheets")).toBe(
      `Requested stylesheets:${location.origin}/css/style.abc.css`,
    );
    expect(text("nocss-js")).toMatch(/^Requested Javascript files:/);
    expect(text("nocss-js")).toMatch(/Client version:\S+$/);
  });
});
