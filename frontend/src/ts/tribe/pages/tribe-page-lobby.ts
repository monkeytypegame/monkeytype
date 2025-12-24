import * as TribeState from "../tribe-state";
import * as Notifications from "../../elements/notifications";
import * as TribeChat from "../tribe-chat";
import * as TribeConfig from "../tribe-config";
import * as TribeUserList from "../tribe-user-list";
import * as TribeButtons from "../tribe-buttons";
import tribeSocket from "../tribe-socket";
import { RoomConfig } from "../types";
import { configMetadata } from "../../config-metadata";

export function reset(): void {
  $(".pageTribe .tribePage.lobby .userlist .list").empty();
  $(".pageTribe .tribePage.lobby .inviteLink .code .text").text("");
  $(".pageTribe .tribePage.lobby .inviteLink .link").text("");
  $(".pageTest #result #tribeResultBottom .inviteLink .code .text").text("");
  $(".pageTest #result #tribeResultBottom .inviteLink .link").text("");
  TribeChat.reset();
}

export function disableConfigButtons(): void {
  $(".pageTribe .tribePage.lobby .currentConfig .groups .group").addClass(
    "disabled",
  );
}

export function enableConfigButtons(): void {
  $(".pageTribe .tribePage.lobby .currentConfig .groups .group").removeClass(
    "disabled",
  );
}

export function disableNameVisibilityButtons(): void {
  $(
    ".pageTribe .tribePage.lobby .visibilityAndName .roomName .textButton",
  ).addClass("disabled");
  $(
    ".pageTribe .tribePage.lobby .visibilityAndName .visibility .textButton",
  ).addClass("disabled");
}

export function enableNameVisibilityButtons(): void {
  $(
    ".pageTribe .tribePage.lobby .visibilityAndName .roomName .textButton",
  ).removeClass("disabled");
  $(
    ".pageTribe .tribePage.lobby .visibilityAndName .visibility .textButton",
  ).removeClass("disabled");
}

export function updateVisibility(): void {
  if (TribeState.getSelf()?.isLeader) {
    $(
      ".pageTribe .tribePage.lobby .visibilityAndName .visibility .textButton",
    ).removeClass("hidden");
  } else {
    $(
      ".pageTribe .tribePage.lobby .visibilityAndName .visibility .textButton",
    ).addClass("hidden");
  }
  if (TribeState.getRoom()?.isPrivate) {
    $(".pageTribe .tribePage.lobby .visibilityAndName .visibility .text").text(
      "private",
    );
    $(
      ".pageTribe .tribePage.lobby .visibilityAndName .visibility .textButton",
    ).html(`<i class="fa fa-fw fa-lock"></i>`);
  } else {
    $(".pageTribe .tribePage.lobby .visibilityAndName .visibility .text").text(
      "public",
    );
    $(
      ".pageTribe .tribePage.lobby .visibilityAndName .visibility .textButton",
    ).html(`<i class="fa fa-fw fa-lock-open"></i>`);
  }
}

export function updateRoomName(): void {
  if (TribeState.getSelf()?.isLeader) {
    $(
      ".pageTribe .tribePage.lobby .visibilityAndName .roomName .textButton",
    ).removeClass("hidden");
  } else {
    $(
      ".pageTribe .tribePage.lobby .visibilityAndName .roomName .textButton",
    ).addClass("hidden");
  }
  $(".pageTribe .tribePage.lobby .visibilityAndName .roomName .text").text(
    TribeState.getRoom()?.name ?? "",
  );
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
  strictSpace: {
    commandsKey: "strictSpace",
    icon: "fas fa-arrows-alt-h",
    label: "Strict Space",
    text: (config) => (config.strictSpace ? "on" : "off"),
  },
  confidenceMode: {
    commandsKey: "confidenceMode",
    icon: "fas fa-check-circle",
    label: "Confidence Mode",
    text: (config) => (config.confidenceMode ? "on" : "off"),
  },
} as const;

