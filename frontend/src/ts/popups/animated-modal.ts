import { isPopupVisible } from "../utils/misc";
import * as Skeleton from "../utils/skeleton";

type CustomAnimation = {
  from: Record<string, string>;
  to: Record<string, string>;
  easing?: string;
  durationMs?: number;
};

type CustomWrapperAndModalAnimations = {
  wrapper?: CustomAnimation;
  modal?: CustomAnimation;
};

type ConstructorCustomAnimations = {
  show?: CustomWrapperAndModalAnimations;
  hide?: CustomWrapperAndModalAnimations;
};

type ShowHideOptions = {
  animationMode?: "none" | "both" | "modalOnly";
  customAnimation?: CustomWrapperAndModalAnimations;
  beforeAnimation?: (modal: HTMLElement) => Promise<void>;
  afterAnimation?: (modal: HTMLElement) => Promise<void>;
};

const DEFAULT_ANIMATION_DURATION = 125;

export default class AnimatedModal {
  private wrapperEl: HTMLDialogElement;
  private modalEl: HTMLElement;
  private wrapperId: string;
  private open = false;
  private setupRan = false;
  private skeletonAppendParent: Skeleton.SkeletonAppendParents;
  private customShowAnimations: CustomWrapperAndModalAnimations | undefined;
  private customHideAnimations: CustomWrapperAndModalAnimations | undefined;

  private customEscapeHandler: ((e: KeyboardEvent) => void) | undefined;
  private customWrapperClickHandler: ((e: MouseEvent) => void) | undefined;
  private setup: ((modal: HTMLElement) => void) | undefined;

  constructor(
    wrapperId: string,
    appendTo: Skeleton.SkeletonAppendParents,
    customAnimations?: ConstructorCustomAnimations,
    functions?: {
      customEscapeHandler?: (e: KeyboardEvent) => void;
      customWrapperClickHandler?: (e: MouseEvent) => void;
      setup?: (modal: HTMLElement) => void;
    }
  ) {
    if (wrapperId.startsWith("#")) {
      wrapperId = wrapperId.slice(1);
    }

    this.skeletonAppendParent = appendTo;
    const dialogElement = document.getElementById(wrapperId);
    const modalElement = document.querySelector(
      `#${wrapperId} > .modal`
    ) as HTMLElement;

    if (dialogElement === null) {
      throw new Error(`Dialog element with id ${wrapperId} not found`);
    }

    if (!(dialogElement instanceof HTMLDialogElement)) {
      throw new Error("Animated dialog must be an HTMLDialogElement");
    }

    if (dialogElement === null) {
      throw new Error(`Dialog element with id ${wrapperId} not found`);
    }

    if (modalElement === null) {
      throw new Error(
        `Div element inside #${wrapperId} with class 'modal' not found`
      );
    }

    this.wrapperId = wrapperId;
    this.wrapperEl = dialogElement;
    this.modalEl = modalElement;
    this.customShowAnimations = customAnimations?.show;
    this.customHideAnimations = customAnimations?.hide;

    this.customEscapeHandler = functions?.customEscapeHandler;
    this.customWrapperClickHandler = functions?.customWrapperClickHandler;
    this.setup = functions?.setup;

    Skeleton.save(this.wrapperId);
  }

