import { render } from "@solidjs/testing-library";
import { userEvent } from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { ScrollToTop } from "../../../../src/ts/components/layout/footer/ScrollToTop";
import * as CoreSignals from "../../../../src/ts/signals/core";

describe("ScrollToTop", () => {
  const getActivePageMock = vi.spyOn(CoreSignals, "getActivePage");
  beforeEach(() => {
    getActivePageMock.mockClear().mockReturnValue("account");
    Object.defineProperty(window, "scrollY", { value: 0, writable: true });
  });

  function renderElement(): {
    container: HTMLElement;
    button: HTMLButtonElement;
  } {
    const { container } = render(() => <ScrollToTop />);

    return {
      // oxlint-disable-next-line no-non-null-assertion
      container: container.children[0]! as HTMLElement,
      // oxlint-disable-next-line no-non-null-assertion
      button: container.querySelector("button")!,
    };
  }

  it("renders with correct classes and structure", () => {
    const { container, button } = renderElement();

    expect(container).toHaveClass("content-grid", "ScrollToTop");
    expect(button).toHaveClass("breakout");
    expect(button.querySelector("i")).toHaveClass("fas", "fa-angle-double-up");
  });

  it("renders invisible when scrollY is 0", () => {
    const { button } = renderElement();

    expect(button).toHaveClass("opacity-0");
  });

  it("becomes visible when scrollY > 100 on non-test pages", () => {
    const { button } = renderElement();
    scrollTo(150);

    expect(button).not.toHaveClass("opacity-0");
  });

  it("stays invisible on test page at scroll 0", () => {
    getActivePageMock.mockReturnValue("test");
    const { button } = renderElement();

    expect(button).toHaveClass("opacity-0");
  });

  it("stays invisible on test page even with scroll > 100", () => {
    getActivePageMock.mockReturnValue("test");
    const { button } = renderElement();
    scrollTo(150);

    expect(button).toHaveClass("opacity-0");
  });

  it("becomes invisible when scroll < 100 on non-test pages", () => {
    const { button } = renderElement();
    scrollTo(150);
    expect(button).not.toHaveClass("opacity-0");

    scrollTo(50);
    expect(button).toHaveClass("opacity-0");
  });

  it("scrolls to top and hides button on click", async () => {
    const scrollToSpy = vi.fn();
    window.scrollTo = scrollToSpy;
    const { button } = renderElement();
    scrollTo(150);

    await userEvent.click(button);

    expect(scrollToSpy).toHaveBeenCalledWith({
      top: 0,
      behavior: "smooth",
    });
    expect(button).toHaveClass("opacity-0");
  });

  it("cleans up scroll listener on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(() => <ScrollToTop />);

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function),
    );
  });

  function scrollTo(value: number): void {
    Object.defineProperty(window, "scrollY", { value, writable: true });
    window.dispatchEvent(new Event("scroll"));
  }
});