export function updateRoomConfig(): void {
  const room = TribeState.getRoom();
  if (!room) return;
  $(".pageTribe .tribePage.lobby .currentConfig .groups").empty();

  for (const [key, value] of Object.entries(configOrder)) {
    if (value.showIf && !value.showIf(room.config)) continue;

    // @ts-expect-error ok for now
    // oxlint-disable-next-line no-unsafe-assignment no-unsafe-member-access
    const icon = configMetadata[key].icon;

    $(".pageTribe .tribePage.lobby .currentConfig .groups").append(`
    <div class='group' aria-label="${value.label}" data-balloon-pos="up" commands="${value.commandsKey}">
    <i class="fas ${icon}"></i>${value.text(room.config)}
    </div>
    `);
  }

  // $(".pageTribe .tribePage.lobby .currentConfig .groups").append(`
  //   <div class='group' aria-label="Mode" data-balloon-pos="up" commands="mode">
  //   <i class="fas fa-bars"></i>${room.config.mode}
  //   </div>
  //   `);

  // if (room.config.mode === "time") {
  //   $(".pageTribe .tribePage.lobby .currentConfig .groups").append(`
  //   <div class='group' aria-label="Time" data-balloon-pos="up" commands="time">
  //   <i class="fas fa-clock"></i>${room.config.time}
  //   </div>
  //   `);
  // } else if (room.config.mode === "words") {
  //   $(".pageTribe .tribePage.lobby .currentConfig .groups").append(`
  //   <div class='group' aria-label="Words" data-balloon-pos="up" commands="words">
  //   <i class="fas fa-font"></i>${room.config.words}
  //   </div>
  //   `);
  // } else if (room.config.mode === "quote") {
  //   let quoteLengthString = "";
  //   if (room.config.quoteLength.length === 4) {
  //     quoteLengthString = "any";
  //   } else {
  //     room.config.quoteLength.forEach((ql: number) => {
  //       if (ql === 0) {
  //         quoteLengthString += "short,";
  //       } else if (ql === 1) {
  //         quoteLengthString += "medium,";
  //       } else if (ql === 2) {
  //         quoteLengthString += "long,";
  //       } else if (ql === 3) {
  //         quoteLengthString += "thicc,";
  //       }
  //     });
  //     quoteLengthString = quoteLengthString.substring(
  //       0,
  //       quoteLengthString.length - 1,
  //     );
  //   }

  //   $(".pageTribe .tribePage.lobby .currentConfig .groups").append(`
  //   <div class='group' aria-label="Quote length" data-balloon-pos="up" commands="quoteLength">
  //   <i class="fas fa-quote-right"></i>${quoteLengthString}
  //   </div>
  //   `);
  // } else if (room.config.mode === "custom") {
  //   let t = "Custom settings:";

  //   t += `\ntext length: ${CustomText.getText().length}`;
  //   //todo
  //   // if (CustomText.isTimeRandom || CustomText.isWordRandom) {
  //   //   let r = "";
  //   //   let n = "";
  //   //   if (CustomText.isTimeRandom) {
  //   //     r = "time";
  //   //     n = CustomText.time.toString();
  //   //   } else if (CustomText.isWordRandom) {
  //   //     r = "words";
  //   //     n = CustomText.word.toString();
  //   //   }
  //   //   t += `\nrandom: ${r} ${n}`;
  //   // }

  //   $(".pageTribe .tribePage.lobby .currentConfig .groups").append(`
  //   <div class='group' aria-label="${t}" data-balloon-pos="up" data-balloon-break command="changeCustomText">
  //   <i class="fas fa-tools"></i>custom
  //   </div>
  //   `);
  // }

  // if (room.config.difficulty === "normal") {
  //   $(".pageTribe .tribePage.lobby .currentConfig .groups").append(`
  //   <div class='group' aria-label="Difficulty" data-balloon-pos="up" commands="difficulty">
  //   <i class="far fa-star"></i>normal
  //   </div>
  //   `);
  // } else if (room.config.difficulty === "expert") {
  //   $(".pageTribe .tribePage.lobby .currentConfig .groups").append(`
  //   <div class='group' aria-label="Difficulty" data-balloon-pos="up" commands="difficulty">
  //   <i class="fas fa-star-half-alt"></i>expert
  //   </div>
  //   `);
  // } else if (room.config.difficulty === "master") {
  //   $(".pageTribe .tribePage.lobby .currentConfig .groups").append(`
  //   <div class='group' aria-label="Difficulty" data-balloon-pos="up" commands="difficulty">
  //   <i class="fas fa-star"></i>master
  //   </div>
  //   `);
  // }

  // $(".pageTribe .tribePage.lobby .currentConfig .groups").append(`
  //   <div class='group' aria-label="Language" data-balloon-pos="up" commands="languages">
  //   <i class="fas fa-globe-americas"></i>${room.config.language}
  //   </div>
  //   `);

  // $(".pageTribe .tribePage.lobby .currentConfig .groups").append(`
  //   <div class='group' aria-label="Punctuation" data-balloon-pos="up" commands="punctuation">
  //   <i class="fas fa-at"></i>${room.config.punctuation ? "on" : "off"}
  //   </div>
  //   `);

  // $(".pageTribe .tribePage.lobby .currentConfig .groups").append(`
  //   <div class='group' aria-label="Numbers" data-balloon-pos="up" commands="numbers">
  //   <i class="fas fa-hashtag"></i>${room.config.numbers ? "on" : "off"}
  //   </div>
  //   `);

  // $(".pageTribe .tribePage.lobby .currentConfig .groups").append(`
  //   <div class='group' aria-label="Funbox" data-balloon-pos="up" commands="funbox">
  //   <i class="fas fa-gamepad"></i>${
  //     room.config.funbox.join(", ").replace(/_/g, " ") || "none"
  //   }
  //   </div>
  //   `);

  // $(".pageTribe .tribePage.lobby .currentConfig .groups").append(`
  //   <div class='group' aria-label="Lazy mode" data-balloon-pos="up" commands="lazyMode">
  //   <i class="fas fa-couch"></i>${room.config.lazyMode ? "on" : "off"}
  //   </div>
  //   `);

  // if (room.config.stopOnError === "off") {
  //   $(".pageTribe .tribePage.lobby .currentConfig .groups").append(`
  //   <div class='group' aria-label="Stop on error" data-balloon-pos="up" commands="stopOnError">
  //   <i class="fas fa-hand-paper"></i>off
  //   </div>
  //   `);
  // } else {
  //   $(".pageTribe .tribePage.lobby .currentConfig .groups").append(`
  //   <div class='group' aria-label="Stop on error" data-balloon-pos="up" commands="stopOnError">
  //   <i class="fas fa-hand-paper"></i>stop on ${room.config.stopOnError}
  //   </div>
  //   `);
  // }

  // $(".pageTribe .tribePage.lobby .currentConfig .groups").append(`
  //   <div class='group' aria-label="Min Wpm" data-balloon-pos="up" commands="minWpm">
  //   <i class="fas fa-bomb"></i>${room.config.minWpm}${
  //     room.config.minWpm !== "off" ? "wpm" : ""
  //   }
  //   </div>
  //   `);

  // $(".pageTribe .tribePage.lobby .currentConfig .groups").append(`
  //   <div class='group' aria-label="Min Acc" data-balloon-pos="up" commands="minAcc">
  //   <i class="fas fa-bomb"></i>${room.config.minAcc}${
  //     room.config.minAcc !== "off" ? "%" : ""
  //   }
  //   </div>
  //   `);

  // $(".pageTribe .tribePage.lobby .currentConfig .groups").append(`
  //   <div class='group' aria-label="Min Burst" data-balloon-pos="up" commands="minBurst">
  //   <i class="fas fa-bomb"></i>${room.config.minBurst}${
  //     room.config.minBurst !== "off" ? "wpm" : ""
  //   }
  //   </div>
  //   `);
}

