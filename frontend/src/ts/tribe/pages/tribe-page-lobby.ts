import * as TribeState from "../tribe-state";
import * as TribeUserList from "../tribe-user-list";
import * as TribeButtons from "../tribe-buttons";
import tribeSocket from "../tribe-socket";
import { RoomConfig } from "../types";
import { configMetadata } from "../../config-metadata";
import { qsa, qsr } from "../../utils/dom";
import { SimpleModal } from "../../elements/simple-modal";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../stores/notifications";

const configButtonEls = qsa(
  ".pageTribe .tribePage.lobby .currentConfig button",
);
const roomCodeEls = qsa(
  ".pageTribe .tribePage.lobby .inviteLink .code .text, .pageTest #result #tribeResultBottom .inviteLink .code .text",
);
const roomLinkEls = qsa(
  ".pageTribe .tribePage.lobby .inviteLink .link, .pageTest #result #tribeResultBottom .inviteLink .link",
);
const visibilityButtonEl = qsr(
  ".pageTribe .tribePage.lobby .visibilityAndName .visibility button",
);
const visibilityTextEl = qsr(
  ".pageTribe .tribePage.lobby .visibilityAndName .visibility .text",
);
const roomNameButtonEl = qsr(
  ".pageTribe .tribePage.lobby .visibilityAndName .roomName button",
);
const roomNameTextEl = qsr(
  ".pageTribe .tribePage.lobby .visibilityAndName .roomName .text",
);
const currentConfigGroupEls = qsr(
  ".pageTribe .tribePage.lobby .currentConfig .groups",
);

export function reset(): void {
  roomCodeEls.setText("");
  roomLinkEls.setText("");
}

export function disableConfigButtons(): void {
  configButtonEls.disable();
}

export function enableConfigButtons(): void {
  configButtonEls.enable();
}

export function disableNameVisibilityButtons(): void {
  visibilityButtonEl.disable();
  roomNameButtonEl.disable();
}

export function enableNameVisibilityButtons(): void {
  visibilityButtonEl.enable();
  roomNameButtonEl.enable();
}

export function updateVisibility(): void {
  if (TribeState.getSelf()?.isLeader) {
    visibilityButtonEl.show();
  } else {
    visibilityButtonEl.hide();
  }
  if (TribeState.getRoom()?.isPrivate) {
    visibilityTextEl.setText("private");
    visibilityButtonEl.setHtml(`<i class="fa fa-fw fa-lock"></i>`);
  } else {
    visibilityTextEl.setText("public");
    visibilityButtonEl.setHtml(`<i class="fa fa-fw fa-lock-open"></i>`);
  }
}

export function updateRoomName(): void {
  if (TribeState.getSelf()?.isLeader) {
    roomNameButtonEl.show();
  } else {
    roomNameButtonEl.hide();
  }
  roomNameTextEl.setText(TribeState.getRoom()?.name ?? "");
}

type RoomConfigToDisplay = Omit<
  RoomConfig,
  "minWpmCustomSpeed" | "minAccCustom" | "minBurstCustomSpeed"
>;

const configOrder: Record<
  keyof RoomConfigToDisplay,
  {
    commandsKey: string;
    icon: string;
    label: string;
    text: (config: RoomConfig) => string;
    showIf?: (config: RoomConfig) => boolean;
  }
