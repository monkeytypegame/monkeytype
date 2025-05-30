import Config from "../config";
import * as ThemeColors from "./theme-colors";
import * as SlowTimer from "../states/slow-timer";
import * as ConfigEvent from "../observables/config-event";
import * as KeymapEvent from "../observables/keymap-event";
import * as Misc from "../utils/misc";
import * as JSONData from "../utils/json-data";
import * as Hangul from "hangul-js";
import * as Notifications from "../elements/notifications";
import * as ActivePage from "../states/active-page";
import * as TestWords from "../test/test-words";
import { capsState } from "../test/caps-warning";
import * as ShiftTracker from "../test/shift-tracker";
import * as AltTracker from "../test/alt-tracker";
import * as KeyConverter from "../utils/key-converter";
import { getActiveFunboxNames } from "../test/funbox/list";

const stenoKeys: JSONData.Layout = {
  keymapShowTopRow: true,
  type: "matrix",
  keys: {
    row1: [],
    row2: ["sS", "tT", "pP", "hH", "**", "fF", "pP", "lL", "tT", "dD"],
    row3: ["sS", "kK", "wW", "rR", "**", "rR", "bB", "gG", "sS", "zZ"],
    row4: ["aA", "oO", "eE", "uU"],
    row5: [],
  },
};

