import { Howl } from "howler";

let sounds = {
  join: new Howl({ src: "../sound/tribe_ui/join.wav" }),
  leave: new Howl({ src: "../sound/tribe_ui/leave.wav" }),
  start: new Howl({ src: "../sound/tribe_ui/start.wav" }),
  chat1: new Howl({ src: "../sound/tribe_ui/chat1.wav" }),
  chat2: new Howl({ src: "../sound/tribe_ui/chat2.wav" }),
  chat_mention: new Howl({ src: "../sound/tribe_ui/chat_mention.wav" }),
  finish: new Howl({ src: "../sound/tribe_ui/finish.wav" }),
  finish_win: new Howl({ src: "../sound/tribe_ui/finish_win.wav" }),
  glow: new Howl({ src: "../sound/tribe_ui/glow.wav" }),
  cd: new Howl({ src: "../sound/tribe_ui/cd2.wav" }),
  cd_go: new Howl({ src: "../sound/tribe_ui/cd_go2.wav" }),
};

export function play(name) {
  sounds[name].seek(0);
  sounds[name].play();
}
