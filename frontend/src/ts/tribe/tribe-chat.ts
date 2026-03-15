import * as TribeState from "../tribe/tribe-state";
import * as Misc from "../utils/misc";
import tribeSocket from "./tribe-socket";
import {
  InputSuggestionEntry,
  InputSuggestions,
} from "../elements/input-suggestions";
import { getEmojiList } from "../utils/json-data";
import * as TribeTypes from "./types";
import { qs, qsa, qsr } from "../utils/dom";
import { getActivePage } from "../signals/core";
import { showNoticeNotification } from "../stores/notifications";

let lastMessageTimestamp = 0;
let shouldScrollChat = true;

const chatHistory: {
  isSystem: boolean;
  socketId: string | undefined;
  message: string;
}[] = [];

const lobbyChatSuggestions1 = new InputSuggestions(
  qsr(".pageTribe .lobby .chat .input input"),
  "@",
  "",
  3,
  0,
  "top",
  ["Enter", "Tab"],
);

const lobbyChatSuggestions2 = new InputSuggestions(
  qsr(".pageTribe .lobby .chat .input input"),
  ":",
  ":",
  3,
  1,
  "top",
  ["Enter", "Tab"],
);

const resultChatSuggestions1 = new InputSuggestions(
  qsr(".pageTest #result #tribeResultBottom .chat .input input"),
  "@",
  "",
  3,
  0,
  "top",
  ["Enter", "Tab"],
);

const resultChatSuggestions2 = new InputSuggestions(
  qsr(".pageTest #result #tribeResultBottom .chat .input input"),
  ":",
  ":",
  3,
  1,
  "top",
  ["Enter", "Tab"],
);

export function isAnyChatSuggestionVisible(): boolean {
  return (
    lobbyChatSuggestions1.isVisible() ||
    lobbyChatSuggestions2.isVisible() ||
    resultChatSuggestions1.isVisible() ||
    resultChatSuggestions2.isVisible()
  );
}

void getEmojiList().then((emojis) => {
  const dataToSet: Record<string, InputSuggestionEntry> = {};
  for (const emoji of emojis) {
    if (emoji.type === "emoji") {
      dataToSet[emoji.from] = {
        display: emoji.from,
        textIcon: emoji.to,
      };
    } else {
      dataToSet[emoji.from] = {
        display: emoji.from,
        imageIcon: emoji.to,
      };
    }
  }
  lobbyChatSuggestions2.setData(dataToSet);
  resultChatSuggestions2.setData(dataToSet);
});

export function updateSuggestionData(): void {
  const users = TribeState.getRoom()?.users;
  if (!users) return;
  const dataToSet: Record<string, InputSuggestionEntry> = {};
  for (const user of Object.values(users)) {
    if (user.id === tribeSocket.getId()) continue;
    dataToSet[user.name] = {
      display: user.name,
      faIcon: "fa-user",
    };
  }
  lobbyChatSuggestions1.setData(dataToSet);
  resultChatSuggestions1.setData(dataToSet);
}

export function reset(where: "lobby" | "result"): void {
  if (where === "lobby") {
    qs(".pageTribe .lobby .chat .messages")?.empty();
    lobbyChatSuggestions1.destroy();
    lobbyChatSuggestions2.destroy();
  } else if (where === "result") {
    qs(".pageTest #result #tribeResultBottom .chat .messages")?.empty();
    resultChatSuggestions1.destroy();
    resultChatSuggestions2.destroy();
  }
}

export async function fill(where: "lobby" | "result"): Promise<void> {
  reset(where);
  for (let i = 0; i < chatHistory.length; i++) {
    await displayMessage(i, where);
  }
}

function sendChattingUpdate(bool: boolean): void {
  tribeSocket.out.room.chattingUpdate(bool);
}

export function scrollChat(): void {
  const chatEl = qsa(".pageTribe .lobby .chat .messages")[0];
  const chatEl2 = qsa(
    ".pageTest #result #tribeResultBottom .chat .messages",
  )[0];

  if (chatEl === undefined || chatEl2 === undefined) {
    return;
  }

  if (shouldScrollChat) {
    chatEl.native.scrollTop = chatEl?.native.scrollHeight;
    chatEl2.native.scrollTop = chatEl2?.native.scrollHeight;
    shouldScrollChat = true;
  }
}

