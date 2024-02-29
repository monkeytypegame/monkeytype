import { isPopupVisible } from "../utils/misc";
import * as Skeleton from "./skeleton";

type ShowOptions = {
  animation?: {
    mode?: "none" | "both" | "popupOnly";
    durationMs?: number;
    custom?: {
      backdrop?: {
        from: Record<string, string>;
        to: Record<string, string>;
        easing?: string;
      };
      modal?: {
        from: Record<string, string>;
        to: Record<string, string>;
        easing?: string;
      };
    };
  };
  callbacks?: {
    beforeAnimation?: () => Promise<void>;
    afterAnimation?: () => Promise<void>;
  };
};

type HideOptions = {
  animation?: {
    mode?: "none" | "both" | "popupOnly";
    durationMs?: number;
    custom?: {
      backdrop?: {
        from: Record<string, string>;
        to: Record<string, string>;
        easing?: string;
      };
      modal?: {
        from: Record<string, string>;
        to: Record<string, string>;
        easing?: string;
      };
    };
  };
  callbacks?: {
    beforeAnimation?: () => Promise<void>;
    afterAnimation?: () => Promise<void>;
  };
};

export class AnimatedModal {
  private wrapperEl: HTMLDialogElement;
  private modalEl: HTMLElement;
  private wrapperId: string;
  private open = false;

  constructor(wrapperIdNoHash: string) {
    const dialogElement = document.getElementById(wrapperIdNoHash);
    const modalElement = document.querySelector(
      `#${wrapperIdNoHash} > .modal`
    ) as HTMLElement;

    if (dialogElement === null) {
      throw new Error(`Dialog element with id ${wrapperIdNoHash} not found`);
    }

    if (!(dialogElement instanceof HTMLDialogElement)) {
      throw new Error("Animated dialog must be an HTMLDialogElement");
    }

    if (dialogElement === null) {
      throw new Error(`Dialog element with id ${wrapperIdNoHash} not found`);
    }

    if (modalElement === null) {
      throw new Error(
        `Div element inside #${wrapperIdNoHash} with class 'modal' not found`
      );
    }

    this.wrapperId = wrapperIdNoHash;
    this.wrapperEl = dialogElement;
    this.modalEl = modalElement;

    this.wrapperEl.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isPopupVisible(this.wrapperId)) {
        void this.hide();
      }
    });

    this.wrapperEl.addEventListener("mousedown", (e) => {
      if (e.target === this.wrapperEl) {
        void this.hide();
      }
    });

    Skeleton.save(this.wrapperId);
  }

  getDialog(): HTMLDialogElement {
    return this.wrapperEl;
  }

  getPopup(): HTMLElement {
    return this.modalEl;
  }

  isOpen(): boolean {
    return this.open;
  }

  async show(options?: ShowOptions): Promise<void> {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve) => {
      Skeleton.append(this.wrapperId);
      if (isPopupVisible(this.wrapperId)) return resolve();

      this.open = true;
      this.wrapperEl.showModal();

      await options?.callbacks?.beforeAnimation?.();

      const animationMode = options?.animation?.mode ?? "both";
      const animationDuration = options?.animation?.durationMs ?? 125;

      $(this.modalEl).stop(true, false);
      $(this.wrapperEl).stop(true, false);

      if (animationMode === "both" || animationMode === "none") {
        if (options?.animation?.custom?.modal?.from) {
          $(this.modalEl).css(options.animation.custom.modal.from);
          $(this.modalEl).animate(
            options.animation.custom.modal.to,
            animationMode === "none" ? 0 : animationDuration,
            options.animation.custom.modal.easing ?? "swing"
          );
        } else {
          $(this.modalEl).css("opacity", "1");
        }

        if (options?.animation?.custom?.backdrop?.from) {
          $(this.wrapperEl).css(options.animation.custom.backdrop.from);
        }
        $(this.wrapperEl)
          .removeClass("hidden")
          .css("opacity", "0")
          .animate(
            options?.animation?.custom?.backdrop?.to ?? { opacity: 1 },
            animationMode === "none" ? 0 : animationDuration,
            options?.animation?.custom?.backdrop?.easing ?? "swing",
            async () => {
              this.wrapperEl.focus();
              await options?.callbacks?.afterAnimation?.();
              resolve();
            }
          );
      } else if (animationMode === "popupOnly") {
        $(this.wrapperEl).removeClass("hidden").css("opacity", "1");

        if (options?.animation?.custom?.modal?.from) {
          $(this.modalEl).css(options.animation.custom.modal.from);
        } else {
          $(this.modalEl).css("opacity", "0");
        }
        $(this.modalEl).animate(
          options?.animation?.custom?.modal?.to ?? { opacity: 1 },
          animationDuration,
          options?.animation?.custom?.modal?.easing ?? "swing",
          async () => {
            this.wrapperEl.focus();
            await options?.callbacks?.afterAnimation?.();
            resolve();
          }
        );
      }
    });
  }

  async hide(options?: HideOptions): Promise<void> {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve) => {
      if (!isPopupVisible(this.wrapperId)) return resolve();

      await options?.callbacks?.beforeAnimation?.();

      const animationMode = options?.animation?.mode ?? "both";
      const animationDuration = options?.animation?.durationMs ?? 125;

      $(this.modalEl).stop(true, false);
      $(this.wrapperEl).stop(true, false);

      if (animationMode === "both" || animationMode === "none") {
        if (options?.animation?.custom?.modal?.from) {
          $(this.modalEl).css(options.animation.custom.modal.from);
          $(this.modalEl).animate(
            options.animation.custom.modal.to,
            animationMode === "none" ? 0 : animationDuration,
            options.animation.custom.modal.easing ?? "swing"
          );
        } else {
          $(this.modalEl).css("opacity", "0");
        }

        if (options?.animation?.custom?.backdrop?.from) {
          $(this.wrapperEl).css(options.animation.custom.backdrop.from);
        }
        $(this.wrapperEl)
          .css("opacity", "1")
          .animate(
            options?.animation?.custom?.backdrop?.to ?? { opacity: 0 },
            animationMode === "none" ? 0 : animationDuration,
            options?.animation?.custom?.backdrop?.easing ?? "swing",
            async () => {
              this.wrapperEl.close();
              this.wrapperEl.classList.add("hidden");
              Skeleton.remove(this.wrapperId);
              this.open = false;
              await options?.callbacks?.afterAnimation?.();
              resolve();
            }
          );
      } else if (animationMode === "popupOnly") {
        $(this.wrapperEl).removeClass("hidden").css("opacity", "1");

        if (options?.animation?.custom?.modal?.from) {
          $(this.modalEl).css(options.animation.custom.modal.from);
        } else {
          $(this.modalEl).css("opacity", "1");
        }
        $(this.modalEl).animate(
          options?.animation?.custom?.modal?.to ?? { opacity: 0 },
          animationDuration,
          options?.animation?.custom?.modal?.easing ?? "swing",
          async () => {
            this.wrapperEl.close();
            $(this.wrapperEl).addClass("hidden").css("opacity", "0");
            Skeleton.remove(this.wrapperId);
            this.open = false;
            await options?.callbacks?.afterAnimation?.();
            resolve();
          }
        );
      }
    });
  }
}