  runSetup(): void {
    this.wrapperEl.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isPopupVisible(this.wrapperId)) {
        if (this.customEscapeHandler !== undefined) {
          this.customEscapeHandler(e);
        } else {
          void this.hide();
        }
      }
    });

    this.wrapperEl.addEventListener("mousedown", (e) => {
      if (e.target === this.wrapperEl) {
        if (this.customWrapperClickHandler !== undefined) {
          this.customWrapperClickHandler(e);
        } else {
          void this.hide();
        }
      }
    });

    if (this.setup !== undefined) {
      this.setup(this.modalEl);
    }
  }

  getWrapper(): HTMLDialogElement {
    return this.wrapperEl;
  }

  getModal(): HTMLElement {
    return this.modalEl;
  }

  isOpen(): boolean {
    return this.open;
  }

  async show(options?: ShowHideOptions): Promise<void> {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve) => {
      Skeleton.append(this.wrapperId, this.skeletonAppendParent);

      if (!this.setupRan) {
        this.runSetup();
        this.setupRan = true;
      }

      if (isPopupVisible(this.wrapperId)) return resolve();

      this.open = true;
      this.wrapperEl.showModal();

      await options?.beforeAnimation?.(this.modalEl);

      const modalAnimation =
        options?.customAnimation?.modal ?? this.customShowAnimations?.modal;
      const modalAnimationDuration =
        options?.customAnimation?.modal?.durationMs ??
        this.customShowAnimations?.modal?.durationMs ??
        DEFAULT_ANIMATION_DURATION;
      const wrapperAnimation = options?.customAnimation?.wrapper ??
        this.customShowAnimations?.wrapper ?? {
          from: { opacity: "0" },
          to: { opacity: "1" },
          easing: "swing",
        };
      const wrapperAnimationDuration =
        options?.customAnimation?.wrapper?.durationMs ??
        this.customShowAnimations?.wrapper?.durationMs ??
        DEFAULT_ANIMATION_DURATION;

      const animationMode = options?.animationMode ?? "both";

      $(this.modalEl).stop(true, false);
      $(this.wrapperEl).stop(true, false);

      if (animationMode === "both" || animationMode === "none") {
        if (modalAnimation?.from) {
          $(this.modalEl).css(modalAnimation.from);
          $(this.modalEl).animate(
            modalAnimation.to,
            animationMode === "none" ? 0 : modalAnimationDuration,
            modalAnimation.easing ?? "swing"
          );
        } else {
          $(this.modalEl).css("opacity", "1");
        }

        $(this.wrapperEl).css(wrapperAnimation.from);
        $(this.wrapperEl)
          .removeClass("hidden")
          .css("opacity", "0")
          .animate(
            wrapperAnimation.to ?? { opacity: 1 },
            animationMode === "none" ? 0 : wrapperAnimationDuration,
            wrapperAnimation.easing ?? "swing",
            async () => {
              this.wrapperEl.focus();
              await options?.afterAnimation?.(this.modalEl);
              resolve();
            }
          );
      } else if (animationMode === "modalOnly") {
        $(this.wrapperEl).removeClass("hidden").css("opacity", "1");

        if (modalAnimation?.from) {
          $(this.modalEl).css(modalAnimation.from);
        } else {
          $(this.modalEl).css("opacity", "0");
        }
        $(this.modalEl).animate(
          modalAnimation?.to ?? { opacity: 1 },
          modalAnimationDuration,
          modalAnimation?.easing ?? "swing",
          async () => {
            this.wrapperEl.focus();
            await options?.afterAnimation?.(this.modalEl);
            resolve();
          }
        );
      }
    });
  }

  async hide(options?: ShowHideOptions): Promise<void> {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve) => {
      if (!isPopupVisible(this.wrapperId)) return resolve();

      await options?.beforeAnimation?.(this.modalEl);

      const modalAnimation =
        options?.customAnimation?.modal ?? this.customHideAnimations?.modal;
      const modalAnimationDuration =
        options?.customAnimation?.modal?.durationMs ??
        this.customHideAnimations?.modal?.durationMs ??
        DEFAULT_ANIMATION_DURATION;
      const wrapperAnimation = options?.customAnimation?.wrapper ??
        this.customHideAnimations?.wrapper ?? {
          from: { opacity: "1" },
          to: { opacity: "0" },
          easing: "swing",
        };
      const wrapperAnimationDuration =
        options?.customAnimation?.wrapper?.durationMs ??
        this.customHideAnimations?.wrapper?.durationMs ??
        DEFAULT_ANIMATION_DURATION;
      const animationMode = options?.animationMode ?? "both";

      $(this.modalEl).stop(true, false);
      $(this.wrapperEl).stop(true, false);

      if (animationMode === "both" || animationMode === "none") {
        if (modalAnimation?.from) {
          $(this.modalEl).css(modalAnimation.from);
          $(this.modalEl).animate(
            modalAnimation.to,
            animationMode === "none" ? 0 : modalAnimationDuration,
            modalAnimation.easing ?? "swing"
          );
        } else {
          $(this.modalEl).css("opacity", "1");
        }

        $(this.wrapperEl).css(wrapperAnimation.from);
        $(this.wrapperEl)
          .css("opacity", "1")
          .animate(
            wrapperAnimation?.to ?? { opacity: 0 },
            animationMode === "none" ? 0 : wrapperAnimationDuration,
            wrapperAnimation?.easing ?? "swing",
            async () => {
              this.wrapperEl.close();
              this.wrapperEl.classList.add("hidden");
              Skeleton.remove(this.wrapperId);
              this.open = false;
              await options?.afterAnimation?.(this.modalEl);
              resolve();
            }
          );
      } else if (animationMode === "modalOnly") {
        $(this.wrapperEl).removeClass("hidden").css("opacity", "1");

        if (modalAnimation?.from) {
          $(this.modalEl).css(modalAnimation.from);
        } else {
          $(this.modalEl).css("opacity", "1");
        }
        $(this.modalEl).animate(
          modalAnimation?.to ?? { opacity: 0 },
          modalAnimationDuration,
          modalAnimation?.easing ?? "swing",
          async () => {
            this.wrapperEl.close();
            $(this.wrapperEl).addClass("hidden").css("opacity", "0");
            Skeleton.remove(this.wrapperId);
            this.open = false;
            await options?.afterAnimation?.(this.modalEl);
            resolve();
          }
        );
      }
    });
  }

  destroy(): void {
    this.wrapperEl.close();
    this.wrapperEl.classList.add("hidden");
    Skeleton.remove(this.wrapperId);
    this.open = false;
  }
}