export function updateIsTyping(): void {
  const room = TribeState.getRoom();
  if (!room) {
    qs(".pageTribe .lobby .chat .whoIsTyping")?.setHtml("");
    qs(".pageTest #result #tribeResultBottom .chat .whoIsTyping")?.setHtml("");
    return;
  }
  let string = "";

  const names: string[] = [];

  for (const userId of Object.keys(room.users)) {
    const user = room.users[userId] as TribeTypes.User;
    if (user.isChatting && userId !== tribeSocket.getId()) {
      names.push(user.name);
    }
  }
  if (names.length > 0) {
    for (let i = 0; i < names.length; i++) {
      if (i === 0) {
        string += `<span class="who">${Misc.escapeHTML(names[i] ?? "")}</span>`;
      } else if (i === names.length - 1) {
        string += ` and <span class="who">${Misc.escapeHTML(
          names[i] ?? "",
        )}</span>`;
      } else {
        string += `, <span class="who">${Misc.escapeHTML(
          names[i] ?? "",
        )}</span>`;
      }
    }
    if (names.length === 1) {
      string += " is typing...";
    } else {
      string += " are typing...";
    }
  } else {
    string = " ";
  }

  qs(".pageTribe .lobby .chat .whoIsTyping")?.setHtml(string);
  qs(".pageTest #result #tribeResultBottom .chat .whoIsTyping")?.setHtml(
    string,
  );
}

