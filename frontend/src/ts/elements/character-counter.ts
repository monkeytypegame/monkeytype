import { createElementWithUtils, ElementWithUtils } from "../utils/dom";

export class CharacterCounter {
  private textareaElement: ElementWithUtils<HTMLTextAreaElement>;
  private parentElement: ElementWithUtils;
  private counterElement: ElementWithUtils;
  private maxLength: number;

  constructor(
    textareaElement: ElementWithUtils<HTMLTextAreaElement>,
    maxLength: number,
  ) {
    this.textareaElement = textareaElement;
    this.maxLength = maxLength;

    this.textareaElement.setAttribute("maxlength", this.maxLength.toString());

    const textAreaParent = this.textareaElement.getParent();
    if (!textAreaParent) {
      // Wrap the textarea element in a div if not already wrapped
      const wrapper = this.textareaElement?.wrapWith(
        `<div class="textareaWithCounter"></div>`,
      );
      this.parentElement = wrapper;
    } else {
      this.parentElement = textAreaParent;
    }

    const counterElement = this.parentElement.qs(".char-counter");
    if (counterElement !== null) {
      this.counterElement = counterElement;
    } else {
      const counterElement = createElementWithUtils("span", {
        classList: ["char-counter"],
      });
      this.parentElement.append(counterElement);
      this.counterElement = counterElement;
    }

    this.updateCounter();
    this.textareaElement.on("input", () => this.updateCounter());
  }

  private updateCounter(): void {
    const maxLength = this.maxLength;
    const currentLength = (this.textareaElement.getValue() ?? "").length;
    const remaining = maxLength - currentLength;
    this.counterElement.setText(`${currentLength}/${maxLength}`);

    const remainingPercentage = (remaining / this.maxLength) * 100;

    this.counterElement.removeClass("warning");
    this.counterElement.removeClass("error");

    if (remainingPercentage === 0) {
      this.counterElement.addClass("error");
    } else if (remainingPercentage < 10) {
      this.counterElement.addClass("warning");
    }
  }

  public setMaxLength(maxLength: number): void {
    this.maxLength = maxLength;
    this.updateCounter();
  }
}
