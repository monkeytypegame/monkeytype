import { AnimationParams } from "animejs";
import { applyReducedMotion, isPopupVisible } from "./misc";
import * as Skeleton from "./skeleton";
import { ElementWithUtils, qs } from "./dom";

type CustomWrapperAndModalAnimations = {
  wrapper?: AnimationParams & {
    duration?: number;
  };
  modal?: AnimationParams & {
    duration?: number;
  };
};

type ConstructorCustomAnimations = {
  show?: CustomWrapperAndModalAnimations;
  hide?: CustomWrapperAndModalAnimations;
};

type Animation<T> = (
  modal: ElementWithUtils,
  modalChainData?: T,
) => Promise<void>;

type ShowHideOptions<T> = {
  animationMode?: "none" | "both" | "modalOnly";
  animationDurationMs?: number;
  customAnimation?: CustomWrapperAndModalAnimations;
  beforeAnimation?: Animation<T>;
  afterAnimation?: Animation<T>;
  modalChainData?: T;
};

export type ShowOptions<T = unknown> = ShowHideOptions<T> & {
  mode?: "modal" | "dialog";
  focusFirstInput?: true | "focusAndSelect";
  modalChain?: AnimatedModal;
};

export type HideOptions<T = unknown> = ShowHideOptions<T> & {
  clearModalChain?: boolean;
  dontShowPreviousModalInchain?: boolean;
};

type ConstructorParams<T> = {
  dialogId: string;
  appendTo?: Skeleton.SkeletonAppendParents;
  customAnimations?: ConstructorCustomAnimations;
  showOptionsWhenInChain?: ShowOptions<T>;
  customEscapeHandler?: (e: KeyboardEvent) => void;
  customWrapperClickHandler?: (e: MouseEvent) => void;
  setup?: (modal: ElementWithUtils) => Promise<void>;
  cleanup?: () => Promise<void>;
};

const DEFAULT_ANIMATION_DURATION = 125;
const MODAL_ONLY_ANIMATION_MULTIPLIER = 0.75;

export default class AnimatedModal<
  IncomingModalChainData = unknown,
  OutgoingModalChainData = unknown,
