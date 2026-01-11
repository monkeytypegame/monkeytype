import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@solidjs/testing-library";
import { AnimatedModal } from "../../src/ts/components/AnimatedModal";

describe("AnimatedModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock dialog methods that don't exist in jsdom
    HTMLDialogElement.prototype.showModal = vi.fn();
    HTMLDialogElement.prototype.show = vi.fn();
    HTMLDialogElement.prototype.close = vi.fn();
  });

  function renderModal(props: {
    isOpen: boolean;
    onClose: () => void;
    onEscape?: (e: KeyboardEvent) => void;
    onBackdropClick?: (e: MouseEvent) => void;
    class?: string;
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
      <AnimatedModal id="TestModal" {...props}>
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
    const { dialog } = renderModal({ isOpen: false, onClose: vi.fn() });

    expect(dialog).toHaveAttribute("id", "TestModal");
    expect(dialog).toHaveClass("modalWrapper", "hidden");
  });

  it("renders children inside modal div", () => {
    const { modalDiv } = renderModal({ isOpen: false, onClose: vi.fn() });

    expect(
      modalDiv.querySelector("[data-testid='modal-content']"),
    ).toHaveTextContent("Test Content");
  });

  it("has escape handler attached", () => {
    const onClose = vi.fn();

    const { dialog } = renderModal({ isOpen: true, onClose });

    expect(dialog.onkeydown).toBeDefined();
  });

  it("has backdrop click handler attached", () => {
    const onClose = vi.fn();

    const { dialog } = renderModal({ isOpen: true, onClose });

    expect(dialog.onmousedown).toBeDefined();
  });

  it("applies custom class to dialog", () => {
    const { dialog } = renderModal({
      isOpen: false,
      onClose: vi.fn(),
      class: "customClass",
    });

    expect(dialog).toHaveClass("modalWrapper", "hidden", "customClass");
  });

  it("renders with animationMode none", () => {
    const { dialog } = renderModal({
      isOpen: false,
      onClose: vi.fn(),
      animationMode: "none",
    });

    expect(dialog).toHaveAttribute("id", "TestModal");
  });
});
