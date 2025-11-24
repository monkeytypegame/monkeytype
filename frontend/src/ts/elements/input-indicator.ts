import { addUtilsToElement, ElementWithUtils } from "../utils/dom";

type InputIndicatorOption = {
  icon: string;
  spinIcon?: true;
  message?: string;
  level: -1 | 0 | 1;
};

export class InputIndicator {
  private inputElement: ElementWithUtils<HTMLInputElement>;
  private parentElement: ElementWithUtils;
  private options: Record<string, InputIndicatorOption>;
  private currentStatus: keyof typeof this.options | null;

  constructor(
    inputElement: HTMLInputElement,
    options: Record<string, InputIndicatorOption>
  ) {
    this.inputElement = addUtilsToElement(inputElement);
    this.inputElement.wrapWith(`<div class="inputAndIndicator"></div>`);
    this.parentElement = addUtilsToElement(
      this.inputElement.parentElement as HTMLElement
    );
    this.options = options;
    this.currentStatus = null;

    let indicator = `<div class="statusIndicator">`;

    for (const [optionId, option] of Object.entries(options)) {
      indicator += `
      <div
        class="indicator level${option.level} hidden"
        data-option-id="${optionId}"
        
        ${
          (option.message?.length ?? 0) > 27
            ? `data-balloon-length="large"`
            : ""
        }
        data-balloon-pos="left"
        ${option.message ?? "" ? `aria-label="${option.message}"` : ""}
      >
        <i class="fas fa-fw ${option.icon} ${
        option.spinIcon ? "fa-spin" : ""
      }"></i>
      </div>
      `;
    }

    indicator += `</div>`;

    this.parentElement.appendHtml(indicator);
  }

  hide(): void {
    this.parentElement.qsa(".statusIndicator div")?.addClass("hidden");
    this.currentStatus = null;
    $(this.inputElement).css("padding-right", "0.5em");
  }

  show(optionId: keyof typeof this.options, messageOverride?: string): void {
    this.hide();

    this.currentStatus = optionId;

    const indicator = this.parentElement.qs(`[data-option-id="${optionId}"]`);

    indicator?.removeClass("hidden");

    if (messageOverride !== undefined && messageOverride !== "") {
      if (messageOverride.length > 20) {
        indicator?.setAttribute("data-balloon-length", "large");
      } else {
        indicator?.removeAttribute("data-balloon-length");
      }
      indicator?.setAttribute("aria-label", messageOverride);
    }

    $(this.inputElement).css("padding-right", "2.1em");
    this.parentElement.setAttribute("data-indicator-status", optionId);
  }

  get(): keyof typeof this.options | null {
    return this.currentStatus;
  }
}
