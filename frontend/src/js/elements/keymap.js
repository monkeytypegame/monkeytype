import Config, * as UpdateConfig from "../config";
import * as ThemeColors from "./theme-colors";
import layouts from "../test/layouts";
import * as CommandlineLists from "./commandline-lists";
import * as Commandline from "./commandline";
import * as SlowTimer from "../states/slow-timer";

export function highlightKey(currentKey) {
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
    console.log("could not update highlighted keymap key: " + e.message);
  }
}

export async function flashKey(key, correct) {
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

  let themecolors = await ThemeColors.get();

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

export function hide() {
  $(".keymap").addClass("hidden");
}

export function show() {
  $(".keymap").removeClass("hidden");
}

export function refreshKeys(layout) {
  try {
    let lts = layouts[layout]; //layout to show
    let layoutString = layout;
    if (Config.keymapLayout === "overrideSync") {
      if (Config.layout === "default") {
        lts = layouts["qwerty"];
        layoutString = "default";
      } else {
        lts = layouts[Config.layout];
        layoutString = Config.layout;
      }
    }

    if (lts.keymapShowTopRow) {
      $(".keymap .r1").removeClass("hidden");
    } else {
      $(".keymap .r1").addClass("hidden");
    }

    if (Config.keymapStyle === "alice") {
      $(".keymap .extraKey").removeClass("hidden");
    } else {
      $(".keymap .extraKey").addClass("hidden");
    }

    $($(".keymap .r5 .keymap-key .letter")[0]).text(
      layoutString.replace(/_/g, " ")
    );

    if (lts.iso) {
      $(".keymap .r4 .keymap-key.first").removeClass("hidden-key");
    } else {
      $(".keymap .r4 .keymap-key.first").addClass("hidden-key");
    }

    var toReplace = lts.keys.slice(1, 48);
    var count = 0;

    // let repeatB = false;
    $(".keymap .keymap-key .letter")
      .map(function () {
        if (count < toReplace.length) {
          var key = toReplace[count].charAt(0);
          this.innerHTML = key;

          switch (key) {
            case "\\":
            case "|":
              this.parentElement.id = "KeyBackslash";
              break;
            case "}":
            case "]":
              this.parentElement.id = "KeyRightBracket";
              break;
            case "{":
            case "[":
              this.parentElement.id = "KeyLeftBracket";
              break;
            case '"':
            case "'":
              this.parentElement.id = "KeyQuote";
              break;
            case ":":
            case ";":
              this.parentElement.id = "KeySemicolon";
              break;
            case "<":
            case ",":
              this.parentElement.id = "KeyComma";
              break;
            case ">":
            case ".":
              this.parentElement.id = "KeyPeriod";
              break;
            case "?":
            case "/":
              this.parentElement.id = "KeySlash";
              break;
            case "":
              this.parentElement.id = "KeySpace";
              break;
            default:
              this.parentElement.id = `Key${key.toUpperCase()}`;
          }
        }

        // if (count == 41 && !repeatB) {
        //   repeatB = true;
        // }else{
        //   repeatB = false;
        //   count++;
        // }

        count++;

        // }
      })
      .get();
  } catch (e) {
    console.log(
      "something went wrong when changing layout, resettings: " + e.message
    );
    UpdateConfig.setKeymapLayout("qwerty", true);
  }
}

$(document).on("click", ".keymap .r5 #KeySpace", (e) => {
  CommandlineLists.setCurrent([CommandlineLists.commandsKeymapLayouts]);
  Commandline.show();
});

$(document).ready(() => {
  UpdateConfig.subscribeToEvent((eventKey, eventValue) => {
    if (eventKey === "layout" && Config.keymapLayout === "overrideSync")
      refreshKeys(Config.keymapLayout);
    if (eventKey === "keymapLayout") refreshKeys(eventValue);
  });
});
