import { addUtilsToElement, ElementWithUtils } from "../utils/dom";

export class CharacterCounter {
  private textareaElement: ElementWithUtils<HTMLTextAreaElement>;
  private parentElement: ElementWithUtils;
  private counterElement: ElementWithUtils;
  private maxLength: number;

  constructor(textareaElement: HTMLTextAreaElement, maxLength: number) {
    this.textareaElement = addUtilsToElement(textareaElement);
    this.maxLength = maxLength;

    this.textareaElement.setAttribute("maxlength", this.maxLength.toString());

    // Wrap the textarea element in a div if not already wrapped
    if (
      !this.textareaElement.parentElement?.classList.contains(
        "textareaWithCounter"
      )
    ) {
      const wrapper = this.textareaElement?.wrapWith(
        `<div class="textareaWithCounter"></div>`
      );
      this.parentElement = wrapper;
    } else {
      this.parentElement = addUtilsToElement(
        this.textareaElement.parentElement
      );
    }

    const counterElements = this.parentElement.qsa(".char-counter");

    if (counterElements.length > 0) {
      this.counterElement = counterElements[0] as ElementWithUtils;
    } else {
      // const counterHtml = `<span class="char-counter"></span>`;
      const element = document.createElement("span");
      element.className = "char-counter";
      this.parentElement.append(element);
      this.counterElement = addUtilsToElement(element);
    }

    this.updateCounter();
    this.textareaElement.on("input", () => this.updateCounter());
  }

  private updateCounter(): void {
    const maxLength = this.maxLength;
    const currentLength = this.textareaElement.value.length;
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
