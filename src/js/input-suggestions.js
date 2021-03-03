export default class InputSuggestions {
  constructor(jqelement, emojiList, nameList) {
    this.element = jqelement;
    this.currentSuggestion = 0;
    this.suggestionList = [];
    this.nameList = nameList;
    this.emojiList = emojiList;
  }

  async updateSuggestions(mode, text) {
    this.element.empty();
    this.suggestionList = [];
    let suggested = 0;

    if (mode === "emoji") {
      let reg = new RegExp("^" + text, "ig");
      let found = this.emojiList.filter((e) => reg.test(e.from));
      found.forEach((emoji) => {
        if (suggested > 5) return;
        this.suggestionList.push(emoji);
        suggested++;
        if (emoji.type === "image") {
          this.element.append(`
            <div class="suggestion">
              <div class="emoji" style="background-image: url('${emoji.to}')";></div>
              <div class="text">:${emoji.from}:</div>
            </div>
            `);
        } else if (emoji.type === "emoji") {
          this.element.append(`
            <div class="suggestion">
              <div class="emoji">${emoji.to}</div>
              <div class="text">:${emoji.from}:</div>
            </div>
            `);
        }
      });

      reg = new RegExp("(?!^)" + text, "ig");
      found = this.emojiList.filter((e) => reg.test(e.from));
      found.forEach((emoji) => {
        if (suggested > 5) return;
        this.suggestionList.push(emoji);
        suggested++;
        if (emoji.type === "image") {
          this.element.append(`
            <div class="suggestion">
              <div class="emoji" style="background-image: url('${emoji.to}')";></div>
              <div class="text">:${emoji.from}:</div>
            </div>
            `);
        } else if (emoji.type === "emoji") {
          this.element.append(`
            <div class="suggestion">
              <div class="emoji">${emoji.to}</div>
              <div class="text">:${emoji.from}:</div>
            </div>
            `);
        }
      });
    } else if (mode === "name") {
      let reg = new RegExp("^" + text, "ig");
      let found = this.nameList.filter((n) => reg.test(n));
      found.forEach((name) => {
        if (suggested > 5) return;
        this.suggestionList.push(name);
        suggested++;
        this.element.append(`
            <div class="suggestion">
              <div class="text">@${name}</div>
            </div>
            `);
      });
    }

    this.suggestionsCount = this.suggestionList.length;

    this.updateActiveSuggestion();
  }

  updateActiveSuggestion() {
    this.clampActive();
    this.element.find(".suggestion").removeClass("active");
    $(this.element.find(".suggestion")[this.currentSuggestion]).addClass(
      "active"
    );
  }

  clampActive() {
    if (this.currentSuggestion <= -1) {
      this.currentSuggestion = this.suggestionsCount - 1;
    }
    if (this.currentSuggestion >= this.suggestionsCount) {
      this.currentSuggestion = 0;
    }
  }

  getActive() {
    if (this.currentSuggestion === -1) {
      return null;
    } else {
      return this.suggestionList[this.currentSuggestion];
    }
  }

  moveActiveSuggestion(down) {
    if (down) {
      this.currentSuggestion++;
    } else {
      this.currentSuggestion--;
    }
    this.clampActive();
    this.updateActiveSuggestion();
  }

  show() {
    this.currentSuggestion = 0;
    this.updateActiveSuggestion();
    this.element.removeClass("hidden");
  }

  hide() {
    this.currentSuggestion = -1;
    this.element.addClass("hidden");
  }

  setNameList(list) {
    this.nameList = list;
  }
}
