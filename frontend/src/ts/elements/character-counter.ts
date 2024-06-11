export class CharacterCounter {
  private textareaElement: JQuery<HTMLTextAreaElement>;
  private parentElement: JQuery;
  private counterElement: JQuery;
  private maxLength: number;

  constructor(textareaElement: JQuery<HTMLTextAreaElement>, maxLength: number) {
    this.textareaElement = textareaElement;
    this.maxLength = maxLength;

    if (this.textareaElement.attr("maxlength") == undefined) {
      this.textareaElement.attr("maxlength", this.maxLength.toString());
    }

    // Wrap the textarea element in a div if not already wrapped
    if (!this.textareaElement.parent().hasClass("textareaWithCounter")) {
      $(this.textareaElement).wrap(`<div class="textareaWithCounter"></div>`);
    }
    this.parentElement = $(this.textareaElement).parent(".textareaWithCounter");

    // Create the counter element if it doesn't exist
    if (this.parentElement.find(".char-counter").length === 0) {
      this.counterElement = $(`<span class="char-counter"></span>`);
      this.parentElement.append(this.counterElement);
    } else {
      this.counterElement = this.parentElement.find(".char-counter");
    }

    this.updateCounter();
    this.textareaElement.on("input", () => this.updateCounter());
  }

  private updateCounter(): void {
    const maxLength = this.maxLength;
    const currentLength = (this.textareaElement.val() as string).length;
    const remaining = maxLength - currentLength;
    this.counterElement.text(`${currentLength}/${maxLength}`);

    const remainingPercentage = (remaining / this.maxLength) * 100;
    if (remainingPercentage < 10) {
      this.counterElement.addClass("red");
    } else {
      this.counterElement.removeClass("red");
    }
  }

  public setMaxLength(maxLength: number): void {
    this.maxLength = maxLength;
    this.updateCounter();
  }
}
