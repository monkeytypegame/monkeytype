interface InputIndicatorOption {
  icon: string;
  spinIcon?: true;
  message?: string;
  level: -1 | 0 | 1;
}

export class InputIndicator {
  private inputElement: JQuery<HTMLElement>;
  private parentElement: JQuery<HTMLElement>;
  private options: Record<string, InputIndicatorOption>;
  private currentStatus: keyof typeof this.options | null;

  constructor(
    inputElement: JQuery<HTMLElement>,
    options: Record<string, InputIndicatorOption>
  ) {
    this.inputElement = inputElement;
    $(this.inputElement).wrap(`<div class="inputAndIndicator"></div>`);
    this.parentElement = $(this.inputElement).parent(".inputAndIndicator");
    this.options = options;
    this.currentStatus = null;

    let indicator = `<div class="statusIndicator">`;

    for (const [optionId, option] of Object.entries(options)) {
      indicator += `
      <div
        class="indicator level${option.level} hidden"
        data-option-id="${optionId}"
        
        ${
          //todo: find a good value for this
          (option.message?.length ?? 0) > 20
            ? `data-balloon-length="large"`
            : ""
        }
        data-balloon-pos="up"
        ${option.message ? `aria-label="${option.message}"` : ""}
      >
        <i class="fas fa-fw ${option.icon} ${
        option.spinIcon ? "fa-spin" : ""
      }"></i>
      </div>
      `;
    }

    indicator += `</div>`;

    this.parentElement.append(indicator);
  }

  hide(): void {
    this.parentElement.find(".statusIndicator div").addClass("hidden");
    this.currentStatus = null;
    $(this.inputElement).css("padding-right", "0.5em");
  }

  show(optionId: keyof typeof this.options, messageOverride?: string): void {
    this.hide();

    this.currentStatus = optionId;

    const indicator = this.parentElement.find(`[data-option-id="${optionId}"]`);

    indicator.removeClass("hidden");

    if (messageOverride) {
      if (messageOverride.length > 20) {
        indicator.attr("data-balloon-length", "large");
      } else {
        indicator.removeAttr("data-balloon-length");
      }
      indicator.attr("aria-label", messageOverride);
    }

    $(this.inputElement).css("padding-right", "2.1em");
  }

  get(): keyof typeof this.options | null {
    return this.currentStatus;
  }
}
