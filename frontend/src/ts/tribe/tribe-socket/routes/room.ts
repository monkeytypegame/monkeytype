import { Mode } from "@monkeytype/schemas/shared";
import Socket from "../socket";
import { QuoteLength } from "@monkeytype/schemas/configs";
import * as TribeTypes from "../../types";

type GetPublicRoomsResponse = {
  status?: string;
  rooms?: TribeTypes.Room[];
};

async function getPublicRooms(
  _page: number,
  search: string,
): Promise<GetPublicRoomsResponse> {
  return new Promise((resolve) => {
    Socket.emit(
      "room_get_public_rooms",
      {
        page: 0,
        search: search,
      },
      (e: GetPublicRoomsResponse) => {
        resolve(e);
      },
    );
  });
}

type JoinRoomResponse = {
  status?: string;
  room?: TribeTypes.Room;
};

async function join(
  roomId: string,
  fromBrowser: boolean,
): Promise<JoinRoomResponse> {
  return new Promise((resolve) => {
    Socket.emit(
      "room_join",
      { roomId, fromBrowser },
      (res: JoinRoomResponse) => {
        resolve(res);
      },
    );
  });
}

function init(): void {
  Socket.emit("room_init_race");
}

function readyUpdate(): void {
  Socket.emit("room_ready_update");
}

function initRaceOut(): void {
  Socket.emit("room_init_race");
}

function banUser(userId: string): void {
  Socket.emit("room_ban_user", {
    userId,
  });
}

function giveLeader(userId: string): void {
  Socket.emit("room_give_leader", {
    userId,
  });
}

function progressUpdateOut(userProgress: TribeTypes.UserProgressOut): void {
  Socket.emit("room_progress_update", userProgress);
}

function afkUpdate(isAfk: boolean): void {
  Socket.emit("room_afk_update", { isAfk });
}

function chattingUpdate(isChatting: boolean): void {
  Socket.emit("room_chatting_update", {
    isChatting,
  });
}

function chatMessageOut(message: string): void {
  Socket.emit("room_chat_message", {
    message,
  });
}

function updateConfig(config: TribeTypes.RoomConfig): void {
  Socket.emit("room_update_config", { config });
}

function result(result: TribeTypes.Result): void {
  Socket.emit("room_result", { result });
}

function create(
  mode: Mode,
  mode2: string | number | QuoteLength[],
  type?: string,
): void {
  Socket.emit("room_create", { mode, mode2, type });
}

function toggleVisibility(): void {
  Socket.emit("room_toggle_visibility");
}

function updateNameOut(name: string): void {
  Socket.emit("room_update_name", { name });
}

function leave(): void {
  Socket.emit(`room_leave`);
}

function backToLobbyOut(): void {
  Socket.emit("room_back_to_lobby");
}

function destroyTest(callback: (data: { reason: string }) => void): void {
  Socket.on("room_destroy_test", callback);
}

function joined(callback: (data: { room: TribeTypes.Room }) => void): void {
  Socket.on("room_joined", callback);
}

function playerJoined(
  callback: (data: { user: TribeTypes.User }) => void,
): void {
  Socket.on("room_player_joined", callback);
}

function playerLeft(callback: (data: { userId: string }) => void): void {
  Socket.on("room_player_left", callback);
}

function left(callback: () => void): void {
  Socket.on("room_left", callback);
}

function visibilityChanged(
  callback: (data: { isPrivate: boolean }) => void,
): void {
  Socket.on("room_visibility_changed", callback);
}

function nameChanged(callback: (data: { name: string }) => void): void {
  Socket.on("room_name_changed", callback);
}

function userIsReady(callback: (data: { userId: string }) => void): void {
  Socket.on("room_user_is_ready", callback);
}

function userAfkUpdate(
  callback: (data: { userId: string; isAfk: boolean }) => void,
): void {
  Socket.on("room_user_afk_update", callback);
}

function leaderChanged(callback: (data: { userId: string }) => void): void {
  Socket.on("room_leader_changed", callback);
}

function chattingChanged(
  callback: (data: { userId: string; isChatting: boolean }) => void,
): void {
  Socket.on("room_chatting_changed", callback);
}

function chatMessage(
  callback: (data: {
    message: string;
    from?: TribeTypes.User;
    isSystem: boolean;
  }) => void,
): void {
  Socket.on("room_chat_message", callback);
}

function configChanged(
  callback: (data: { config: TribeTypes.RoomConfig }) => void,
): void {
  Socket.on("room_config_changed", callback);
}

function initRace(callback: (data: { seed: number }) => void): void {
  Socket.on("room_init_race", callback);
}

function stateChanged(callback: (data: { state: number }) => void): void {
  Socket.on("room_state_changed", callback);
}

function countdown(callback: (data: { time: number }) => void): void {
  Socket.on("room_countdown", callback);
}

function usersUpdate(
  callback: (data: Record<string, TribeTypes.User>) => void,
): void {
  Socket.on("room_users_update", callback);
}

function raceStarted(callback: () => void): void {
  Socket.on("room_race_started", callback);
}

function progressUpdate(
  callback: (data: {
    users: Record<string, TribeTypes.UserProgress>;
    roomMaxRaw: number;
    roomMaxWpm: number;
    roomMinRaw: number;
    roomMinWpm: number;
  }) => void,
): void {
  Socket.on("room_progress_update", callback);
}

function userResult(
  callback: (data: {
    userId: string;
    result: TribeTypes.Result | undefined;
    everybodyCompleted: boolean;
  }) => void,
): void {
  Socket.on("room_user_result", callback);
}

function finishTimerCountdown(
  callback: (data: { time: number }) => void,
): void {
  Socket.on("room_finishTimer_countdown", callback);
}

function finishTimerOver(callback: () => void): void {
  Socket.on("room_finishTimer_over", callback);
}

function readyTimerCountdown(callback: (data: { time: number }) => void): void {
  Socket.on("room_readyTimer_countdown", callback);
}

function readyTimerOver(callback: () => void): void {
  Socket.on("room_readyTimer_over", callback);
}

function backToLobby(callback: () => void): void {
  Socket.on("room_back_to_lobby", callback);
}

export type FinalPositions = Record<
  number,
  {
    id: string;
    newPoints: number;
    newPointsTotal: number;
  }[]
>;

function finalPositions(
  callback: (data: {
    positions: FinalPositions;
    miniCrowns: TribeTypes.MiniCrowns;
  }) => void,
): void {
  Socket.on("room_final_positions", callback);
}

export default {
  in: {
    joined,
    playerJoined,
    playerLeft,
    left,
    visibilityChanged,
    nameChanged,
    userIsReady,
    userAfkUpdate,
    leaderChanged,
    chattingChanged,
    chatMessage,
    configChanged,
    initRace,
    stateChanged,
    countdown,
    usersUpdate,
    raceStarted,
    progressUpdate,
    userResult,
    finishTimerCountdown,
    finishTimerOver,
    readyTimerCountdown,
    readyTimerOver,
    backToLobby,
    finalPositions,
    destroyTest,
  },
  out: {
    getPublicRooms,
    join,
    init,
    readyUpdate,
    initRace: initRaceOut,
    banUser,
    giveLeader,
    progressUpdate: progressUpdateOut,
    afkUpdate,
    leave,
    backToLobby: backToLobbyOut,
    chattingUpdate,
    chatMessage: chatMessageOut,
    updateConfig,
    result,
    create,
    toggleVisibility,
    updateName: updateNameOut,
  },
};
