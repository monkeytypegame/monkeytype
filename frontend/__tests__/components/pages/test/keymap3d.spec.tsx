import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";

const { mockAnimate } = vi.hoisted(() => ({
  mockAnimate: vi
    .fn()
    .mockReturnValue({ pause: vi.fn(), then: vi.fn(async () => undefined) }),
}));

vi.mock("animejs", () => ({
  animate: mockAnimate,
}));

vi.mock("../../../../src/ts/states/test", () => ({
  getKeymapHighlightKey: () => "",
  getKeymapLayout: () => ({
    layout: "qwerty",
    layoutNameDisplayString: "qwerty",
    isMirrored: false,
  }),
  setKeymapFlashState: vi.fn(),
}));

import type {
  KeyboardDefinition,
  KeyDefinition,
} from "../../../../src/ts/components/pages/test/keymapLayouts";
import type { FlashEntry } from "../../../../src/ts/states/test";

import {
  Keymap3D,
  PERSPECTIVE,
} from "../../../../src/ts/components/pages/test/Keymap3D";
import { __testing } from "../../../../src/ts/config/testing";

const { replaceConfig } = __testing;

async function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

const key = (
  legend: string,
  extra: Partial<KeyDefinition> = {},
): KeyDefinition => ({ legends: [legend], ...extra });

const keyboardDef: KeyboardDefinition = [
  [key("1"), key("2"), key("3")],
  [key("q", { isHoming: true }), key("w"), key("e")],
];

function renderKeymap3D(
  props: Partial<{
    keyboardDef: KeyboardDefinition;
    layer: { index: number; symbolIndex?: number };
    showFirstRow: boolean;
    flashState: Record<string, FlashEntry | undefined>;
  }> = {},
): ReturnType<typeof render> {
  return render(() => (
    <Keymap3D
      keyboardDef={props.keyboardDef ?? keyboardDef}
      layer={props.layer ?? { index: 0 }}
      showFirstRow={props.showFirstRow ?? false}
      flashState={props.flashState ?? {}}
    />
  ));
}

function styleOf(el: Element | null | undefined): string {
  const attr = el?.getAttribute("style") ?? "";
  const css = (el as HTMLElement | null | undefined)?.style?.cssText ?? "";
  return `${attr} ${css}`;
}

function findKeycap(container: ParentNode, legend: string): HTMLElement {
  const el = Array.from(container.querySelectorAll("[data-keycap]")).find(
    (it) => it.textContent?.includes(legend),
  );
  expect(el).toBeTruthy();
  return el as HTMLElement;
}

// the last animation started for a given element
function lastAnimationOf(el: Element): Record<string, unknown> | undefined {
  const calls = mockAnimate.mock.calls.filter((call) => call[0] === el);
  const last = calls[calls.length - 1];
  return last?.[1] as Record<string, unknown> | undefined;
}

