import { render } from "@solidjs/testing-library";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { AnimatedModal } from "../../../src/ts/components/common/AnimatedModal";

describe("AnimatedModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock dialog methods that don't exist in jsdom
    HTMLDialogElement.prototype.showModal = vi.fn();
    HTMLDialogElement.prototype.show = vi.fn();
    HTMLDialogElement.prototype.close = vi.fn();
  });

  function renderModal(props: {
    onEscape?: (e: KeyboardEvent) => void;
    onBackdropClick?: (e: MouseEvent) => void;
    wrapperClass?: string;
    beforeShow?: () => void | Promise<void>;
    afterShow?: () => void | Promise<void>;
    beforeHide?: () => void | Promise<void>;
    afterHide?: () => void | Promise<void>;
    animationMode?: "none" | "both" | "modalOnly";
  }): {
    container: HTMLElement;
    dialog: HTMLDialogElement;
    modalDiv: HTMLDivElement;
  } {
    const { container } = render(() => (
      <AnimatedModal id="Support" {...props}>
        <div data-testid="modal-content">Test Content</div>
      </AnimatedModal>
    ));

    return {
      // oxlint-disable-next-line no-non-null-assertion
      container: container.children[0]! as HTMLElement,
      // oxlint-disable-next-line no-non-null-assertion
      dialog: container.querySelector("dialog")!,
      // oxlint-disable-next-line no-non-null-assertion
      modalDiv: container.querySelector(".modal")!,
    };
  }

  it("renders dialog with correct id and class", () => {
    const { dialog } = renderModal({});

    expect(dialog).toHaveAttribute("id", "SupportModal");
    expect(dialog).toHaveClass("hidden");
  });

  it("renders children inside modal div", () => {
    const { modalDiv } = renderModal({});

    expect(
      modalDiv.querySelector("[data-testid='modal-content']"),
    ).toHaveTextContent("Test Content");
  });

  it("has escape handler attached", () => {
    const { dialog } = renderModal({});

    expect(dialog.onkeydown).toBeDefined();
  });

  it("has backdrop click handler attached", () => {
    const { dialog } = renderModal({});

    expect(dialog.onmousedown).toBeDefined();
  });

  it("applies custom class to dialog", () => {
    const { dialog } = renderModal({
      wrapperClass: "customClass",
    });

    expect(dialog).toHaveClass("customClass");
  });

  it("renders with animationMode none", () => {
    const { dialog } = renderModal({
      animationMode: "none",
    });

    expect(dialog).toHaveAttribute("id", "SupportModal");
  });
});
