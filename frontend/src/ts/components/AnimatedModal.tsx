import { JSXElement, createEffect, onCleanup, ParentProps } from "solid-js";
import { applyReducedMotion } from "../utils/misc";
import { useModalChain } from "./ModalChainContext";
import { useRefWithUtils } from "../hooks/useRefWithUtils";

type AnimationParams = {
  opacity?: number | [number, number];
  marginTop?: string | [string, string];
  duration?: number;
};

type AnimationConfig = {
  wrapper?: AnimationParams;
  modal?: AnimationParams;
};

type AnimatedModalProps = ParentProps<{
  id: string;
  isOpen: boolean;
  onClose: () => void;
  mode?: "modal" | "dialog";
  animationMode?: "none" | "both" | "modalOnly";
  customAnimations?: {
    show?: AnimationConfig;
    hide?: AnimationConfig;
  };
  focusFirstInput?: true | "focusAndSelect";
  beforeShow?: () => void | Promise<void>;
  afterShow?: () => void | Promise<void>;
  beforeHide?: () => void | Promise<void>;
  afterHide?: () => void | Promise<void>;
  onEscape?: (e: KeyboardEvent) => void;
  onBackdropClick?: (e: MouseEvent) => void;

  // Chain-related props
  useChain?: boolean;
  modalChain?: string;
  clearChainOnClose?: boolean;
  showOptionsWhenReturning?: Record<string, unknown>;

  class?: string;
}>;

const DEFAULT_ANIMATION_DURATION = 125;
const MODAL_ONLY_ANIMATION_MULTIPLIER = 0.75;