function highlightKey(currentKey: string): void {
  if (Config.mode === "zen") return;
  if (currentKey === "") currentKey = " ";
  try {
    $(".activeKey").removeClass("activeKey");

    let highlightKey;
    if (Config.language.startsWith("korean")) {
      currentKey = Hangul.disassemble(currentKey)[0] ?? currentKey;
    }
    if (currentKey === " ") {
      highlightKey = "#keymap .keySpace";
    } else if (currentKey === '"') {
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

async function flashKey(key: string, correct?: boolean): Promise<void> {
  if (key === undefined) return;
  //console.log("key", key);
  if (key === " ") {
    key = "#keymap .keySpace";
  } else if (key === '"') {
    key = `#keymap .keymapKey[data-key*='${key}']`;
  } else {
    key = `#keymap .keymapKey[data-key*="${key}"]`;
  }

  const themecolors = await ThemeColors.getAll();

  try {
    let css = {
      color: themecolors.bg,
      backgroundColor: themecolors.sub,
      borderColor: themecolors.sub,
    };

    if (correct || Config.blindMode) {
      css = {
        color: themecolors.bg,
        backgroundColor: themecolors.main,
        borderColor: themecolors.main,
      };
    } else {
      css = {
        color: themecolors.bg,
        backgroundColor: themecolors.error,
        borderColor: themecolors.error,
      };
    }

    $(key)
      .stop(true, true)
      .css(css)
      .animate(
        {
          color: themecolors.sub,
          backgroundColor: themecolors.subAlt,
          borderColor: themecolors.sub,
        },
        SlowTimer.get() ? 0 : 500,
        "easeOutExpo"
      );
  } catch (e) {}
}

export function hide(): void {
  $("#keymap").addClass("hidden");
}

export function show(): void {
  $("#keymap").removeClass("hidden");
}

function buildRow(options: {
  layoutData: JSONData.Layout;
  rowId: string;
  rowKeys: string[];
  layoutNameDisplayString: string;
  showTopRow: boolean;
  isMatrix: boolean;
  isSteno: boolean;
  isISO: boolean;
  isAlice: boolean;
}): string {
  const {
    layoutData,
    rowId,
    isMatrix,
    showTopRow,
    isSteno,
    isISO,
    layoutNameDisplayString,
    isAlice,
  } = options;
  let { rowKeys } = options;

  let hasAlphas = false;
  let r5Grid = "";
  let rowHtml = "";
  let keysHtml = "";

  if (rowId === "row1" && (isMatrix || Config.keymapStyle === "staggered")) {
    rowKeys = rowKeys.slice(1);
  }
  if (rowId === "row1" && (!showTopRow || isSteno)) {
    return "";
  }

  if (
    (rowId === "row2" || rowId === "row3" || rowId === "row4") &&
    !isMatrix &&
    !isSteno
  ) {
    keysHtml += "<div></div>";
  }

  if (rowId === "row4" && !isISO && !isMatrix && !isSteno) {
    keysHtml += "<div></div>";
  }

  if (isMatrix) {
    if (rowId !== "row5" && layoutData.matrixShowRightColumn) {
      keysHtml += `<div class="keymapKey"></div>`;
    } else {
      keysHtml += `<div></div>`;
    }
  }

  if (rowId === "row5") {
    if (isSteno) return "";
    let layoutDisplay = layoutNameDisplayString.replace(/_/g, " ");
    let letterStyle = "";
    if (Config.keymapLegendStyle === "blank") {
      letterStyle = `style="display: none;"`;
    }
    /* ROW 5 in alternate keymaps allow for alphas in thumb keys.
     * These keymaps MUST include two keys in row 5,
     * an alpha and a space, or a space and an alpha.
     * Alpha key is rendered with the regular alpha size.
     * Layout name is automatically added in the space key.
     * Visual keymap will be:
     * 1-3 for 1 alpha and 1 space
     * 3-1 for 1 space and 1 alpha
     * Together with the data-row5-has-alpha="true",
     * these two will be used to edit the CSS grid layout.
     * 3-3 for two spaces of size 3. This will not be used to edit CSS,
     * since it means a traditional layout, can keep current CSS grid.
     * It is just created for simplicity in the for loop below.
     * */
    // If only one space, add another
    if (rowKeys.length === 1 && rowKeys[0] === " ") {
      rowKeys[1] = rowKeys[0];
    }
    // If only one alpha, add one space and place it on the left
    if (rowKeys.length === 1 && rowKeys[0] !== " ") {
      rowKeys[1] = " ";
      rowKeys.reverse();
    }
    // If two alphas equal, replace one with a space on the left
    if (rowKeys.length > 1 && rowKeys[0] !== " " && rowKeys[0] === rowKeys[1]) {
      rowKeys[0] = " ";
    }
    const alphas = (v: string): boolean => v !== " ";
    hasAlphas = rowKeys.some(alphas);

    keysHtml += "<div></div>";

    for (let keyId = 0; keyId < rowKeys.length; keyId++) {
      const key = rowKeys[keyId] as string;
      let keyDisplay = key[0] as string;
      if (Config.keymapLegendStyle === "uppercase") {
        keyDisplay = keyDisplay.toUpperCase();
      }
      const keyVisualValue = key.replace('"', "&quot;");
      // these are used to keep grid layout but magically hide keys using opacity:
      let side = keyId < 1 ? "left" : "right";
      // we won't use this trick for alternate layouts, unless Alice (for rotation):
      if (hasAlphas && !isAlice) side = "";
      if (keyId === 1) {
        keysHtml += `<div class="keymapSplitSpacer"></div>`;
        r5Grid += "-";
      }
      if (keyVisualValue === " ") {
        keysHtml += `<div class="keymapKey keySpace layoutIndicator ${side}">
              <div class="letter" ${letterStyle}>${layoutDisplay}</div>
            </div>`;
        r5Grid += "3";
        // potential second space in next loop iterations will be empty:
        layoutDisplay = "";
      } else {
        keysHtml += `<div class="keymapKey ${side}">
              <div class="letter">${keyDisplay}</div>
            </div>`;
        r5Grid += "1";
      }
    }
  } else {
    for (let keyId = 0; keyId < rowKeys.length; keyId++) {
      if (rowId === "row2" && keyId === 12) continue;
      if (rowId === "row4" && isMatrix && isISO && keyId === 0) continue;

      let colLimit = 10;
      if (layoutData.matrixShowRightColumn) {
        colLimit = 11;
      }
      if (rowId === "row4" && isMatrix && isISO) {
        colLimit += 1;
      }

      if (
        (Config.keymapStyle === "matrix" ||
          Config.keymapStyle === "split_matrix") &&
        keyId >= colLimit
      ) {
        continue;
      }

      const key = rowKeys[keyId] as string;
      const bump = rowId === "row3" && (keyId === 3 || keyId === 6);
      let keyDisplay = key[0] as string;
      let letterStyle = "";

      if (Config.keymapLegendStyle === "blank") {
        letterStyle = `style="display: none;"`;
      } else if (Config.keymapLegendStyle === "uppercase") {
        keyDisplay = keyDisplay.toUpperCase();
      }

      let hide = "";
      if (
        rowId === "row1" &&
        keyId === 0 &&
        !isMatrix &&
        Config.keymapStyle !== "staggered"
      ) {
        hide = ` invisible`;
      }

      const keyElement = `<div class="keymapKey${hide}" data-key="${key.replace(
        '"',
        "&quot;"
      )}"><span class="letter" ${letterStyle}>${keyDisplay}</span>${
        bump ? "<div class='bump'></div>" : ""
      }</div>`;

      let splitSpacer = "";
      if (
        Config.keymapStyle === "split" ||
        Config.keymapStyle === "split_matrix" ||
        Config.keymapStyle === "alice" ||
        isSteno
      ) {
        if (
          rowId === "row4" &&
          isSteno &&
          (keyId === 0 || keyId === 2 || keyId === 4)
        ) {
          splitSpacer += `<div class="keymapSplitSpacer"></div>`;
        } else if (
          rowId === "row4" &&
          (Config.keymapStyle === "split" || Config.keymapStyle === "alice") &&
          isISO
        ) {
          if (keyId === 6) {
            splitSpacer += `<div class="keymapSplitSpacer"></div>`;
          }
        } else if (
          rowId === "row1" &&
          (Config.keymapStyle === "split" || Config.keymapStyle === "alice")
        ) {
          if (keyId === 7) {
            splitSpacer += `<div class="keymapSplitSpacer"></div>`;
          }
        } else if (rowId === "row4" && isMatrix && isISO) {
          if (keyId === 6) {
            splitSpacer += `<div class="keymapSplitSpacer"></div>`;
          }
        } else {
          if (keyId === 5) {
            splitSpacer += `<div class="keymapSplitSpacer"></div>`;
          }
        }
      }

      if (Config.keymapStyle === "alice" && rowId === "row4") {
        if ((isISO && keyId === 6) || (!isISO && keyId === 5)) {
          splitSpacer += `<div class="extraKey"><span class="letter"></span></div>`;
        }
      }

      keysHtml += splitSpacer + keyElement;
    }
  }

  if (rowId === "row5") {
    rowHtml += `<div
          class="row r5"
          data-row5-grid="${r5Grid}"
          data-row5-has-alpha="${hasAlphas}"
        >${keysHtml}</div>`;
  } else {
    const rowIndex = parseInt(rowId.replace("row", ""));
    rowHtml += `<div class="row r${rowIndex}">${keysHtml}</div>`;
  }

  return rowHtml;
}

export async function refresh(
  layoutName: string = Config.layout
): Promise<void> {
  if (Config.keymapMode === "off") return;
  if (ActivePage.get() !== "test") return;
  if (!layoutName) return;
  try {
    let layoutNameDisplayString = layoutName;
    let layoutData: JSONData.Layout;
    try {
      if (Config.keymapLayout === "overrideSync") {
        if (Config.layout === "default") {
          layoutData = await JSONData.getLayout("qwerty");
          layoutNameDisplayString = "default";
        } else {
          layoutData = await JSONData.getLayout(Config.layout);
          layoutNameDisplayString = Config.layout;
        }
      } else {
        layoutData = await JSONData.getLayout(Config.keymapLayout);
        layoutNameDisplayString = Config.keymapLayout;
      }
    } catch (e) {
      Notifications.add(
        Misc.createErrorMessage(e, `Failed to load keymap ${layoutName}`),
        -1
      );
      return;
    }

    const showTopRow =
      (TestWords.hasNumbers && Config.keymapMode === "next") ||
      Config.keymapShowTopRow === "always" ||
      (layoutData.keymapShowTopRow && Config.keymapShowTopRow !== "never");

    const isMatrix =
      Config.keymapStyle === "matrix" || Config.keymapStyle === "split_matrix";

    const isSteno =
      Config.keymapStyle === "steno" || Config.keymapStyle === "steno_matrix";

    const isAlice = Config.keymapStyle === "alice";

    if (isSteno) {
      layoutData = stenoKeys;
    }

    const funbox = getActiveFunboxNames().includes("layout_mirror");
    if (funbox) {
      layoutData = KeyConverter.mirrorLayoutKeys(layoutData);
    }

    const isISO = layoutData.type === "iso";

    let keymapElement = "";
    for (const [rowId, rowKeys] of Object.entries(layoutData.keys)) {
      keymapElement += buildRow({
        layoutData,
        rowId,
        rowKeys,
        isMatrix,
        showTopRow,
        isSteno,
        isISO,
        layoutNameDisplayString,
        isAlice,
      });
    }

    $("#keymap").html(keymapElement);

    $("#keymap").removeClass("staggered");
    $("#keymap").removeClass("matrix");
    $("#keymap").removeClass("split");
    $("#keymap").removeClass("split_matrix");
    $("#keymap").removeClass("alice");
    $("#keymap").removeClass("steno");
    $("#keymap").removeClass("steno_matrix");
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

const isMacLike = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
const symbolsPattern = /^[^\p{L}\p{N}]{1}$/u;
type KeymapLegendStates = [letters: 0 | 1 | 2 | 3, symbols: 0 | 1 | 2 | 3];
let keymapLegendStates: KeymapLegendStates = [0, 0];

function getLegendStates(): KeymapLegendStates | undefined {
  // MacOS has different CapsLock and Shift logic than other operating systems
  // Windows and Linux only capitalize letters if either Shift OR CapsLock are
  // pressed, but not both at once.
  // MacOS instead capitalizes when either or both are pressed,
  // so we have to check for that.
  const shiftState = ShiftTracker.leftState || ShiftTracker.rightState;
  const altState = AltTracker.leftState || AltTracker.rightState;

  const osDependentLettersState = isMacLike
    ? shiftState || capsState
    : shiftState !== capsState;

  const lettersState = (osDependentLettersState ? 1 : 0) + (altState ? 2 : 0);
  const symbolsState = (shiftState ? 1 : 0) + (altState ? 2 : 0);

  const [previousLettersState, previousSymbolsState] = keymapLegendStates;

  if (
    previousLettersState === lettersState &&
    previousSymbolsState === symbolsState
  ) {
    return;
  }

  keymapLegendStates = [
    lettersState as 0 | 1 | 2 | 3,
    symbolsState as 0 | 1 | 2 | 3,
  ];
  return keymapLegendStates;
}

async function updateLegends(): Promise<void> {
  const states = getLegendStates();
  if (states === undefined) return;

  const keymapKeys = [...document.getElementsByClassName("keymapKey")].filter(
    (el) => {
      const isKeymapKey = el.classList.contains("keymapKey");
      const isNotSpace = !el.classList.contains("keySpace");

      return isKeymapKey && isNotSpace;
    }
  ) as HTMLElement[];

  const layoutKeys = keymapKeys.map((el) => el.dataset["key"]);
  if (layoutKeys.includes(undefined)) return;

  const keys = keymapKeys.map((el) => el.childNodes[0]);

  const [lettersState, symbolsState] = states;

  const layoutName =
    Config.keymapLayout === "overrideSync"
      ? Config.layout === "default"
        ? "qwerty"
        : Config.layout
      : Config.keymapLayout;

  const layout = await JSONData.getLayout(layoutName).catch(() => undefined);
  if (layout === undefined) {
    Notifications.add("Failed to load keymap layout", -1);

    return;
  }

  for (let i = 0; i < layoutKeys.length; i++) {
    const layoutKey = layoutKeys[i] as string;
    const key = keys[i];
    const lowerCaseCharacter = layoutKey[0];
    const upperCaseCharacter = layoutKey[1];

    if (
      key === undefined ||
      layoutKey === undefined ||
      lowerCaseCharacter === undefined ||
      upperCaseCharacter === undefined
    )
      continue;

    const keyIsSymbol = [lowerCaseCharacter, upperCaseCharacter].some(
      (character) => symbolsPattern.test(character ?? "")
    );

    const keycode = KeyConverter.layoutKeyToKeycode(lowerCaseCharacter, layout);
    if (keycode === undefined) {
      return;
    }
    const oppositeShift = ShiftTracker.isUsingOppositeShift(keycode);

    const state = keyIsSymbol ? symbolsState : lettersState;
    const characterIndex = oppositeShift ? state : 0;

    //if the character at the index is undefined, try without alt
    const character =
      layoutKey[characterIndex] ?? layoutKey[characterIndex - 2];

    key.textContent = character ?? "";
  }
}

ConfigEvent.subscribe((eventKey, newValue) => {
  if (eventKey === "layout" && Config.keymapLayout === "overrideSync") {
    void refresh(Config.keymapLayout);
  }
  if (
    eventKey === "keymapLayout" ||
    eventKey === "keymapStyle" ||
    eventKey === "keymapShowTopRow" ||
    eventKey === "keymapMode"
  ) {
    void refresh();
  }
  if (eventKey === "keymapMode") {
    newValue === "off" ? hide() : show();
  }
});

KeymapEvent.subscribe((mode, key, correct) => {
  if (mode === "highlight") {
    highlightKey(key);
  }
  if (mode === "flash") {
    void flashKey(key, correct);
  }
});

$(document).on("keydown", (e) => {
  if (
    Config.keymapLegendStyle === "dynamic" &&
    (e.code === "ShiftLeft" ||
      e.code === "ShiftRight" ||
      e.code === "AltRight" ||
      e.code === "AltLeft")
  ) {
    void updateLegends();
  }
});

$(document).on("keyup", (e) => {
  if (
    Config.keymapLegendStyle === "dynamic" &&
    (e.code === "ShiftLeft" ||
      e.code === "ShiftRight" ||
      e.code === "AltRight" ||
      e.code === "AltLeft")
  ) {
    void updateLegends();
  }
});
