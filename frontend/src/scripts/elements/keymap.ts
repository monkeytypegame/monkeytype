import Config, * as UpdateConfig from "../config";
import * as ThemeColors from "./theme-colors";
import layouts from "../test/layouts";
import * as SlowTimer from "../states/slow-timer";
import * as ConfigEvent from "../observables/config-event";

export function highlightKey(currentKey: string): void {
  if (Config.mode === "zen") return;
  try {
    if ($(".active-key") != undefined) {
      $(".active-key").removeClass("active-key");
    }

    let highlightKey;
    switch (currentKey) {
      case "\\":
      case "|":
        highlightKey = "#KeyBackslash";
        break;
      case "}":
      case "]":
        highlightKey = "#KeyRightBracket";
        break;
      case "{":
      case "[":
        highlightKey = "#KeyLeftBracket";
        break;
      case '"':
      case "'":
        highlightKey = "#KeyQuote";
        break;
      case ":":
      case ";":
        highlightKey = "#KeySemicolon";
        break;
      case "<":
      case ",":
        highlightKey = "#KeyComma";
        break;
      case ">":
      case ".":
        highlightKey = "#KeyPeriod";
        break;
      case "?":
      case "/":
        highlightKey = "#KeySlash";
        break;
      case "":
        highlightKey = "#KeySpace";
        break;
      default:
        highlightKey = `#Key${currentKey}`;
    }

    $(highlightKey).addClass("active-key");
    if (highlightKey === "#KeySpace") {
      $("#KeySpace2").addClass("active-key");
    }
  } catch (e) {
    if (e instanceof Error) {
      console.log("could not update highlighted keymap key: " + e.message);
    }
  }
}

export async function flashKey(key: string, correct: boolean): Promise<void> {
  if (key == undefined) return;
  switch (key) {
    case "\\":
    case "|":
      key = "#KeyBackslash";
      break;
    case "}":
    case "]":
      key = "#KeyRightBracket";
      break;
    case "{":
    case "[":
      key = "#KeyLeftBracket";
      break;
    case '"':
    case "'":
      key = "#KeyQuote";
      break;
    case ":":
    case ";":
      key = "#KeySemicolon";
      break;
    case "<":
    case ",":
      key = "#KeyComma";
      break;
    case ">":
    case ".":
      key = "#KeyPeriod";
      break;
    case "?":
    case "/":
      key = "#KeySlash";
      break;
    case "" || "Space":
      key = "#KeySpace";
      break;
    default:
      key = `#Key${key.toUpperCase()}`;
  }

  if (key == "#KeySpace") {
    key = ".key-split-space";
  }

  const themecolors = await ThemeColors.getAll();

  try {
    if (correct || Config.blindMode) {
      $(key)
        .stop(true, true)
        .css({
          color: themecolors.bg,
          backgroundColor: themecolors.main,
          borderColor: themecolors.main,
        })
        .animate(
          {
            color: themecolors.sub,
            backgroundColor: "transparent",
            borderColor: themecolors.sub,
          },
          SlowTimer.get() ? 0 : 500,
          "easeOutExpo"
        );
    } else {
      $(key)
        .stop(true, true)
        .css({
          color: themecolors.bg,
          backgroundColor: themecolors.error,
          borderColor: themecolors.error,
        })
        .animate(
          {
            color: themecolors.sub,
            backgroundColor: "transparent",
            borderColor: themecolors.sub,
          },
          SlowTimer.get() ? 0 : 500,
          "easeOutExpo"
        );
    }
  } catch (e) {}
}

export function hide(): void {
  $(".keymap").addClass("hidden");
}

export function show(): void {
  $(".keymap").removeClass("hidden");
}