describe("Keymap3D", () => {
  afterEach(() => {
    cleanup();
    replaceConfig({});
    mockAnimate.mockClear();
  });

  it("renders a perspective board at the default pose", () => {
    const { container } = renderKeymap3D();

    const root = container.querySelector("[data-keymap3d-root]");
    expect(root).toBeTruthy();
    expect(styleOf(root)).toContain(`perspective: ${PERSPECTIVE}px`);

    const board = root?.querySelector("[data-keymap3d-board]");
    expect(board).toBeTruthy();
    expect(styleOf(board)).toContain("rotateX(55deg)");
    expect(styleOf(board)).toContain("rotateZ(-5deg)");
  });

  it("renders a keycap slab per key, with a raised top face and front edge", () => {
    const { container } = renderKeymap3D({ showFirstRow: true });

    expect(container.querySelectorAll("[data-keycap]").length).toEqual(6);

    const q = findKeycap(container, "q");

    const top = q.querySelector("[data-keycap-top]");
    expect(top).toBeTruthy();
    expect(styleOf(top)).toContain("translateZ(var(--key-h))");
    expect(q.textContent).toContain("q");

    const front = q.querySelector("[data-keycap-front]");
    expect(front).toBeTruthy();
    expect(styleOf(front)).toContain("rotateX(90deg)");
    expect(styleOf(front)).toContain("height: var(--key-h)");

    expect(container.querySelector("[data-keymap3d-plate]")).toBeTruthy();
  });

  it("keeps the 0.75u plate rim when no key drops below the column", () => {
    const { container } = renderKeymap3D();
    const plate = container.querySelector(
      "[data-keymap3d-plate]",
    ) as HTMLElement;
    expect(plate.style.bottom).toBe("-0.75rem");
  });

  it("extends the plate bottom rim to clear keys that drop below the column", () => {
    const { container } = renderKeymap3D({
      keyboardDef: [
        [key("1"), key("2")],
        [key("a", { y: 0.9, rotation: 10 }), key("b")],
      ],
    });
    const plate = container.querySelector(
      "[data-keymap3d-plate]",
    ) as HTMLElement;
    // the 0.9u drop plus its rotated-corner swing clears the 0.75u base rim
    const inset = -parseFloat(plate.style.bottom);
    expect(inset).toBeGreaterThan(0.75);
    expect(inset).toBeLessThanOrEqual(0.9 + 0.5 + 0.15);
  });

  it("hides the first row unless showFirstRow", () => {
    const { container } = renderKeymap3D({ showFirstRow: false });

    expect(container.querySelectorAll("[data-keycap]").length).toEqual(3);
    expect(container.textContent).not.toContain("1");
  });

  it("dips a flashed key and leaves the others at rest", async () => {
    replaceConfig({ keymapMode: "react" });

    const { container } = renderKeymap3D({
      flashState: { q: { tick: 1, correct: true } },
    });
    await nextFrame();
    await nextFrame();

    const q = findKeycap(container, "q");
    expect(lastAnimationOf(q)?.["--key-h"]).toEqual(["0.5rem", "0.32rem"]);

    const w = findKeycap(container, "w");
    expect(lastAnimationOf(w)?.["--key-h"]).toEqual(["0.5rem", "0.5rem"]);
  });

  it("does not dip keys in steno mode", async () => {
    replaceConfig({ keymapMode: "react", keymapStyle: "steno" });

    const { container } = renderKeymap3D({
      flashState: { q: { tick: 1, correct: true } },
    });
    await nextFrame();
    await nextFrame();

    const q = findKeycap(container, "q");
    expect(lastAnimationOf(q)?.["--key-h"]).toEqual(["0.5rem", "0.5rem"]);
  });

  it("orbits the board on drag, clamped to the allowed range", () => {
    const { container } = renderKeymap3D();
    const root = container.querySelector("[data-keymap3d-root]");
    const board = root?.querySelector("[data-keymap3d-board]");
    expect(root).toBeTruthy();
    expect(board).toBeTruthy();

    const fire = (type: string, x: number, y: number): void => {
      root?.dispatchEvent(
        new PointerEvent(type, {
          clientX: x,
          clientY: y,
          button: 0,
          pointerId: 1,
          pointerType: "mouse",
          bubbles: true,
        }),
      );
    };

    // drag 300px down: tilt would go 55 - 75 = -20, clamps to 20
    fire("pointerdown", 100, 100);
    fire("pointermove", 100, 400);
    fire("pointerup", 100, 400);
    expect(styleOf(board)).toContain("rotateX(20deg)");

    // drag 500px right: rake would go -5 - 125 = -130, clamps to -30
    fire("pointerdown", 100, 100);
    fire("pointermove", 600, 100);
    fire("pointerup", 600, 100);
    expect(styleOf(board)).toContain("rotateZ(-30deg)");

    // further drags do not escape the clamp
    fire("pointerdown", 0, 0);
    fire("pointermove", 5000, 5000);
    expect(styleOf(board)).toContain("rotateX(20deg)");
    expect(styleOf(board)).toContain("rotateZ(-30deg)");
  });
});