> {
  private wrapperEl: ElementWithUtils<HTMLDialogElement>;
  private modalEl: ElementWithUtils;
  private dialogId: string;
  private open = false;
  private setupRan = false;
  private previousModalInChain: AnimatedModal | undefined;
  private showOptionsWhenInChain:
    | ShowOptions<IncomingModalChainData>
    | undefined;
  private skeletonAppendParent: Skeleton.SkeletonAppendParents;
  private customShowAnimations: CustomWrapperAndModalAnimations | undefined;
  private customHideAnimations: CustomWrapperAndModalAnimations | undefined;

  private customEscapeHandler: ((e: KeyboardEvent) => void) | undefined;
  private customWrapperClickHandler: ((e: MouseEvent) => void) | undefined;
  private setup: ((modal: ElementWithUtils) => Promise<void>) | undefined;
  private cleanup: (() => Promise<void>) | undefined;

  constructor(constructorParams: ConstructorParams<IncomingModalChainData>) {
    if (constructorParams.dialogId.startsWith("#")) {
      constructorParams.dialogId = constructorParams.dialogId.slice(1);
    }

    this.skeletonAppendParent = constructorParams.appendTo ?? "popups";
    if (Skeleton.has(constructorParams.dialogId)) {
      Skeleton.append(constructorParams.dialogId, this.skeletonAppendParent);
    }

    const dialogElement = qs<HTMLDialogElement>(
      "#" + constructorParams.dialogId,
    );
    const modalElement = qs(`#${constructorParams.dialogId} > .modal`);

    if (dialogElement === null) {
      throw new Error(
        `Dialog element with id ${constructorParams.dialogId} not found`,
      );
    }

    if (!(dialogElement.native instanceof HTMLDialogElement)) {
      throw new Error("Animated dialog must be an HTMLDialogElement");
    }

    if (dialogElement === null) {
      throw new Error(
        `Dialog element with id ${constructorParams.dialogId} not found`,
      );
    }

    if (modalElement === null) {
      throw new Error(
        `Div element inside #${constructorParams.dialogId} with class 'modal' not found`,
      );
    }

    this.dialogId = constructorParams.dialogId;
    this.wrapperEl = dialogElement;
    this.modalEl = modalElement;
    this.customShowAnimations = constructorParams.customAnimations?.show;
    this.customHideAnimations = constructorParams.customAnimations?.hide;
    this.previousModalInChain = undefined;
    this.showOptionsWhenInChain = constructorParams.showOptionsWhenInChain;

    this.customEscapeHandler = constructorParams?.customEscapeHandler;
    this.customWrapperClickHandler =
      constructorParams?.customWrapperClickHandler;
    this.setup = constructorParams?.setup;
    this.cleanup = constructorParams?.cleanup;

    Skeleton.save(this.dialogId);
  }

  getPreviousModalInChain(): AnimatedModal | undefined {
    return this.previousModalInChain;
  }

  async runSetup(): Promise<void> {
    this.wrapperEl.on("keydown", async (e) => {
      if (e.key === "Escape" && isPopupVisible(this.dialogId)) {
        e.preventDefault();
        e.stopPropagation();
        if (this.customEscapeHandler !== undefined) {
          this.customEscapeHandler(e);
          void this.cleanup?.();
        } else {
          await this.hide();
        }
      }
    });

    this.wrapperEl.on("mousedown", async (e) => {
      if (e.target === this.wrapperEl.native) {
        if (this.customWrapperClickHandler !== undefined) {
          this.customWrapperClickHandler(e);
          void this.cleanup?.();
        } else {
          await this.hide();
        }
      }
    });

    if (this.setup !== undefined) {
      await this.setup(this.modalEl);
    }
  }

  getDialogId(): string {
    return this.dialogId;
  }

  getWrapper(): ElementWithUtils<HTMLDialogElement> {
    return this.wrapperEl;
  }

  getModal(): ElementWithUtils {
    return this.modalEl;
  }

  isOpen(): boolean {
    return this.open;
  }

  focusFirstInput(setting: true | "focusAndSelect" | undefined): void {
    const inputs = [
      ...this.modalEl.qsa("input"),
    ] as ElementWithUtils<HTMLInputElement>[];
    const input = inputs.find((input) => !input.hasClass("hidden"));
    if (input !== undefined && input !== null) {
      if (setting === true) {
        input.focus();
      } else if (setting === "focusAndSelect") {
        input.focus();
        input.select();
      } else {
        this.wrapperEl.focus();
      }
    } else {
      this.wrapperEl.focus();
    }
  }

  async show(options?: ShowOptions<IncomingModalChainData>): Promise<void> {
    // oxlint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve) => {
      if (this.open) {
        resolve();
        return;
      }
      Skeleton.append(this.dialogId, this.skeletonAppendParent);

      if (!this.setupRan) {
        await this.runSetup();
        this.setupRan = true;
      }

      if (isPopupVisible(this.dialogId)) {
        resolve();
        return;
      }

      const modalAnimationDuration = applyReducedMotion(
        (options?.customAnimation?.modal?.duration ??
          options?.animationDurationMs ??
          this.customShowAnimations?.modal?.duration ??
          DEFAULT_ANIMATION_DURATION) *
          (options?.modalChain !== undefined
            ? MODAL_ONLY_ANIMATION_MULTIPLIER
            : 1),
      );

      if (options?.modalChain !== undefined) {
        this.previousModalInChain = options.modalChain;
        await this.previousModalInChain.hide({
          animationMode: "modalOnly",
          animationDurationMs: modalAnimationDuration,
          dontShowPreviousModalInchain:
            options.modalChain.previousModalInChain !== undefined,
        });
      }

      this.open = true;
      if (options?.mode === "dialog") {
        this.wrapperEl.show();
      } else if (options?.mode === "modal" || options?.mode === undefined) {
        this.wrapperEl.native.showModal();
      }

      await options?.beforeAnimation?.(this.modalEl, options?.modalChainData);

      //wait until the next event loop to allow the dialog to start animating
      setTimeout(async () => {
        this.focusFirstInput(options?.focusFirstInput);
      }, 1);

      const hasModalAnimation =
        (options?.customAnimation?.modal ??
          this.customHideAnimations?.modal) !== undefined;

      const modalAnimation = options?.customAnimation?.modal ??
        this.customShowAnimations?.modal ?? {
          opacity: [0, 1],
          marginTop: ["1rem", 0],
        };
      const wrapperAnimation = options?.customAnimation?.wrapper ??
        this.customShowAnimations?.wrapper ?? {
          opacity: [0, 1],
        };
      const wrapperAnimationDuration = applyReducedMotion(
        options?.customAnimation?.wrapper?.duration ??
          this.customShowAnimations?.wrapper?.duration ??
          DEFAULT_ANIMATION_DURATION,
      );

      const animationMode =
        this.previousModalInChain !== undefined
          ? "modalOnly"
          : (options?.animationMode ?? "both");

      if (animationMode === "both" || animationMode === "none") {
        if (hasModalAnimation) {
          this.modalEl.animate({
            ...modalAnimation,
            duration: animationMode === "none" ? 0 : modalAnimationDuration,
          });
        } else {
          this.modalEl.setStyle({ opacity: "1" });
        }

        this.wrapperEl.animate({
          ...wrapperAnimation,
          duration: animationMode === "none" ? 0 : wrapperAnimationDuration,
          onBegin: () => {
            this.wrapperEl.show();
          },
          onComplete: async () => {
            this.focusFirstInput(options?.focusFirstInput);
            await options?.afterAnimation?.(
              this.modalEl,
              options?.modalChainData,
            );
            resolve();
          },
        });
      } else if (animationMode === "modalOnly") {
        this.wrapperEl.show().setStyle({ opacity: "1" });

        this.modalEl.animate({
          ...modalAnimation,
          duration: modalAnimationDuration,
          onComplete: async () => {
            this.focusFirstInput(options?.focusFirstInput);
            await options?.afterAnimation?.(
              this.modalEl,
              options?.modalChainData,
            );
            resolve();
          },
        });
      }
    });
  }

  async hide(options?: HideOptions<OutgoingModalChainData>): Promise<void> {
    // oxlint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve) => {
      if (!isPopupVisible(this.dialogId)) {
        resolve();
        return;
      }

      if (options?.clearModalChain) {
        this.previousModalInChain = undefined;
      }

      await options?.beforeAnimation?.(this.modalEl);

      const hasModalAnimation =
        (options?.customAnimation?.modal ??
          this.customHideAnimations?.modal) !== undefined;

      const modalAnimation = options?.customAnimation?.modal ??
        this.customHideAnimations?.modal ?? {
          opacity: [1, 0],
          marginTop: [0, "1rem"],
        };
      const modalAnimationDuration = applyReducedMotion(
        (options?.customAnimation?.modal?.duration ??
          options?.animationDurationMs ??
          this.customHideAnimations?.modal?.duration ??
          DEFAULT_ANIMATION_DURATION) *
          (this.previousModalInChain !== undefined
            ? MODAL_ONLY_ANIMATION_MULTIPLIER
            : 1),
      );
      const wrapperAnimation = options?.customAnimation?.wrapper ??
        this.customHideAnimations?.wrapper ?? {
          opacity: [1, 0],
        };
      const wrapperAnimationDuration = applyReducedMotion(
        options?.customAnimation?.wrapper?.duration ??
          this.customHideAnimations?.wrapper?.duration ??
          DEFAULT_ANIMATION_DURATION,
      );
      const animationMode =
        this.previousModalInChain !== undefined
          ? "modalOnly"
          : (options?.animationMode ?? "both");

      if (animationMode === "both" || animationMode === "none") {
        if (hasModalAnimation) {
          this.modalEl.animate({
            ...modalAnimation,
            duration: animationMode === "none" ? 0 : modalAnimationDuration,
          });
        } else {
          this.modalEl.setStyle({ opacity: "1" });
        }

        this.wrapperEl.animate({
          ...wrapperAnimation,
          duration: animationMode === "none" ? 0 : wrapperAnimationDuration,
          onComplete: async () => {
            this.wrapperEl.native.close();
            this.wrapperEl.hide();
            Skeleton.remove(this.dialogId);
            this.open = false;
            await options?.afterAnimation?.(this.modalEl);
            void this.cleanup?.();

            if (
              this.previousModalInChain !== undefined &&
              !options?.dontShowPreviousModalInchain
            ) {
              await this.previousModalInChain.show({
                animationMode: "modalOnly",
                modalChainData: options?.modalChainData,
                animationDurationMs:
                  modalAnimationDuration * MODAL_ONLY_ANIMATION_MULTIPLIER,
                ...this.previousModalInChain.showOptionsWhenInChain,
              });
              this.previousModalInChain = undefined;
            }

            resolve();
          },
        });
      } else if (animationMode === "modalOnly") {
        this.wrapperEl.show().setStyle({ opacity: "1" });

        this.modalEl.animate({
          ...modalAnimation,
          duration: modalAnimationDuration,
          onComplete: async () => {
            this.wrapperEl.native.close();
            this.wrapperEl.hide().setStyle({ opacity: "0" });
            Skeleton.remove(this.dialogId);
            this.open = false;
            await options?.afterAnimation?.(this.modalEl);
            void this.cleanup?.();

            if (
              this.previousModalInChain !== undefined &&
              !options?.dontShowPreviousModalInchain
            ) {
              await this.previousModalInChain.show({
                animationMode: "modalOnly",
                modalChainData: options?.modalChainData,
                animationDurationMs:
                  modalAnimationDuration * MODAL_ONLY_ANIMATION_MULTIPLIER,
                ...this.previousModalInChain.showOptionsWhenInChain,
              });
              this.previousModalInChain = undefined;
            }

            resolve();
          },
        });
      }
    });
  }

  destroy(): void {
    this.wrapperEl.native.close();
    this.wrapperEl.hide();
    void this.cleanup?.();
    Skeleton.remove(this.dialogId);
    this.open = false;
  }
}
