import { ElementWithUtils } from "../utils/dom";

export type InputSuggestionEntry = {
  display: string;
  imageIcon?: string;
  faIcon?: string;
  textIcon?: string;
};

export class InputSuggestions {
  private inputElement: ElementWithUtils<HTMLInputElement>;
  private suggestionsElement: ElementWithUtils | undefined;
  private maxSuggestions: number;
  private selectedIndex: number | undefined;
  private prefix: string;
  private suffix: string;
  private data: Record<string, InputSuggestionEntry>;
  private foundKeys: string[];
  private position: "top" | "bottom";
  private minInputForSuggestions: number;
  private applyWith: string[];

  constructor(
    inputElement: ElementWithUtils<HTMLInputElement>,
    prefix: string,
    suffix: string,
    maxSuggestions: number,
    minInputForSuggestions: number,
    position: "top" | "bottom",
    applyWith: string[],
  ) {
    this.inputElement = inputElement;
    this.data = {};
    this.prefix = prefix;
    this.suffix = suffix;
    this.maxSuggestions = maxSuggestions;
    this.selectedIndex = undefined;
    this.position = position;
    this.foundKeys = [];
    this.minInputForSuggestions = minInputForSuggestions;
    this.applyWith = applyWith;
  }

  applyEventListeners(): void {
    this.inputElement.on("input", () => {
      const inputVal = this.inputElement.getValue() ?? "";
      const split = inputVal.split(" ");
      const last = split[split.length - 1] as string;
      const search = last.slice(this.prefix.length);

      if (
        last.startsWith(this.prefix) &&
        search.length >= this.minInputForSuggestions
      ) {
        this.spawn();
        this.search(search);
        this.fill();
      } else {
        this.destroy();
      }
    });

    this.inputElement.on("keydown", (e) => {
      if (e.code === "ArrowUp" || e.code === "ArrowDown") {
        e.preventDefault();
        if (e.code === "ArrowUp") {
          if (this.position === "top") {
            this.incrementSearchIndex();
          } else {
            this.decrementSearchIndex();
          }
        }
        if (e.code === "ArrowDown") {
          if (this.position === "top") {
            this.decrementSearchIndex();
          } else {
            this.incrementSearchIndex();
          }
        }
        this.updateSelected();
      }
    });

    this.inputElement.on("keydown", (e) => {
      if (this.applyWith.includes(e.code) && this.isVisible()) {
        e.preventDefault();
      }
    });

    this.inputElement.on("keyup", (e) => {
      if (this.applyWith.includes(e.code) && this.isVisible()) {
        this.applySelection();
      }
    });
  }

  spawn(): void {
    if (this.suggestionsElement) return;
    //create element and insert after the input element using vanilla js
    const suggestionsElement = document.createElement("div");
    suggestionsElement.classList.add("inputSuggestions");
    if (this.position === "top") {
      this.inputElement.before(suggestionsElement);
    } else {
      this.inputElement.after(suggestionsElement);
    }
    this.suggestionsElement = new ElementWithUtils(suggestionsElement);
    this.selectedIndex = 0;

    this.updateRoundCorners();
  }

  search(searchString: string): void {
    this.selectedIndex = 0;
    let found: string[];
    if (searchString === "") {
      found = Object.keys(this.data);
    } else {
      //first filter by keys that begin with search, then add keys that contain search
      found = Object.keys(this.data).filter((key) =>
        key.toLowerCase().startsWith(searchString.toLowerCase()),
      );
      found = found.concat(
        Object.keys(this.data).filter(
          (key) =>
            key.toLowerCase().includes(searchString.toLowerCase()) &&
            !found.includes(key),
        ),
      );
    }

    if (found.length > this.maxSuggestions) {
      found = found.slice(0, this.maxSuggestions);
    }

    this.foundKeys = found;
  }

