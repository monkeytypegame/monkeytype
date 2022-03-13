import Config from "../config";
import Howler, { Howl } from "howler";
import * as ConfigEvent from "../observables/config-event";

type ClickSounds = {
  [key: string]: {
    sounds: Howler.Howl[];
    counter: number;
  }[];
};

let errorSound: Howler.Howl | null = null;
let clickSounds: ClickSounds | null = null;

export function initErrorSound(): void {
  if (errorSound !== null) return;
  errorSound = new Howl({ src: ["../sound/error.wav"] });
}

export function init(): void {
  if (clickSounds !== null) return;
  clickSounds = {
    1: [
      {
        sounds: [
          new Howl({ src: "../sound/click1/click1_1.wav" }),
          new Howl({ src: "../sound/click1/click1_1.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click1/click1_2.wav" }),
          new Howl({ src: "../sound/click1/click1_2.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click1/click1_3.wav" }),
          new Howl({ src: "../sound/click1/click1_3.wav" }),
        ],
        counter: 0,
      },
    ],
    2: [
      {
        sounds: [
          new Howl({ src: "../sound/click2/click2_1.wav" }),
          new Howl({ src: "../sound/click2/click2_1.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click2/click2_2.wav" }),
          new Howl({ src: "../sound/click2/click2_2.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click2/click2_3.wav" }),
          new Howl({ src: "../sound/click2/click2_3.wav" }),
        ],
        counter: 0,
      },
    ],
    3: [
      {
        sounds: [
          new Howl({ src: "../sound/click3/click3_1.wav" }),
          new Howl({ src: "../sound/click3/click3_1.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click3/click3_2.wav" }),
          new Howl({ src: "../sound/click3/click3_2.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click3/click3_3.wav" }),
          new Howl({ src: "../sound/click3/click3_3.wav" }),
        ],
        counter: 0,
      },
    ],
    4: [
      {
        sounds: [
          new Howl({ src: "../sound/click4/click4_1.wav" }),
          new Howl({ src: "../sound/click4/click4_11.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click4/click4_2.wav" }),
          new Howl({ src: "../sound/click4/click4_22.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click4/click4_3.wav" }),
          new Howl({ src: "../sound/click4/click4_33.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click4/click4_4.wav" }),
          new Howl({ src: "../sound/click4/click4_44.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click4/click4_5.wav" }),
          new Howl({ src: "../sound/click4/click4_55.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click4/click4_6.wav" }),
          new Howl({ src: "../sound/click4/click4_66.wav" }),
        ],
        counter: 0,
      },
    ],
    5: [
      {
        sounds: [
          new Howl({ src: "../sound/click5/click5_1.wav" }),
          new Howl({ src: "../sound/click5/click5_11.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click5/click5_2.wav" }),
          new Howl({ src: "../sound/click5/click5_22.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click5/click5_3.wav" }),
          new Howl({ src: "../sound/click5/click5_33.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click5/click5_4.wav" }),
          new Howl({ src: "../sound/click5/click5_44.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click5/click5_5.wav" }),
          new Howl({ src: "../sound/click5/click5_55.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click5/click5_6.wav" }),
          new Howl({ src: "../sound/click5/click5_66.wav" }),
        ],
        counter: 0,
      },
    ],
    6: [
      {
        sounds: [
          new Howl({ src: "../sound/click6/click6_1.wav" }),
          new Howl({ src: "../sound/click6/click6_11.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click6/click6_2.wav" }),
          new Howl({ src: "../sound/click6/click6_22.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click6/click6_3.wav" }),
          new Howl({ src: "../sound/click6/click6_33.wav" }),
        ],
        counter: 0,
      },
    ],
    7: [
      {
        sounds: [
          new Howl({ src: "../sound/click7/click7_1.wav" }),
          new Howl({ src: "../sound/click7/click7_11.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click7/click7_2.wav" }),
          new Howl({ src: "../sound/click7/click7_22.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click7/click7_3.wav" }),
          new Howl({ src: "../sound/click7/click7_33.wav" }),
        ],
        counter: 0,
      },
    ],
  };
}

export function previewClick(val: string): void {
  if (clickSounds === null) init();
  (clickSounds as ClickSounds)[val][0].sounds[0].seek(0);
  (clickSounds as ClickSounds)[val][0].sounds[0].play();
}

export function playClick(): void {
  if (Config.playSoundOnClick === "off") return;
  if (clickSounds === null) init();

  const rand = Math.floor(
    Math.random() * (clickSounds as ClickSounds)[Config.playSoundOnClick].length
  );
  const randomSound = (clickSounds as ClickSounds)[Config.playSoundOnClick][
    rand
  ];
  randomSound.counter++;
  if (randomSound.counter === 2) randomSound.counter = 0;
  randomSound.sounds[randomSound.counter].seek(0);
  randomSound.sounds[randomSound.counter].play();
}

export function playError(): void {
  if (!Config.playSoundOnError) return;
  if (errorSound === null) initErrorSound();
  (errorSound as Howler.Howl).seek(0);
  (errorSound as Howler.Howl).play();
}

export function setVolume(val: string): void {
  // not sure why it complains but it works
  // @ts-ignore
  Howler.Howler.volume(val);
}

ConfigEvent.subscribe((eventKey, eventValue) => {
  if (eventKey === "playSoundOnClick" && eventValue !== "off") init();
  if (eventKey === "soundVolume") setVolume(eventValue as string);
});
