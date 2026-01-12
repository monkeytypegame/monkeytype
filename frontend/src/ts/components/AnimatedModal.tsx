import { JSXElement, createEffect, onCleanup, ParentProps } from "solid-js";
import { applyReducedMotion } from "../utils/misc";
import { useRefWithUtils } from "../hooks/useRefWithUtils";
import {
  hideModal as stateHideModal,
  ModalId,
  isModalOpen,
} from "../stores/modals";

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
  id: ModalId;
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

  class?: string;
}>;

const DEFAULT_ANIMATION_DURATION = 125;
const MODAL_ONLY_ANIMATION_MULTIPLIER = 0.75;

export function AnimatedModal(props: AnimatedModalProps): JSXElement {
  // Refs are assigned by SolidJS via the ref attribute
  const [dialogRef, dialogEl] = useRefWithUtils<HTMLDialogElement>();
  const [modalRef, modalEl] = useRefWithUtils<HTMLDivElement>();

  const visibility = (): boolean => isModalOpen(props.id);

  // Handle open/close with animations
  createEffect(() => {
    if (visibility()) {
      void showModal(false);
    } else {
      void hideModal(false);
    }
  });

  async function showModal(isChained: boolean): Promise<void> {
    if (dialogEl() === undefined || modalEl() === undefined) return;

    await props.beforeShow?.();

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

  async function hideModal(isChained: boolean): Promise<void> {
    // Guard: only hide if visible and not already animating
    if (dialogEl() === undefined || modalEl() === undefined) return;

    await props.beforeHide?.();

    const modalAnimDuration = applyReducedMotion(
      (props.customAnimations?.hide?.modal?.duration ??
        DEFAULT_ANIMATION_DURATION) *
        (isChained ? MODAL_ONLY_ANIMATION_MULTIPLIER : 1),
    );

    const animMode = isChained ? "modalOnly" : (props.animationMode ?? "both");

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
    stateHideModal(props.id);
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
    if (e.key === "Escape" && visibility()) {
      e.preventDefault();
      e.stopPropagation();
      if (props.onEscape) {
        props.onEscape(e);
      } else {
        void hideModal(false);
      }
    }
  };

  const handleBackdropClick = (e: MouseEvent): void => {
    if (e.target === dialogEl()?.native) {
      if (props.onBackdropClick) {
        props.onBackdropClick(e);
      } else {
        void hideModal(false);
      }
    }
  };

  onCleanup(() => {
    if (dialogEl()?.native.open) {
      dialogEl()?.native.close();
    }
  });

  return (
    <dialog
      id={`${props.id as string}Modal`}
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
