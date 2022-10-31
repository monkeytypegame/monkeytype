import Config from "../config";
import * as ThemeColors from "./theme-colors";
import * as SlowTimer from "../states/slow-timer";
import * as ConfigEvent from "../observables/config-event";
import * as Misc from "../utils/misc";
import * as Hangul from "hangul-js";
import * as Notifications from "../elements/notifications";
import * as ActivePage from "../states/active-page";

export function highlightKey(currentKey: string): void {
  if (Config.mode === "zen") return;
  if (currentKey === "") currentKey = " ";
  try {
    if ($(".activeKey") != undefined) {
      $(".activeKey").removeClass("activeKey");
    }

    let highlightKey;
    if (Config.language.startsWith("korean")) {
      currentKey = Hangul.disassemble(currentKey)[0];
    }
    if (currentKey == " ") {
      highlightKey = "#keymap .keySpace, #keymap .keySplitSpace";
    } else if (currentKey == '"') {
      highlightKey = `#keymap .keymapKey[data-key*='${currentKey}']`;
    } else {
      highlightKey = `#keymap .keymapKey[data-key*="${currentKey}"]`;
    }

    // console.log("highlighting", highlightKey);

    $(highlightKey).addClass("activeKey");
  } catch (e) {
    if (e instanceof Error) {
      console.log("could not update highlighted keymap key: " + e.message);
    }
  }
}

