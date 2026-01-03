import * as Notifications from "../elements/notifications";
import * as TribeState from "../tribe/tribe-state";
import * as Misc from "../utils/misc";
import * as TestState from "../test/test-state";
import tribeSocket from "./tribe-socket";
import {
  InputSuggestionEntry,
  InputSuggestions,
} from "../elements/input-suggestions";
import { getEmojiList } from "../utils/json-data";
import * as TribeTypes from "./types";
import { qsr } from "../utils/dom";

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
    $(".pageTribe .lobby .chat .messages").empty();
    lobbyChatSuggestions1.destroy();
    lobbyChatSuggestions2.destroy();
  } else if (where === "result") {
    $(".pageTest #result #tribeResultBottom .chat .messages").empty();
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
  const chatEl = $(".pageTribe .lobby .chat .messages")[0] as HTMLElement;
  const chatEl2 = $(
    ".pageTest #result #tribeResultBottom .chat .messages",
  )[0] as HTMLElement;

  if (shouldScrollChat) {
    chatEl.scrollTop = chatEl.scrollHeight;
    chatEl2.scrollTop = chatEl2.scrollHeight;
    shouldScrollChat = true;
  }
}

export function updateIsTyping(): void {
  const room = TribeState.getRoom();
  if (!room) {
    $(".pageTribe .lobby .chat .whoIsTyping").html("");
    $(".pageTest #result #tribeResultBottom .chat .whoIsTyping").html("");
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

  $(".pageTribe .lobby .chat .whoIsTyping").html(string);
  $(".pageTest #result #tribeResultBottom .chat .whoIsTyping").html(string);
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
    TestState.resultVisible ? "result" : "lobby",
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
    $(".pageTribe .lobby .chat .messages").append(`
    <div class="${cls}">${author}<div class="text">${message}</div></div>
  `);
  } else if (where === "result") {
    $(".pageTest #result #tribeResultBottom .chat .messages").append(`
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
    Notifications.add("Message cannot be longer than 512 characters.", 0);
    return;
  }
  if (performance.now() < lastMessageTimestamp + 500) return;
  lastMessageTimestamp = performance.now();
  sendChattingUpdate(false);
  tribeSocket.out.room.chatMessage(msg);
  shouldScrollChat = true;
  $(".pageTribe .lobby .chat .input input").val("");
  $(".pageTest #result #tribeResultBottom .chat .input input").val("");
}

$(".pageTribe .tribePage.lobby .chat .input input").on("keyup", (e) => {
  if (e.key === "Enter") {
    if (isAnyChatSuggestionVisible()) return;
    const msg = $(".pageTribe .lobby .chat .input input").val();
    sendMessage(msg as string);
  }
});

$(".pageTest #result #tribeResultBottom .chat .input input").on(
  "keyup",
  (e) => {
    if (e.key === "Enter") {
      if (isAnyChatSuggestionVisible()) return;
      const msg = $(
        ".pageTest #result #tribeResultBottom .chat .input input",
      ).val();
      sendMessage(msg as string);
    }
  },
);

$(document).on("keydown", (e) => {
  if (!TribeState.isInARoom()) return;

  if (TribeState.getRoomState() === TribeTypes.ROOM_STATE.LOBBY) {
    if (
      e.key === "/" &&
      !$(".pageTribe .lobby .chat .input input").is(":focus")
    ) {
      $(".pageTribe .lobby .chat .input input").trigger("focus");
      e.preventDefault();
    }
  } else if (
    TestState.resultVisible &&
    (TribeState.getRoomState() === TribeTypes.ROOM_STATE.RACE_ONE_FINISHED ||
      TribeState.getRoomState() ===
        TribeTypes.ROOM_STATE.RACE_AWAITING_RESULTS ||
      TribeState.getRoomState() === TribeTypes.ROOM_STATE.SHOWING_RESULTS ||
      TribeState.getRoomState() === TribeTypes.ROOM_STATE.READY_TO_CONTINUE)
  ) {
    if (
      e.key === "/" &&
      !$(".pageTest #result #tribeResultBottom .chat .input input").is(":focus")
    ) {
      $(".pageTest #result #tribeResultBottom .chat .input input").trigger(
        "focus",
      );
      e.preventDefault();
    }
  }
});

$(".pageTribe .tribePage.lobby .chat .input input").on("input", (_e) => {
  const val = $(
    ".pageTribe .tribePage.lobby .chat .input input",
  ).val() as string;
  $(".pageTest #result #tribeResultBottom .chat .input input").val(val);
  const vallen = val.length;
  if (vallen === 1) {
    sendChattingUpdate(true);
  } else if (vallen === 0) {
    sendChattingUpdate(false);
  }
});

$(".pageTest #result #tribeResultBottom .chat .input input").on(
  "input",
  (_e) => {
    const val = $(
      ".pageTest #result #tribeResultBottom .chat .input input",
    ).val() as string;
    $(".pageTribe .tribePage.lobby .chat .input input").val(val);
    const vallen = val.length;
    if (vallen === 1) {
      sendChattingUpdate(true);
    } else if (vallen === 0) {
      sendChattingUpdate(false);
    }
  },
);

$(".pageTribe .lobby .chat .messages").on("scroll", (_e) => {
  const el = $(".pageTribe .lobby .chat .messages")[0];
  const scrollHeight = el?.scrollHeight as number;
  const scrollTop = el?.scrollTop as number;
  const height = el?.clientHeight as number;
  if (height + scrollTop < scrollHeight - 20) {
    shouldScrollChat = false;
  } else {
    shouldScrollChat = true;
  }
});

$(".pageTest #result #tribeResultBottom .chat .messages").on("scroll", (_e) => {
  const el = $(".pageTest #result #tribeResultBottom .chat .messages")[0];
  const scrollHeight = el?.scrollHeight as number;
  const scrollTop = el?.scrollTop as number;
  const height = el?.clientHeight as number;
  if (height + scrollTop < scrollHeight - 20) {
    shouldScrollChat = false;
  } else {
    shouldScrollChat = true;
  }
});

lobbyChatSuggestions1.applyEventListeners();
lobbyChatSuggestions2.applyEventListeners();
resultChatSuggestions1.applyEventListeners();
resultChatSuggestions2.applyEventListeners();