export function AnimatedModal(props: AnimatedModalProps): JSXElement {
  // Refs are assigned by SolidJS via the ref attribute
  const [dialogRef, dialogEl] = useRefWithUtils<HTMLDialogElement>();
  const [modalRef, modalEl] = useRefWithUtils<HTMLDivElement>();
  // oxlint-disable-next-line solid/reactivity
  const modalChain = props.useChain ? useModalChain() : undefined;

  // Register this modal in the chain
  createEffect(() => {
    if (props.useChain && modalChain && props.isOpen) {
      modalChain.pushModal({
        id: props.id,
        show: showModal,
        hide: hideModal,
        showOptions: props.showOptionsWhenReturning,
      });
    }
  });

  // Handle open/close with animations
  createEffect(() => {
    if (props.isOpen) {
      void showModal();
    } else {
      void hideModal();
    }
  });

  async function showModal(): Promise<void> {
    if (dialogEl() === undefined || modalEl() === undefined) return;

    await props.beforeShow?.();

    // If chaining from another modal, hide it first
    const previousModal = modalChain?.getPreviousModal();
    const isChained =
      props.modalChain !== undefined ||
      (previousModal && previousModal.id !== props.id);

    if (isChained && previousModal) {
      await previousModal.hide();
    }

    // Open the dialog
    dialogEl()?.removeClass("hidden");
    if (props.mode === "dialog") {
      dialogEl()?.native.show();
    } else {
      dialogEl()?.native.showModal();
    }

    const modalAnimDuration = applyReducedMotion(
      (props.customAnimations?.show?.modal?.duration ??
        DEFAULT_ANIMATION_DURATION) *
        (isChained ? MODAL_ONLY_ANIMATION_MULTIPLIER : 1),
    );

    const animMode = isChained ? "modalOnly" : (props.animationMode ?? "both");

    // Animate in
    if (animMode === "both" || animMode === "none") {
      const wrapperDuration = applyReducedMotion(
        props.customAnimations?.show?.wrapper?.duration ??
          DEFAULT_ANIMATION_DURATION,
      );

      // Wrapper animation
      if (animMode !== "none") {
        dialogEl()?.animate({
          opacity: [0, 1],
          duration: wrapperDuration,
          ease: "easeOut",
        });
      }

      // Modal animation
      if (animMode !== "none") {
        modalEl()?.setStyle({
          opacity: "0",
          marginTop: "1rem",
        });

        modalEl()?.animate({
          opacity: [0, 1],
          marginTop: ["1rem", "0"],
          duration: modalAnimDuration,
          easing: "ease-out",
          fill: "forwards",
          onComplete: () => {
            focusFirstInput();
            void handleAfterShow();
          },
        });
      } else {
        modalEl()?.setStyle({
          opacity: "1",
          marginTop: "0",
        });
        focusFirstInput();
        void handleAfterShow();
      }
    } else if (animMode === "modalOnly") {
      dialogEl()?.setStyle({
        opacity: "1",
      });

      modalEl()
        ?.setStyle({
          opacity: "0",
          marginTop: "1rem",
        })
        .animate({
          opacity: [0, 1],
          marginTop: ["1rem", "0"],
          duration: modalAnimDuration,
          onComplete: () => {
            focusFirstInput();
            void handleAfterShow();
          },
        });
    }
  }

  async function hideModal(): Promise<void> {
    // Guard: only hide if visible and not already animating
    if (dialogEl() === undefined || modalEl() === undefined) return;

    await props.beforeHide?.();

    const hasChain = modalChain && modalChain.getChainLength() > 0;

    const modalAnimDuration = applyReducedMotion(
      (props.customAnimations?.hide?.modal?.duration ??
        DEFAULT_ANIMATION_DURATION) *
        (hasChain ? MODAL_ONLY_ANIMATION_MULTIPLIER : 1),
    );

    const animMode = hasChain ? "modalOnly" : (props.animationMode ?? "both");

    if (animMode === "both" || animMode === "none") {
      const wrapperDuration = applyReducedMotion(
        props.customAnimations?.hide?.wrapper?.duration ??
          DEFAULT_ANIMATION_DURATION,
      );

      // Modal animation
      if (animMode !== "none") {
        modalEl()?.animate({
          opacity: [1, 0],
          marginTop: ["0", "1rem"],
          duration: modalAnimDuration,
        });

        dialogEl()?.animate({
          opacity: [1, 0],
          duration: wrapperDuration,
          onComplete: async () => {
            dialogEl()?.native.close();
            dialogEl()?.addClass("hidden");
            await handleAfterHide();
          },
        });
      } else {
        dialogEl()?.native.close();
        dialogEl()?.addClass("hidden");
        await handleAfterHide();
      }
    } else if (animMode === "modalOnly") {
      modalEl()?.animate({
        opacity: [1, 0],
        marginTop: ["0", "1rem"],
        duration: modalAnimDuration,
        onComplete: async () => {
          dialogEl()?.native.close();
          dialogEl()?.addClass("hidden");
          await handleAfterHide();
        },
      });
    }
  }

  async function handleAfterHide(): Promise<void> {
    await props.afterHide?.();

    // Clear chain if requested
    if (props.clearChainOnClose && modalChain) {
      modalChain.clearChain();
    }

    // Show previous modal in chain
    const shouldShowPrevious = modalChain && modalChain.getChainLength() > 0;
    if (shouldShowPrevious) {
      const previous = modalChain.popModal();
      if (previous && previous.id !== props.id) {
        await previous.show();
        return; // Don't call onClose when chaining
      }
    }

    props.onClose();
  }

  async function handleAfterShow(): Promise<void> {
    await props.afterShow?.();
  }

  function focusFirstInput(): void {
    if (modalEl() === undefined || dialogEl() === undefined) return;
    if (props.focusFirstInput === undefined) return;

    const input = modalEl()?.qs<HTMLInputElement>("input:not(.hidden)");
    if (input) {
      if (props.focusFirstInput === true) {
        input.focus();
      } else if (props.focusFirstInput === "focusAndSelect") {
        input.focus();
        input.select();
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === "Escape" && props.isOpen) {
      e.preventDefault();
      e.stopPropagation();
      if (props.onEscape) {
        props.onEscape(e);
      } else {
        void hideModal();
      }
    }
  };

  const handleBackdropClick = (e: MouseEvent): void => {
    if (e.target === dialogEl()?.native) {
      if (props.onBackdropClick) {
        props.onBackdropClick(e);
      } else {
        void hideModal();
      }
    }
  };

  onCleanup(() => {
    if (dialogEl()?.native.open) {
      dialogEl()?.native.close();
    }
    // Remove from chain to prevent stale references
    if (modalChain) {
      modalChain.popModal();
    }
  });

  return (
    <dialog
      id={props.id}
      ref={dialogRef}
      class={`modalWrapper hidden ${props.class ?? ""}`}
      onKeyDown={handleKeyDown}
      onMouseDown={handleBackdropClick}
    >
      <div class="modal" ref={modalRef}>
        {props.children}
      </div>
    </dialog>
  );
}