export async function init(): Promise<void> {
  const room = TribeState.getRoom();
  if (!room) return;
  reset();
  const link = location.origin + "/tribe/" + room.id;
  $(".pageTribe .tribePage.lobby .inviteLink .code .text").text(room.id);
  $(".pageTribe .tribePage.lobby .inviteLink .link").text(link);
  $(".pageTest #result #tribeResultBottom .inviteLink .code .text").text(
    room.id,
  );
  $(".pageTest #result #tribeResultBottom .inviteLink .link").text(link);
  TribeUserList.update("lobby");
  TribeButtons.update("lobby");
  updateVisibility();
  updateRoomName();
  updateRoomConfig();
  enableConfigButtons();
  enableNameVisibilityButtons();
  await TribeConfig.apply(room.config);
}

$(".pageTribe .tribePage.lobby .inviteLink .text")
  .on("mouseenter", function () {
    $(this).css(
      "color",
      "#" + $(".pageTribe .tribePage.lobby .inviteLink .text").text(),
    );
  })
  .on("mouseleave", function () {
    $(this).css("color", "");
  });

$(".pageTest #result #tribeResultBottom .inviteLink .text")
  .on("mouseenter", function () {
    $(this).css(
      "color",
      "#" + $(".pageTest #result #tribeResultBottom .inviteLink .text").text(),
    );
  })
  .on("mouseleave", function () {
    $(this).css("color", "");
  });

$(
  ".pageTribe .tribePage.lobby .inviteLink .text, .pageTest #result #tribeResultBottom .inviteLink .text",
).on("click", async () => {
  try {
    await navigator.clipboard.writeText(
      $(".pageTribe .tribePage.lobby .inviteLink .text").text(),
    );
    Notifications.add("Code copied", 1);
  } catch (e) {
    Notifications.add("Could not copy to clipboard: " + String(e), -1);
  }
});

$(
  ".pageTribe .tribePage.lobby .inviteLink .link, .pageTest #result #tribeResultBottom .inviteLink .link",
).on("click", async () => {
  try {
    await navigator.clipboard.writeText(
      $(".pageTribe .tribePage.lobby .inviteLink .link").text(),
    );
    Notifications.add("Link copied", 1);
  } catch (e) {
    Notifications.add("Could not copy to clipboard: " + String(e), -1);
  }
});

$(".pageTribe .tribePage.lobby .visibilityAndName .visibility .textButton").on(
  "click",
  () => {
    tribeSocket.out.room.toggleVisibility();
  },
);

$(".pageTribe .tribePage.lobby .visibilityAndName .roomName .textButton").on(
  "click",
  () => {
    //TODO proper popup
    const name = prompt("Enter new room name");
    if (name === null) return;
    tribeSocket.out.user.setName(name);
  },
);