export function refreshKeys(layout: string): void {
  try {
    let lts = layouts[layout as keyof typeof layouts]; //layout to show
    let layoutString = layout;
    if (Config.keymapLayout === "overrideSync") {
      if (Config.layout === "default") {
        lts = layouts["qwerty"];
        layoutString = "default";
      } else {
        lts = layouts[Config.layout as keyof typeof layouts];
        layoutString = Config.layout;
      }
    }

    const showTopRow = (lts as typeof layouts["qwerty"]).keymapShowTopRow;

    // if (Config.keymapStyle === "alice") {
    //   $(".keymap .extraKey").removeClass("hidden");
    // } else {
    //   $(".keymap .extraKey").addClass("hidden");
    // }

    // $($(".keymap .r5 .keymap-key .letter")[0]).text(
    //   layoutString.replace(/_/g, " ")
    // );

    // if (lts.iso) {
    //   $(".keymap .r4 .keymap-key.first").removeClass("hidden-key");
    // } else {
    //   $(".keymap .r4 .keymap-key.first").addClass("hidden-key");
    // }
    // const layoutKeys = (lts as typeof layouts["qwerty"]).keys;
    // const toReplace = layoutKeys.row1.slice(1,layoutKeys.row1.length).concat(layoutKeys.row2).concat(layoutKeys.row3).concat(layoutKeys.row4).concat(layoutKeys.row5);
    // let count = 0;

    let keymapElement = "";

    Object.keys(lts.keys).forEach((row, index) => {
      const rowKeys = lts.keys[row];
      let rowElement = "";
      if (row === "row1" && !showTopRow) {
        return;
      }

      if (row === "row2" || row === "row3" || row === "row4") {
        rowElement += "<div></div>";
      }

      if (row === "row4" && lts.iso === undefined) {
        rowElement += "<div></div>";
      }

      if (row === "row5") {
        rowElement += "<div></div>";
        rowElement += `<div class="keymap-key key-space">
          <div class="letter">${layoutString.replace(/_/g, " ")}</div>
        </div>`;
      } else {
        for (let i = 0; i < rowKeys.length; i++) {
          if (row === "row2" && i === 12) continue;
          const key = rowKeys[i];
          const keyElement = `<div class="keymap-key" data-key="${key}">
              <div class="letter">${key[0]}</div>
          </div>`;
          rowElement += keyElement;
        }
      }

      keymapElement += `<div class="row r${index + 1}">${rowElement}</div>`;
    });

    $(".keymap").html(keymapElement);

    // let repeatB = false;
    // $(".keymap .keymap-key .letter")
    //   .map(function (_index, element) {
    //     if ($(element).hasClass("iso-key") && lts.iso === undefined) return;
    //     if (count < toReplace.length) {
    //       const key = toReplace[count].charAt(0);
    //       this.innerHTML = key;

    //       if (!this.parentElement) return;

    //       switch (key) {
    //         case "\\":
    //         case "|":
    //           this.parentElement.id = "KeyBackslash";
    //           break;
    //         case "}":
    //         case "]":
    //           this.parentElement.id = "KeyRightBracket";
    //           break;
    //         case "{":
    //         case "[":
    //           this.parentElement.id = "KeyLeftBracket";
    //           break;
    //         case '"':
    //         case "'":
    //           this.parentElement.id = "KeyQuote";
    //           break;
    //         case ":":
    //         case ";":
    //           this.parentElement.id = "KeySemicolon";
    //           break;
    //         case "<":
    //         case ",":
    //           this.parentElement.id = "KeyComma";
    //           break;
    //         case ">":
    //         case ".":
    //           this.parentElement.id = "KeyPeriod";
    //           break;
    //         case "?":
    //         case "/":
    //           this.parentElement.id = "KeySlash";
    //           break;
    //         case "":
    //           this.parentElement.id = "KeySpace";
    //           break;
    //         default:
    //           this.parentElement.id = `Key${key.toUpperCase()}`;
    //       }
    //     }

    //     // if (count == 41 && !repeatB) {
    //     //   repeatB = true;
    //     // }else{
    //     //   repeatB = false;
    //     //   count++;
    //     // }

    //     count++;

    //     // }
    //   })
    //   .get();
  } catch (e) {
    if (e instanceof Error) {
      console.log(
        "something went wrong when changing layout, resettings: " + e.message
      );
      UpdateConfig.setKeymapLayout("qwerty", true);
    }
  }
}

ConfigEvent.subscribe((eventKey, eventValue) => {
  if (eventKey === "layout" && Config.keymapLayout === "overrideSync")
    refreshKeys(Config.keymapLayout);
  if (eventKey === "keymapLayout") refreshKeys(eventValue as string);
});