  fill(): void {
    if (!this.suggestionsElement) return;
    this.suggestionsElement.empty();
    let suggestions = "";
    let added = 0;

    if (this.foundKeys.length === 0) {
      this.destroy();
      return;
    }

    for (const searchString of this.foundKeys) {
      const suggestion = this.data[searchString];
      if (suggestion === undefined) continue;
      const el = `
      <div class="suggestion ${
        added === this.selectedIndex ? "selected" : ""
      }" data-search-string="${searchString}" data-id="${added}">
        ${
          suggestion.imageIcon !== undefined
            ? `<div class="icon"><img src="${suggestion.imageIcon}" /></div>`
            : suggestion.faIcon !== undefined
              ? `<div class="icon"><i class="fas fa-fw ${suggestion.faIcon}"></i></div>`
              : suggestion.textIcon !== undefined
                ? `<div class="icon"><span>${suggestion.textIcon}</span></div>`
                : ""
        }
        <span>${suggestion.display}</span>
      </div>
      `;
      if (this.position === "top") {
        suggestions = el + suggestions;
      } else {
        suggestions += el;
      }
      added++;
      if (added >= this.maxSuggestions) break;
    }
    this.suggestionsElement.setHtml(suggestions);
    this.updatePosition();
  }

  updatePosition(): void {
    if (!this.suggestionsElement) return;
    if (this.position === "top") {
      this.suggestionsElement.setStyle({
        left: this.inputElement.getOffsetLeft() + "px",
        width: this.inputElement.getOffsetWidth() + "px",
        top:
          (this.inputElement.getOffsetTop() ?? 0) -
          (this.suggestionsElement.getOffsetHeight() ?? 0) +
          "px",
      });
    } else {
      this.suggestionsElement.setStyle({
        left: this.inputElement.getOffsetLeft() + "px",
        width: this.inputElement.getOffsetWidth() + "px",
        top:
          (this.inputElement.getOffsetTop() ?? 0) +
          (this.inputElement.getOffsetHeight() ?? 0) +
          "px",
      });
    }
  }

  updateSelected(): void {
    if (!this.suggestionsElement) return;
    if (this.selectedIndex === undefined) return;
    this.suggestionsElement.qs(".suggestion")?.removeClass("selected");
    this.suggestionsElement
      .qs(`.suggestion[data-id="${this.selectedIndex}"]`)
      ?.addClass("selected");
  }

  destroy(): void {
    if (!this.suggestionsElement) return;
    this.suggestionsElement.remove();
    this.suggestionsElement = undefined;
    this.selectedIndex = undefined;
    this.updateRoundCorners();
  }

  setData(data: Record<string, InputSuggestionEntry>): void {
    this.data = data;
  }

  applySelection(): void {
    if (!this.suggestionsElement) return;
    if (this.selectedIndex === undefined) return;
    if (this.suggestionsElement === undefined) return;
    const toInsert = this.foundKeys[this.selectedIndex];
    if (toInsert === undefined) return;

    const currentVal = this.inputElement.getValue() ?? "";
    const split = currentVal.split(" ");

    //remove the last word
    split.pop();

    //add the selected suggestion
    split.push(toInsert);

    //add the prefix
    split[split.length - 1] =
      this.prefix + split[split.length - 1] + (this.suffix ? this.suffix : "");

    //join the array back into a string
    const newVal = split.join(" ");

    this.inputElement.setValue(newVal + " ");
    this.destroy();
  }

  incrementSearchIndex(): void {
    if (this.selectedIndex === undefined) return;
    this.selectedIndex++;
    if (this.selectedIndex >= this.foundKeys.length) {
      this.selectedIndex = 0;
    }
  }

  decrementSearchIndex(): void {
    if (this.selectedIndex === undefined) return;
    this.selectedIndex--;
    if (this.selectedIndex < 0) {
      this.selectedIndex = this.foundKeys.length - 1;
    }
  }

  updateRoundCorners(): void {
    if (this.suggestionsElement) {
      //if suggestions are open, change the corners of the input depending on the position of the suggestions using border radius
      if (this.position === "top") {
        this.inputElement.setStyle({
          borderTopLeftRadius: "0",
          borderTopRightRadius: "0",
        });
        this.suggestionsElement.setStyle({
          borderBottomLeftRadius: "0",
          borderBottomRightRadius: "0",
        });
      } else {
        this.inputElement.setStyle({
          borderBottomLeftRadius: "0",
          borderBottomRightRadius: "0",
        });
        this.suggestionsElement.setStyle({
          borderTopLeftRadius: "0",
          borderTopRightRadius: "0",
        });
      }
    } else {
      //if suggestions are closed, reset the border radius
      this.inputElement.setStyle({
        borderTopLeftRadius: "",
        borderTopRightRadius: "",
        borderBottomLeftRadius: "",
        borderBottomRightRadius: "",
      });
    }
  }

  isVisible(): boolean {
    if (this.suggestionsElement === undefined) return false;

    return this.suggestionsElement.isVisible();
  }
}