export async function flashKey(key: string, correct: boolean): Promise<void> {
  if (key == undefined) return;
  //console.log("key", key);
  if (key == " ") {
    key = "#keymap .keySpace, #keymap .keySplitSpace";
  } else if (key == '"') {
    key = `#keymap .keymapKey[data-key*='${key}']`;
  } else {
    key = `#keymap .keymapKey[data-key*="${key}"]`;
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
  $("#keymap").addClass("hidden");
}

export function show(): void {
  $("#keymap").removeClass("hidden");
}

export async function refresh(
  layoutName: string = Config.layout
): Promise<void> {
  if (Config.keymapMode === "off") return;
  if (ActivePage.get() !== "test") return;
  if (!layoutName) return;
  try {
    let layouts;
    try {
      layouts = await Misc.getLayoutsList();
    } catch (e) {
      Notifications.add(
        Misc.createErrorMessage(e, "Failed to refresh keymap"),
        -1
      );
      return;
    }

    let lts = layouts[layoutName]; //layout to show
    let layoutString = layoutName;
    if (Config.keymapLayout === "overrideSync") {
      if (Config.layout === "default") {
        lts = layouts["qwerty"];
        layoutString = "default";
      } else {
        lts = layouts[Config.layout as keyof typeof layouts];
        layoutString = Config.layout;
      }
    } else {
      lts = layouts[Config.keymapLayout as keyof typeof layouts];
      layoutString = Config.keymapLayout;
    }

    const showTopRow =
      Config.keymapShowTopRow === "always" ||
      ((lts as typeof layouts["qwerty"]).keymapShowTopRow &&
        Config.keymapShowTopRow !== "never");

    const isMatrix =
      Config.keymapStyle === "matrix" || Config.keymapStyle === "split_matrix";

    let keymapElement = "";

    (Object.keys(lts.keys) as (keyof MonkeyTypes.Keys)[]).forEach(
      (row, index) => {
        let rowKeys = lts.keys[row];
        if (
          row === "row1" &&
          (isMatrix || Config.keymapStyle === "staggered")
        ) {
          rowKeys = rowKeys.slice(1);
        }
        let rowElement = "";
        if (row === "row1" && !showTopRow) {
          return;
        }

        if ((row === "row2" || row === "row3" || row === "row4") && !isMatrix) {
          rowElement += "<div></div>";
        }

        if (row === "row4" && lts.type !== "iso" && !isMatrix) {
          rowElement += "<div></div>";
        }

        if (row === "row5") {
          const layoutDisplay = layoutString.replace(/_/g, " ");
          let letterStyle = "";
          if (Config.keymapLegendStyle === "blank") {
            letterStyle = `style="display: none;"`;
          }
          rowElement += "<div></div>";
          rowElement += `<div class="keymapKey keySpace">
          <div class="letter" ${letterStyle}>${layoutDisplay}</div>
        </div>`;
          rowElement += `<div class="keymapSplitSpacer"></div>`;
          rowElement += `<div class="keymapKey keySplitSpace">
          <div class="letter"></div>
        </div>`;
        } else {
          for (let i = 0; i < rowKeys.length; i++) {
            if (row === "row2" && i === 12) continue;
            if (
              (Config.keymapStyle === "matrix" ||
                Config.keymapStyle === "split_matrix") &&
              i >= 10
            ) {
              continue;
            }
            const key = rowKeys[i];
            const bump = row === "row3" && (i === 3 || i === 6) ? true : false;
            let keyDisplay = key[0];
            let letterStyle = "";
            if (Config.keymapLegendStyle === "blank") {
              letterStyle = `style="display: none;"`;
            } else if (Config.keymapLegendStyle === "uppercase") {
              keyDisplay = keyDisplay.toUpperCase();
            }
            let hide = "";
            if (
              row === "row1" &&
              i === 0 &&
              !isMatrix &&
              Config.keymapStyle !== "staggered"
            ) {
              hide = ` invisible`;
            }

            const keyElement = `<div class="keymapKey${hide}" data-key="${key.replace(
              '"',
              "&quot;"
            )}">
              <span class="letter" ${letterStyle}>${keyDisplay}</span>
              ${bump ? "<div class='bump'></div>" : ""}
          </div>`;

            let splitSpacer = "";
            if (
              Config.keymapStyle === "split" ||
              Config.keymapStyle === "split_matrix" ||
              Config.keymapStyle === "alice"
            ) {
              if (
                row === "row4" &&
                (Config.keymapStyle === "split" ||
                  Config.keymapStyle === "alice") &&
                lts.type === "iso"
              ) {
                if (i === 6) {
                  splitSpacer += `<div class="keymapSplitSpacer"></div>`;
                }
              } else if (
                row === "row1" &&
                (Config.keymapStyle === "split" ||
                  Config.keymapStyle === "alice")
              ) {
                if (i === 7) {
                  splitSpacer += `<div class="keymapSplitSpacer"></div>`;
                }
              } else {
                if (i === 5) {
                  splitSpacer += `<div class="keymapSplitSpacer"></div>`;
                }
              }
            }

            if (Config.keymapStyle === "alice" && row === "row4") {
              if (
                (lts.type === "iso" && i === 6) ||
                (lts.type !== "iso" && i === 5)
              ) {
                splitSpacer += `<div class="extraKey"><span class="letter"></span></div>`;
              }
            }

            rowElement += splitSpacer + keyElement;
          }
        }

        keymapElement += `<div class="row r${index + 1}">${rowElement}</div>`;
      }
    );

    $("#keymap").html(keymapElement);

    $("#keymap").removeClass("staggered");
    $("#keymap").removeClass("matrix");
    $("#keymap").removeClass("split");
    $("#keymap").removeClass("split_matrix");
    $("#keymap").removeClass("alice");
    $("#keymap").addClass(Config.keymapStyle);
  } catch (e) {
    if (e instanceof Error) {
      console.log(
        "something went wrong when changing layout, resettings: " + e.message
      );
      // UpdateConfig.setKeymapLayout("qwerty", true);
    }
  }
}

ConfigEvent.subscribe((eventKey) => {
  if (eventKey === "layout" && Config.keymapLayout === "overrideSync") {
    refresh(Config.keymapLayout);
  }
  if (
    eventKey === "keymapLayout" ||
    eventKey === "keymapStyle" ||
    eventKey === "keymapShowTopRow" ||
    eventKey === "keymapMode"
  ) {
    refresh();
  }
});
