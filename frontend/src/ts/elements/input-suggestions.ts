import * as TribeTypes from "../tribe/types";

export class InputSuggestions {
  private inputElement: JQuery;
  private suggestionsElement: JQuery | undefined;
  private maxSuggestions: number;
  private selectedIndex: number | undefined;
  private prefix: string;
  private suffix: string;
  private data: Record<string, TribeTypes.InputSuggestionEntry>;
  private foundKeys: string[];
  private position: "top" | "bottom";
  private minInputForSuggestions: number;
  private applyWith: string[];

  constructor(
    inputElement: JQuery,
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
      const inputVal = this.inputElement.val() as string;
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
      this.inputElement[0]?.before(suggestionsElement);
    } else {
      this.inputElement[0]?.after(suggestionsElement);
    }
    this.suggestionsElement = $(suggestionsElement);
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
      const suggestion = this.data[
        searchString
      ] as TribeTypes.InputSuggestionEntry;
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
    this.suggestionsElement.html(suggestions);
    this.updatePosition();
  }

  updatePosition(): void {
    if (!this.suggestionsElement) return;
    if (this.position === "top") {
      this.suggestionsElement.css({
        left: this.inputElement[0]?.offsetLeft + "px",
        width: this.inputElement[0]?.offsetWidth + "px",
        top:
          (this.inputElement[0]?.offsetTop ?? 0) -
          (this.suggestionsElement[0]?.offsetHeight ?? 0) +
          "px",
      });
    } else {
      this.suggestionsElement.css({
        left: this.inputElement[0]?.offsetLeft + "px",
        width: this.inputElement[0]?.offsetWidth + "px",
        top:
          (this.inputElement[0]?.offsetTop ?? 0) +
          (this.inputElement[0]?.offsetHeight ?? 0) +
          "px",
      });
    }
  }

  updateSelected(): void {
    if (!this.suggestionsElement) return;
    if (this.selectedIndex === undefined) return;
    this.suggestionsElement.find(".suggestion").removeClass("selected");
    this.suggestionsElement
      .find(`.suggestion[data-id="${this.selectedIndex}"]`)
      .addClass("selected");
  }

  destroy(): void {
    if (!this.suggestionsElement) return;
    this.suggestionsElement.remove();
    this.suggestionsElement = undefined;
    this.selectedIndex = undefined;
    this.updateRoundCorners();
  }

  setData(data: Record<string, TribeTypes.InputSuggestionEntry>): void {
    this.data = data;
  }

  applySelection(): void {
    if (!this.suggestionsElement) return;
    if (this.selectedIndex === undefined) return;
    if (this.suggestionsElement === undefined) return;
    const toInsert = this.foundKeys[this.selectedIndex];
    if (toInsert === undefined) return;

    const currentVal = this.inputElement.val() as string;
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

    this.inputElement.val(newVal + " ");
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
        this.inputElement.css({
          "border-top-left-radius": "0",
          "border-top-right-radius": "0",
        });
        this.suggestionsElement.css({
          "border-bottom-left-radius": "0",
          "border-bottom-right-radius": "0",
        });
      } else {
        this.inputElement.css({
          "border-bottom-left-radius": "0",
          "border-bottom-right-radius": "0",
        });
        this.suggestionsElement.css({
          "border-top-left-radius": "0",
          "border-top-right-radius": "0",
        });
      }
    } else {
      //if suggestions are closed, reset the border radius
      this.inputElement.css({
        "border-top-left-radius": "",
        "border-top-right-radius": "",
        "border-bottom-left-radius": "",
        "border-bottom-right-radius": "",
      });
    }
  }

  isVisible(): boolean {
    if (this.suggestionsElement === undefined) return false;

    return this.suggestionsElement.is(":visible");
  }
}
