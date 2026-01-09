import { describe, vi, it, expect, beforeEach, Mock } from "vitest";
import { createSignal } from "solid-js";
import { render } from "@solidjs/testing-library";
import { LiveStats } from "../../../src/ts/components/test/LiveStats";

import * as ConfigSignals from "../../../src/ts/signals/config";
import * as TestSignals from "../../../src/ts/signals/test";

import { isFocused } from "../../../src/ts/test/focus";

describe("LiveStats", () => {
  const [wpm] = createSignal("120");
  const [acc] = createSignal("98%");
  const [burst] = createSignal("140");

  const liveSpeedStyleMock = vi.spyOn(ConfigSignals, "getLiveSpeedStyle");
  const liveAccStyleMock = vi.spyOn(ConfigSignals, "getLiveAccStyle");
  const liveBurstStyleMock = vi.spyOn(ConfigSignals, "getLiveBurstStyle");
  const statsVisibleMock = vi.spyOn(TestSignals, "statsVisible");

  beforeEach(() => {
    [
      isFocused as Mock,
      liveSpeedStyleMock,
      liveAccStyleMock,
      liveBurstStyleMock,
      statsVisibleMock,
    ].forEach((it) => it.mockClear());

    (isFocused as Mock).mockReturnValue(true);
    liveSpeedStyleMock.mockReturnValue("text");
    liveBurstStyleMock.mockReturnValue("text");
    liveAccStyleMock.mockReturnValue("text");
    statsVisibleMock.mockReturnValue({ visible: true, animate: false });
  });

  function renderElement(mode: "mini" | "text"): {
    speed: HTMLElement;
    acc: HTMLElement;
    burst: HTMLElement;
  } {
    const { container } = render(() => (
      <LiveStats mode={mode} wpm={wpm} acc={acc} burst={burst} />
    ));

    return {
      // oxlint-disable-next-line no-non-null-assertion
      speed: container.querySelector(".speed")!,
      // oxlint-disable-next-line no-non-null-assertion
      acc: container.querySelector(".acc")!,
      // oxlint-disable-next-line no-non-null-assertion
      burst: container.querySelector(".burst")!,
    };
  }

  it("does render if mode matches", () => {
    //GIVEN

    //WHEN
    const { speed, acc, burst } = renderElement("text");

    //THEN
    expect(speed).toHaveAttribute("data-visible", "true");
    expect(speed).toHaveTextContent("120");
    expect(acc).toHaveAttribute("data-visible", "true");
    expect(acc).toHaveTextContent("98%");
    expect(burst).toHaveAttribute("data-visible", "true");
    expect(burst).toHaveTextContent("140");
  });
  it("does not render if mode does not match", () => {
    //WHEN
    const { speed, acc, burst } = renderElement("mini");

    //THEN
    expect(speed).toHaveAttribute("data-visible", "false");
    expect(acc).toHaveAttribute("data-visible", "false");
    expect(burst).toHaveAttribute("data-visible", "false");
  });

  it("does not render if not focussed", () => {
    //GIVEN
    (isFocused as Mock).mockReturnValue(false);

    //WHEN
    const { speed, acc, burst } = renderElement("text");

    //WHEN
    expect(speed).toHaveAttribute("data-visible", "false");
    expect(acc).toHaveAttribute("data-visible", "false");
    expect(burst).toHaveAttribute("data-visible", "false");
  });
  it("does not render if statsVisible=false", () => {
    //GIVEN
    statsVisibleMock.mockReturnValue({ visible: false });

    //WHEN
    const { speed, acc, burst } = renderElement("text");

    //WHEN
    expect(speed).toHaveAttribute("data-visible", "false");
    expect(acc).toHaveAttribute("data-visible", "false");
    expect(burst).toHaveAttribute("data-visible", "false");
  });
});