> = {
  mode: {
    commandsKey: "mode",
    icon: "fas fa-bars",
    label: "Mode",
    text: (config) => config.mode,
  },
  words: {
    commandsKey: "words",
    icon: "fas fa-font",
    label: "Words",
    text: (config) => String(config.words),
    showIf: (config) => config.mode === "words",
  },
  time: {
    commandsKey: "time",
    icon: "fas fa-clock",
    label: "Time",
    text: (config) => String(config.time) + "s",
    showIf: (config) => config.mode === "time",
  },
  quoteLength: {
    commandsKey: "quoteLength",
    icon: "fas fa-quote-right",
    label: "Quote length",
    text: (config) => {
      if (config.quoteLength.length === 4) {
        return "any";
      } else {
        let quoteLengthString = "";
        config.quoteLength.forEach((ql: number) => {
          if (ql === 0) {
            quoteLengthString += "short,";
          } else if (ql === 1) {
            quoteLengthString += "medium,";
          } else if (ql === 2) {
            quoteLengthString += "long,";
          } else if (ql === 3) {
            quoteLengthString += "thicc,";
          }
        });
        return quoteLengthString.slice(0, -1);
      }
    },
    showIf: (config) => config.mode === "quote",
  },
  customText: {
    commandsKey: "customText",
    icon: "fas fa-tools",
    label: "Custom Text",
    text: () => {
      return "custom";
    },
    //todo: show more info
    showIf: (config) => config.mode === "custom",
  },
  difficulty: {
    commandsKey: "difficulty",
    icon: "fas fa-star",
    label: "Difficulty",
    text: (config) => config.difficulty,
  },
  language: {
    commandsKey: "languages",
    icon: "fas fa-globe-americas",
    label: "Language",
    text: (config) => config.language,
  },
  punctuation: {
    commandsKey: "punctuation",
    icon: "fas fa-at",
    label: "Punctuation",
    text: (config) => (config.punctuation ? "on" : "off"),
  },
  numbers: {
    commandsKey: "numbers",
    icon: "fas fa-hashtag",
    label: "Numbers",
    text: (config) => (config.numbers ? "on" : "off"),
  },
  funbox: {
    commandsKey: "funbox",
    icon: "fas fa-gamepad",
    label: "Funbox",
    text: (config) =>
      config.funbox.length > 0
        ? config.funbox.join(", ").replace(/_/g, " ")
        : "none",
  },
  lazyMode: {
    commandsKey: "lazyMode",
    icon: "fas fa-couch",
    label: "Lazy mode",
    text: (config) => (config.lazyMode ? "on" : "off"),
  },
  stopOnError: {
    commandsKey: "stopOnError",
    icon: "fas fa-hand-paper",
    label: "Stop on error",
    text: (config) =>
      config.stopOnError === "off" ? "off" : `stop on ${config.stopOnError}`,
  },
  minWpm: {
    commandsKey: "minWpm",
    icon: "fas fa-bomb",
    label: "Min Wpm",
    text: (config) =>
      config.minWpm === "off" ? "off" : `min ${config.minWpmCustomSpeed} wpm`,
  },
  minAcc: {
    commandsKey: "minAcc",
    icon: "fas fa-bomb",
    label: "Min Acc",
    text: (config) =>
      config.minAcc === "off" ? "off" : `min ${config.minAccCustom}%`,
  },
  minBurst: {
    commandsKey: "minBurst",
    icon: "fas fa-bomb",
    label: "Min Burst",
    text: (config) =>
      config.minBurst === "off"
        ? "off"
        : `min ${config.minBurstCustomSpeed} wpm`,
  },
  customLayoutfluid: {
    commandsKey: "customLayoutfluid",
    icon: "fas fa-th-large",
    label: "Custom Layout Fluid",
    text: (config) => config.customLayoutfluid.join(","),
    showIf: (config) => config.funbox.includes("layoutfluid"),
  },
  customPolyglot: {
    commandsKey: "customPolyglot",
    icon: "fas fa-language",
    label: "Custom Polyglot",
    text: (config) => config.customPolyglot.join(","),
    showIf: (config) => config.funbox.includes("polyglot"),
  },
  // strictSpace: {
  //   commandsKey: "strictSpace",
  //   icon: "fas fa-arrows-alt-h",
  //   label: "Strict Space",
  //   text: (config) => (config.strictSpace ? "on" : "off"),
  // },
  // confidenceMode: {
  //   commandsKey: "confidenceMode",
  //   icon: "fas fa-check-circle",
  //   label: "Confidence Mode",
  //   text: (config) => (config.confidenceMode ? "on" : "off"),
  // },
} as const;

export function updateRoomConfig(): void {
  const room = TribeState.getRoom();
  if (!room) return;
  currentConfigGroupEls.empty();

  let html = ``;
  for (const [key, value] of Object.entries(configOrder)) {
    if (value.showIf && !value.showIf(room.config)) continue;

    // @ts-expect-error ok for now
    // oxlint-disable-next-line no-unsafe-assignment no-unsafe-member-access
    const icon = configMetadata[key].icon;

    html += `
    <button class='text group' aria-label="${value.label}" data-balloon-pos="up" data-commands-key="${value.commandsKey}">
    <i class="fas ${icon}"></i>${value.text(room.config)}
    </button>
    `;
  }

  currentConfigGroupEls.setHtml(html);
}

export async function init(): Promise<void> {
  const room = TribeState.getRoom();
  if (!room) return;
  reset();
  const link = location.origin + "/tribe/" + room.id;
  roomCodeEls.setText(room.id);
  roomLinkEls.setText(link);

  TribeUserList.update("lobby");
  TribeButtons.update();
  updateVisibility();
  updateRoomName();
  updateRoomConfig();
  enableConfigButtons();
  enableNameVisibilityButtons();
}

roomCodeEls
  .on("mouseenter", function (e) {
    if (e.currentTarget !== null) {
      (e.currentTarget as HTMLElement).style.color =
        "#" + (e.currentTarget as HTMLElement).innerText;
    }
  })
  .on("mouseleave", function (e) {
    if (e.currentTarget !== null) {
      (e.currentTarget as HTMLElement).style.color = "";
    }
  });

roomLinkEls.on("click", async () => {
  try {
    await navigator.clipboard.writeText(roomLinkEls[0]?.native.innerText ?? "");
    showSuccessNotification("Code copied");
  } catch (e) {
    showErrorNotification("Could not copy to clipboard: " + String(e));
  }
});

visibilityButtonEl.on("click", () => {
  tribeSocket.out.room.toggleVisibility();
});

roomNameButtonEl.on("click", () => {
  roomNameModal.show([], {});
});

const roomNameModal = new SimpleModal({
  id: "tribeRoomNameModal",
  title: "Change Room Name",
  buttonText: "Save",
  inputs: [
    {
      type: "text",
      placeholder: "New room name",
    },
  ],
  execFn: async (_modal, newName) => {
    if (newName === null || newName.trim() === "") {
      return {
        status: "error",
        message: "Room name cannot be empty",
      };
    }
    tribeSocket.out.room.updateName(newName.trim());
    return {
      status: "success",
      message: "Room name changed",
      showNotification: false,
    };
  },
});
