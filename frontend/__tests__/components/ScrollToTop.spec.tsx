import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@solidjs/testing-library";
import { userEvent } from "@testing-library/user-event";
import {
  ScrollToTop,
  __testing,
  hideScrollToTop,
} from "../../src/ts/components/ScrollToTop";
import * as ActivePage from "../../src/ts/states/active-page";

describe("ScrollToTop", () => {
  const getActivePageMock = vi.spyOn(ActivePage, "get");
  beforeEach(() => {
    getActivePageMock.mockClear().mockReturnValue("account");
    Object.defineProperty(window, "scrollY", { value: 0, writable: true });
    __testing.resetState();
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
      button: container.querySelector("div.button")!,
    };
  }

  it("renders with correct classes and structure", () => {
    const { container, button } = renderElement();

    expect(container).toHaveClass("content-grid", "ScrollToTop");
    expect(button).toHaveClass("breakout", "button");
    expect(button).toContainHTML(`<i class="fas fa-angle-double-up"></i>`);
  });

  it("renders invisible when scrollY is 0", () => {
    const { container } = render(() => <ScrollToTop />);
    const button = container.querySelector(".button");

    expect(button).toHaveClass("invisible");
  });

  it("becomes visible when scrollY > 100", () => {
    const { container } = render(() => <ScrollToTop />);
    const button = container.querySelector(".button");

    scrollTo(150);

    expect(button).not.toHaveClass("invisible");
  });

  it("stays invisible on test page regardless of scroll", () => {
    getActivePageMock.mockReturnValue("test");
    const { container } = render(() => <ScrollToTop />);
    const button = container.querySelector(".button");

    scrollTo(150);

    expect(button).toHaveClass("invisible");
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
    expect(button).toHaveClass("invisible");
  });

  it("hides button when hideScrollToTop is called", () => {
    const { button } = renderElement();
    scrollTo(150);

    hideScrollToTop();

    expect(button).toHaveClass("invisible");
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
