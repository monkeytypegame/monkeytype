import {
  JSXElement,
  createEffect,
  onCleanup,
  ParentProps,
  Show,
} from "solid-js";

import { useRefWithUtils } from "../../hooks/useRefWithUtils";
import {
  hideModal as storeHideModal,
  ModalId,
  isModalOpen,
  isModalChained,
} from "../../states/modals";
import { cn } from "../../utils/cn";
import { applyReducedMotion } from "../../utils/misc";

type AnimationParams = {
  opacity?: number | [number, number];
  marginTop?: string | [string, string];
  marginRight?: string | [string, string];
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
  beforeShow?: (isChained: boolean) => void | Promise<void>;
  afterShow?: () => void | Promise<void>;
  beforeHide?: () => void | Promise<void>;
  afterHide?: () => void | Promise<void>;
  onEscape?: (e: KeyboardEvent) => void;
  onBackdropClick?: (e: MouseEvent) => void;
  onScroll?: (e: Event) => void;

  title?: string;
  modalClass?: string;
  wrapperClass?: string;
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
    const isChained = isModalChained(props.id);

    if (visibility()) {
      void showModal(isChained);
    } else {
      void hideModal(isChained);
    }
  });

  const showModal = async (isChained: boolean): Promise<void> => {
    if (dialogEl() === undefined || modalEl() === undefined) return;
    if (dialogEl()?.native.open) return;

    await props.beforeShow?.(isChained);

    // Open the dialog
    dialogEl()?.show();
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
        const customModal = props.customAnimations?.show?.modal;
        const initialStyle: Record<string, string> = {
          opacity: "0",
          marginTop: "1rem",
        };
        const animParams: Record<string, unknown> = {
          opacity: [0, 1],
          marginTop: ["1rem", "0"],
        };
        if (customModal) {
          if (customModal.opacity !== undefined) {
            const v = customModal.opacity;
            initialStyle["opacity"] = String(Array.isArray(v) ? v[0] : v);
            animParams["opacity"] = v;
          }
          if (customModal.marginTop !== undefined) {
            const v = customModal.marginTop;
            initialStyle["marginTop"] = Array.isArray(v) ? v[0] : v;
            animParams["marginTop"] = v;
          }
          if (customModal.marginRight !== undefined) {
            const v = customModal.marginRight;
            initialStyle["marginRight"] = Array.isArray(v) ? v[0] : v;
            animParams["marginRight"] = v;
            delete initialStyle["marginTop"];
            delete animParams["marginTop"];
          }
        }
        modalEl()?.setStyle(initialStyle);

        modalEl()?.animate({
          ...animParams,
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
  };

  const hideModal = async (isChained: boolean): Promise<void> => {
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
        const customModal = props.customAnimations?.hide?.modal;
        const hideAnimParams: Record<string, unknown> = {
          opacity: [1, 0],
          marginTop: ["0", "1rem"],
        };
        if (customModal) {
          if (customModal.opacity !== undefined) {
            hideAnimParams["opacity"] = customModal.opacity;
          }
          if (customModal.marginTop !== undefined) {
            hideAnimParams["marginTop"] = customModal.marginTop;
          }
          if (customModal.marginRight !== undefined) {
            hideAnimParams["marginRight"] = customModal.marginRight;
            delete hideAnimParams["marginTop"];
          }
        }
        modalEl()?.animate({
          ...hideAnimParams,
          duration: modalAnimDuration,
        });

        dialogEl()?.animate({
          opacity: [1, 0],
          duration: wrapperDuration,
          onComplete: async () => {
            dialogEl()?.native.close();
            dialogEl()?.hide();
            await handleAfterHide();
          },
        });
      } else {
        dialogEl()?.native.close();
        dialogEl()?.hide();
        await handleAfterHide();
      }
    } else if (animMode === "modalOnly") {
      modalEl()?.animate({
        opacity: [1, 0],
        marginTop: ["0", "1rem"],
        duration: modalAnimDuration,
        onComplete: async () => {
          dialogEl()?.native.close();
          dialogEl()?.hide();
          await handleAfterHide();
        },
      });
    }
  };

  const handleAfterHide = async (): Promise<void> => {
    await props.afterHide?.();
    storeHideModal(props.id);
  };

  const handleAfterShow = async (): Promise<void> => {
    await props.afterShow?.();
  };

  const focusFirstInput = (): void => {
    if (modalEl() === undefined || dialogEl() === undefined) return;
    if (props.focusFirstInput === undefined) return;

    const input = modalEl()?.qsa<HTMLInputElement>("input:not(.hidden)")[0];
    if (input) {
      if (props.focusFirstInput === true) {
        input.focus();
      } else if (props.focusFirstInput === "focusAndSelect") {
        input.focus();
        input.select();
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === "Escape" && visibility()) {
      e.preventDefault();
      e.stopPropagation();
      if (props.onEscape) {
        props.onEscape(e);
      } else {
        storeHideModal(props.id);
      }
    }
  };

  const handleBackdropClick = (e: MouseEvent): void => {
    if (e.target === dialogEl()?.native) {
      if (props.onBackdropClick) {
        props.onBackdropClick(e);
      } else {
        storeHideModal(props.id);
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
      class={cn(
        "fixed top-0 left-0 z-1000 m-0 hidden h-screen max-h-screen w-screen max-w-screen border-none bg-[rgba(0,0,0,0.5)] p-8 backdrop:bg-transparent",
        props.wrapperClass,
      )}
      onKeyDown={handleKeyDown}
      onMouseDown={handleBackdropClick}
    >
      <div class="pointer-events-none flex h-full w-full items-center justify-center">
        <div
          class={cn(
            "modal pointer-events-auto grid h-max max-h-full w-full max-w-md gap-4 overflow-auto rounded-double bg-bg p-4 text-text ring-4 ring-sub-alt sm:p-8",
            props.modalClass,
          )}
          ref={modalRef}
          onScroll={(e) => props.onScroll?.(e)}
        >
          <Show when={props.title !== undefined && props.title !== ""}>
            <div class="text-2xl text-sub">{props.title}</div>
          </Show>
          {props.children}
        </div>
      </div>
    </dialog>
  );
}
