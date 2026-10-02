import { JSAnimation } from "animejs";
import {
  JSXElement,
  ParentProps,
  Show,
  createSignal,
  onCleanup,
} from "solid-js";

import { createEffectOn } from "../../hooks/effects";
import { useRefWithUtils } from "../../hooks/useRefWithUtils";
import {
  ModalId,
  isModalChained,
  isModalOpen,
  hideModal as storeHideModal,
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

  closeOnWrapperClick?: boolean;
  closeOnEscape?: boolean;

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

  // Stays true for the duration of the hide animation, so the modal is still
  // mounted while it animates out. Cleared once the animation has finished.
  const [contentMounted, setContentMounted] = createSignal(false);

  // Animations started by the current show, kept so that a hide arriving
  // mid-animation can cancel them instead of queueing behind them.
  let showAnimations: JSAnimation[] = [];

  // Drives `display` on the dialog. This has to be a signal rather than a class
  // toggle: the class is built with `cn`, and twMerge would drop a `hidden`
  // from it in favour of the `flex` the base class needs.
  const [isDisplayed, setIsDisplayed] = createSignal(false);
  const renderContent = (): boolean => visibility() || contentMounted();

  // Handle open/close with animations
  createEffectOn(
    visibility,
    (visible) => {
      const isChained = isModalChained(props.id);

      if (visible) {
        setContentMounted(true);
        void showModal(isChained);
      } else if (contentMounted()) {
        void hideModal(isChained);
      }
    },
    {},
  );

  const showModal = async (isChained: boolean): Promise<void> => {
    if (dialogEl() === undefined || modalEl() === undefined) return;
    if (dialogEl()?.native.open) return;

    await props.beforeShow?.(isChained);

    // After await, the element may have been removed from the DOM
    if (!dialogEl()?.native.isConnected) return;

    // `beforeShow` can take a while - the modal may have been hidden again
    if (!visibility()) return;

    showAnimations = [];

    // Open the dialog
    setIsDisplayed(true);
    // clear the opacity left behind by the previous hide animation
    dialogEl()?.setStyle({ opacity: "" });
    if (props.mode === "dialog") {
      dialogEl()?.native.show();
    } else {
      dialogEl()?.native?.showModal();
    }

    // focus right away rather than on animation complete, otherwise anything
    // typed during the show animation is lost
    focusFirstInput();

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
        const wrapperAnimation = dialogEl()?.animate({
          opacity: [0, 1],
          duration: wrapperDuration,
          ease: "easeOut",
        });
        if (wrapperAnimation !== undefined) {
          showAnimations.push(wrapperAnimation);
        }
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

        const modalAnimation = modalEl()?.animate({
          ...animParams,
          duration: modalAnimDuration,
          easing: "ease-out",
          fill: "forwards",
          onComplete: () => {
            void handleAfterShow();
          },
        });
        if (modalAnimation !== undefined) {
          showAnimations.push(modalAnimation);
        }
      } else {
        modalEl()?.setStyle({
          opacity: "1",
          marginTop: "0",
        });
        void handleAfterShow();
      }
    } else if (animMode === "modalOnly") {
      dialogEl()?.setStyle({
        opacity: "1",
      });

      const modalAnimation = modalEl()
        ?.setStyle({
          opacity: "0",
          marginTop: "1rem",
        })
        .animate({
          opacity: [0, 1],
          marginTop: ["1rem", "0"],
          duration: modalAnimDuration,
          onComplete: () => {
            void handleAfterShow();
          },
        });
      if (modalAnimation !== undefined) {
        showAnimations.push(modalAnimation);
      }
    }
  };

  const hideModal = async (isChained: boolean): Promise<void> => {
    if (dialogEl() === undefined || modalEl() === undefined) return;

    // interrupt the show animation, so hiding never waits for it to finish
    for (const animation of showAnimations) {
      animation.cancel();
    }
    showAnimations = [];

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
            setIsDisplayed(false);
            await handleAfterHide();
          },
        });
      } else {
        dialogEl()?.native.close();
        setIsDisplayed(false);
        await handleAfterHide();
      }
    } else if (animMode === "modalOnly") {
      modalEl()?.animate({
        opacity: [1, 0],
        marginTop: ["0", "1rem"],
        duration: modalAnimDuration,
        onComplete: async () => {
          dialogEl()?.native.close();
          setIsDisplayed(false);
          await handleAfterHide();
        },
      });
    }
  };

  const handleAfterHide = async (): Promise<void> => {
    await props.afterHide?.();
    setContentMounted(false);
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
    if (e.key !== "Escape" || !visibility()) return;

    // always swallow escape: letting the native dialog handle it would close
    // the element without the store knowing, leaving the two out of sync
    e.preventDefault();
    e.stopPropagation();

    if (props.onEscape !== undefined) {
      props.onEscape(e);
      return;
    }

    if (props.closeOnEscape === false) return;

    storeHideModal(props.id);
  };

  const handleBackdropClick = (e: MouseEvent): void => {
    if (props.closeOnWrapperClick === false) return;
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
        "fixed top-0 left-0 z-1000 m-0 max-h-screen max-w-screen border-none bg-[rgba(0,0,0,0.5)] p-8 backdrop:bg-transparent",
        "flex h-full w-full items-center justify-center",
        props.wrapperClass,
      )}
      style={{
        display: isDisplayed() ? undefined : "none",
      }}
      onKeyDown={handleKeyDown}
      onCancel={(e) => e.preventDefault()}
      onMouseDown={handleBackdropClick}
    >
      {/*
      Don't show the modal content on non-visible modals.
      If the modal contains data from e.g. a collection the collection would init on page load instead of when it is needed.
      */}
      <Show when={renderContent()}>
        <div
          class={cn(
            "modal pointer-events-auto grid h-max max-h-full w-full max-w-md gap-4 overflow-auto overscroll-y-none rounded-double bg-bg p-4 text-text ring-4 ring-sub-alt sm:p-8",
            "focus:outline-none",
            props.modalClass,
          )}
          ref={modalRef}
          tabIndex={-1}
          onScroll={(e) => props.onScroll?.(e)}
        >
          <Show when={props.title !== undefined && props.title !== ""}>
            <div class="text-2xl text-sub">{props.title}</div>
          </Show>
          {props.children}
        </div>
      </Show>
    </dialog>
  );
}
