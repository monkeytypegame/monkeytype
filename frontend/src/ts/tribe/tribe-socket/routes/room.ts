import Socket from "../socket";

async function getPublicRooms(
  _page: number,
  search: string
): Promise<TribeSocket.GetPublicRoomsResponse> {
  return new Promise((resolve) => {
    Socket.emit(
      "room_get_public_rooms",
      {
        page: 0,
        search: search,
      },
      (e: TribeSocket.GetPublicRoomsResponse) => {
        resolve(e);
      }
    );
  });
}

async function join(
  roomId: string,
  fromBrowser: boolean
): Promise<TribeSocket.JoinRoomResponse> {
  return new Promise((resolve) => {
    Socket.emit(
      "room_join",
      { roomId, fromBrowser },
      (res: TribeSocket.JoinRoomResponse) => {
        resolve(res);
      }
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

function joined(callback: (data: { room: TribeTypes.Room }) => void): void {
  Socket.on("room_joined", callback);
}

function playerJoined(
  callback: (data: { user: TribeTypes.User }) => void
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
  callback: (data: { isPrivate: boolean }) => void
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
  callback: (data: { userId: string; isAfk: boolean }) => void
): void {
  Socket.on("room_user_afk_update", callback);
}

function leaderChanged(callback: (data: { userId: string }) => void): void {
  Socket.on("room_leader_changed", callback);
}

function chattingChanged(
  callback: (data: { userId: string; isChatting: boolean }) => void
): void {
  Socket.on("room_chatting_changed", callback);
}

function chatMessage(
  callback: (data: {
    message: string;
    from: TribeTypes.User;
    isSystem: boolean;
  }) => void
): void {
  Socket.on("room_chat_message", callback);
}

function configChanged(
  callback: (data: { config: TribeTypes.RoomConfig }) => void
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
  callback: (data: Record<string, TribeTypes.User>) => void
): void {
  Socket.on("room_users_update", callback);
}

function raceStarted(callback: () => void): void {
  Socket.on("room_race_started", callback);
}

function progressUpdate(
  callback: (data: {
    userId: string;
    progress: TribeTypes.UserProgress;
    roomMaxRaw: number;
    roomMaxWpm: number;
  }) => void
): void {
  Socket.on("room_chat_message", callback);
}

function userResult(
  callback: (data: {
    userId: string;
    result: TribeTypes.Result;
    everybodyCompleted: boolean;
  }) => void
): void {
  Socket.on("room_user_result", callback);
}

function finishTimerCountdown(
  callback: (data: { time: number }) => void
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

function finalPositions(
  callback: (data: {
    sorted: {
      newPoints: number;
      id: string;
    }[];
    miniCrowns: TribeTypes.MiniCrowns;
  }) => void
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
  },
  out: {
    getPublicRooms,
    join,
    init,
    readyUpdate,
    initRace: initRaceOut,
  },
};