async function insertImageEmoji(text: string): Promise<string> {
  const textSplit = text.trim().split(" ");
  let big = "";
  if (textSplit.length === 1) big = "big";
  for (let i = 0; i < textSplit.length; i++) {
    if (/&#58;.+&#58;/g.test(textSplit[i] as string)) {
      const emoji = await getEmojiList();
      const result = emoji.find(
        (e) =>
          Misc.escapeHTML(e.from).toLowerCase() ===
          textSplit[i]?.replace(/&#58;/g, "").toLowerCase(),
      );
      if (result !== undefined) {
        if (result.type === "image") {
          textSplit[i] =
            `<div class="imageemoji ${big}" style="background-image: url('${result.to}')"></div>`;
        } else if (result.type === "emoji") {
          textSplit[i] = `<div class="emoji ${big}">${result.to}</div>`;
        }
      }
    }
  }
  return textSplit.join(" ");
}

export function appendMessage(
  isSystem: boolean,
  socketId: string | undefined,
  message: string,
): void {
  chatHistory.push({
    isSystem,
    socketId,
    message,
  });

  if (chatHistory.length > 100) {
    chatHistory.splice(0, chatHistory.length - 100);
  }

  void displayMessage(
    chatHistory.length - 1,
    getActivePage() === "test" ? "result" : "lobby",
  );
}

export async function displayMessage(
  index: number,
  where: "lobby" | "result",
): Promise<void> {
  const entry = chatHistory[index];

  if (!entry) return;

  let { message, socketId, isSystem } = entry;

  let cls = "message";
  let author = "";
  const fromName =
    socketId !== undefined
      ? TribeState.getRoom()?.users[socketId]?.name
      : undefined;
  if (isSystem) {
    cls = "systemMessage";
  } else {
    let me = false;
    if (socketId === tribeSocket.getId()) me = true;
    author = `<div class="author ${me ? "me" : ""}">${fromName}:</div>`;
  }
  message = await insertImageEmoji(message);

  const previousMessage = chatHistory[index - 1];
  let isNewAuthor = true;
  if (
    previousMessage &&
    (previousMessage.socketId === socketId ||
      (previousMessage.isSystem && isSystem))
  ) {
    isNewAuthor = false;
  }

  if (isNewAuthor) {
    cls += " newAuthor";
  }

  if (where === "lobby") {
    qs(".pageTribe .lobby .chat .messages")?.appendHtml(`
    <div class="${cls}">${author}<div class="text">${message}</div></div>
  `);
  } else if (where === "result") {
    qs(".pageTest #result #tribeResultBottom .chat .messages")?.appendHtml(`
    <div class="${cls}">${author}<div class="text">${message}</div></div>
  `);
  }
  // limitChatMessages();
  scrollChat();
}

function sendMessage(msg: string): void {
  msg = msg.trim();
  if (msg === "") return;
  if (msg.length > 512) {
    showNoticeNotification("Message cannot be longer than 512 characters.");
    return;
  }
  if (performance.now() < lastMessageTimestamp + 500) return;
  lastMessageTimestamp = performance.now();
  sendChattingUpdate(false);
  tribeSocket.out.room.chatMessage(msg);
  shouldScrollChat = true;
  qs<HTMLInputElement>(".pageTribe .lobby .chat .input input")?.setValue("");
  qs<HTMLInputElement>(
    ".pageTest #result #tribeResultBottom .chat .input input",
  )?.setValue("");
}

qs(".pageTribe .tribePage.lobby .chat .input input")?.on("keyup", (e) => {
  if (e.key === "Enter") {
    if (isAnyChatSuggestionVisible()) return;
    const msg = qs<HTMLInputElement>(
      ".pageTribe .lobby .chat .input input",
    )?.getValue();
    sendMessage(msg as string);
  }
});

qs(".pageTest #result #tribeResultBottom .chat .input input")?.on(
  "keyup",
  (e) => {
    if (e.key === "Enter") {
      if (isAnyChatSuggestionVisible()) return;
      const msg = qs<HTMLInputElement>(
        ".pageTest #result #tribeResultBottom .chat .input input",
      )?.getValue();
      sendMessage(msg as string);
    }
  },
);

qs("document")?.on("keydown", (e) => {
  if (!TribeState.isInARoom()) return;

  if (TribeState.getRoomState() === TribeTypes.ROOM_STATE.LOBBY) {
    if (
      e.key === "/" &&
      !qs<HTMLInputElement>(".pageTribe .lobby .chat .input input")?.isFocused()
    ) {
      qs<HTMLInputElement>(".pageTribe .lobby .chat .input input")?.dispatch(
        "focus",
      );
      e.preventDefault();
    }
  } else if (
    getActivePage() === "test" &&
    (TribeState.getRoomState() === TribeTypes.ROOM_STATE.RACE_ONE_FINISHED ||
      TribeState.getRoomState() ===
        TribeTypes.ROOM_STATE.RACE_AWAITING_RESULTS ||
      TribeState.getRoomState() === TribeTypes.ROOM_STATE.SHOWING_RESULTS ||
      TribeState.getRoomState() === TribeTypes.ROOM_STATE.READY_TO_CONTINUE)
  ) {
    if (
      e.key === "/" &&
      !qs<HTMLInputElement>(
        ".pageTest #result #tribeResultBottom .chat .input input",
      )?.isFocused()
    ) {
      qs<HTMLInputElement>(
        ".pageTest #result #tribeResultBottom .chat .input input",
      )?.dispatch("focus");
      e.preventDefault();
    }
  }
});

qs(".pageTribe .tribePage.lobby .chat .input input")?.on("input", (_e) => {
  const val = qs<HTMLInputElement>(
    ".pageTribe .tribePage.lobby .chat .input input",
  )?.getValue() as string;
  qs<HTMLInputElement>(
    ".pageTest #result #tribeResultBottom .chat .input input",
  )?.setValue(val);
  const vallen = val.length;
  if (vallen === 1) {
    sendChattingUpdate(true);
  } else if (vallen === 0) {
    sendChattingUpdate(false);
  }
});

qs(".pageTest #result #tribeResultBottom .chat .input input")?.on(
  "input",
  (_e) => {
    const val = qs<HTMLInputElement>(
      ".pageTest #result #tribeResultBottom .chat .input input",
    )?.getValue() as string;
    qs<HTMLInputElement>(
      ".pageTribe .tribePage.lobby .chat .input input",
    )?.setValue(val);
    const vallen = val.length;
    if (vallen === 1) {
      sendChattingUpdate(true);
    } else if (vallen === 0) {
      sendChattingUpdate(false);
    }
  },
);

qs(".pageTribe .lobby .chat .messages")?.on("scroll", (_e) => {
  const el = qsa(".pageTribe .lobby .chat .messages")[0];
  if (el === undefined) return;
  const scrollHeight = el.native.scrollHeight;
  const scrollTop = el.native.scrollTop;
  const height = el.native.clientHeight;
  if (height + scrollTop < scrollHeight - 20) {
    shouldScrollChat = false;
  } else {
    shouldScrollChat = true;
  }
});

qs(".pageTest #result #tribeResultBottom .chat .messages")?.on(
  "scroll",
  (_e) => {
    const el = qsa(".pageTest #result #tribeResultBottom .chat .messages")[0];
    if (el === undefined) return;
    const scrollHeight = el.native.scrollHeight;
    const scrollTop = el.native.scrollTop;
    const height = el.native.clientHeight;
    if (height + scrollTop < scrollHeight - 20) {
      shouldScrollChat = false;
    } else {
      shouldScrollChat = true;
    }
  },
);

lobbyChatSuggestions1.applyEventListeners();
lobbyChatSuggestions2.applyEventListeners();
resultChatSuggestions1.applyEventListeners();
resultChatSuggestions2.applyEventListeners();
