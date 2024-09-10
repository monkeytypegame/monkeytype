import Config from "../config";
import * as ConfigEvent from "../observables/config-event";
import { createErrorMessage } from "../utils/misc";
import { randomElementFromArray } from "../utils/arrays";
import { randomIntFromRange } from "../utils/numbers";
import { leftState, rightState } from "../test/shift-tracker";
import { capsState } from "../test/caps-warning";
import * as Notifications from "../elements/notifications";

import type { Howl } from "howler";
import { PlaySoundOnClick } from "@monkeytype/contracts/schemas/configs";

async function gethowler(): Promise<typeof import("howler")> {
  return await import("howler");
}

type ClickSounds = Record<
  string,
  {
    sounds: Howl[];
    counter: number;
  }[]
>;

type ErrorSounds = Record<
  string,
  {
    sounds: Howl[];
    counter: number;
  }[]
>;

let errorSounds: ErrorSounds | null = null;
let clickSounds: ClickSounds | null = null;

async function initErrorSound(): Promise<void> {
  const Howl = (await gethowler()).Howl;
  if (errorSounds !== null) return;
  errorSounds = {
    1: [
      {
        sounds: [
          new Howl({ src: "../sound/error1/error1_1.wav" }),
          new Howl({ src: "../sound/error1/error1_1.wav" }),
        ],
        counter: 0,
      },
    ],
    2: [
      {
        sounds: [
          new Howl({ src: "../sound/error2/error2_1.wav" }),
          new Howl({ src: "../sound/error2/error2_1.wav" }),
        ],
        counter: 0,
      },
    ],
    3: [
      {
        sounds: [
          new Howl({ src: "../sound/error3/error3_1.wav" }),
          new Howl({ src: "../sound/error3/error3_1.wav" }),
        ],
        counter: 0,
      },
    ],
    4: [
      {
        sounds: [
          new Howl({ src: "../sound/error4/error4_1.wav" }),
          new Howl({ src: "../sound/error4/error4_1.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/error4/error4_2.wav" }),
          new Howl({ src: "../sound/error4/error4_2.wav" }),
        ],
        counter: 0,
      },
    ],
  };
  Howler.volume(Config.soundVolume);
}

async function init(): Promise<void> {
  const Howl = (await gethowler()).Howl;
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
    14: [
      {
        sounds: [
          new Howl({ src: "../sound/click14/click14_1.wav" }),
          new Howl({ src: "../sound/click14/click14_1.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click14/click14_2.wav" }),
          new Howl({ src: "../sound/click14/click14_2.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click14/click14_3.wav" }),
          new Howl({ src: "../sound/click14/click14_3.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click14/click14_4.wav" }),
          new Howl({ src: "../sound/click14/click14_4.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click14/click14_5.wav" }),
          new Howl({ src: "../sound/click14/click14_5.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click14/click14_6.wav" }),
          new Howl({ src: "../sound/click14/click14_6.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click14/click14_7.wav" }),
          new Howl({ src: "../sound/click14/click14_7.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click14/click14_8.wav" }),
          new Howl({ src: "../sound/click14/click14_8.wav" }),
        ],
        counter: 0,
      },
    ],
    15: [
      {
        sounds: [
          new Howl({ src: "../sound/click15/click15_1.wav" }),
          new Howl({ src: "../sound/click15/click15_1.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click15/click15_2.wav" }),
          new Howl({ src: "../sound/click15/click15_2.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click15/click15_3.wav" }),
          new Howl({ src: "../sound/click15/click15_3.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click15/click15_4.wav" }),
          new Howl({ src: "../sound/click15/click15_4.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click15/click15_5.wav" }),
          new Howl({ src: "../sound/click15/click15_5.wav" }),
        ],
        counter: 0,
      },
    ],
  };
  Howler.volume(Config.soundVolume);
}

export async function previewClick(val: string): Promise<void> {
  if (clickSounds === null) await init();

  const safeClickSounds = clickSounds as ClickSounds;

  const clickSoundIds = Object.keys(safeClickSounds);
  if (!clickSoundIds.includes(val)) return;

  //@ts-expect-error
  safeClickSounds[val][0].sounds[0].seek(0);
  //@ts-expect-error
  safeClickSounds[val][0].sounds[0].play();
}

export async function previewError(val: string): Promise<void> {
  if (errorSounds === null) await initErrorSound();

  const safeErrorSounds = errorSounds as ErrorSounds;

  const errorSoundIds = Object.keys(safeErrorSounds);
  if (!errorSoundIds.includes(val)) return;

  //@ts-expect-error
  errorClickSounds[val][0].sounds[0].seek(0);
  //@ts-expect-error
  errorClickSounds[val][0].sounds[0].play();
}

let currentCode = "KeyA";

$(document).on("keydown", (event) => {
  currentCode = event.code || "KeyA";
});

const notes = {
  C: [16.35, 32.7, 65.41, 130.81, 261.63, 523.25, 1046.5, 2093.0, 4186.01],
  Db: [17.32, 34.65, 69.3, 138.59, 277.18, 554.37, 1108.73, 2217.46, 4434.92],
  D: [18.35, 36.71, 73.42, 146.83, 293.66, 587.33, 1174.66, 2349.32, 4698.64],
  Eb: [19.45, 38.89, 77.78, 155.56, 311.13, 622.25, 1244.51, 2489.02, 4978.03],
  E: [20.6, 41.2, 82.41, 164.81, 329.63, 659.26, 1318.51, 2637.02],
  F: [21.83, 43.65, 87.31, 174.61, 349.23, 698.46, 1396.91, 2793.83],
  Gb: [23.12, 46.25, 92.5, 185.0, 369.99, 739.99, 1479.98, 2959.96],
  G: [24.5, 49.0, 98.0, 196.0, 392.0, 783.99, 1567.98, 3135.96],
  Ab: [25.96, 51.91, 103.83, 207.65, 415.3, 830.61, 1661.22, 3322.44],
  A: [27.5, 55.0, 110.0, 220.0, 440.0, 880.0, 1760.0, 3520.0],
  Bb: [29.14, 58.27, 116.54, 233.08, 466.16, 932.33, 1864.66, 3729.31],
  B: [30.87, 61.74, 123.47, 246.94, 493.88, 987.77, 1975.53, 3951.07],
} as const;

type ValidNotes = keyof typeof notes;
type ValidFrequencies = (typeof notes)[ValidNotes];

type GetNoteFrequencyCallback = (octave: number) => number;

function bindToNote(
  noteFrequencies: ValidFrequencies,
  octaveOffset = 0
): GetNoteFrequencyCallback {
  return (octave: number): number => {
    return noteFrequencies[octave + octaveOffset] ?? 0;
  };
}

const codeToNote: Record<string, GetNoteFrequencyCallback> = {
  KeyZ: bindToNote(notes.C),
  KeyS: bindToNote(notes.Db),
  KeyX: bindToNote(notes.D),
  KeyD: bindToNote(notes.Eb),
  KeyC: bindToNote(notes.E),
  KeyV: bindToNote(notes.F),
  KeyG: bindToNote(notes.Gb),
  KeyB: bindToNote(notes.G),
  KeyH: bindToNote(notes.Ab),
  KeyN: bindToNote(notes.A),
  KeyJ: bindToNote(notes.Bb),
  KeyM: bindToNote(notes.B),
  Comma: bindToNote(notes.C, 1),
  KeyL: bindToNote(notes.Db, 1),
  Period: bindToNote(notes.D, 1),
  Semicolon: bindToNote(notes.Eb, 1),
  Slash: bindToNote(notes.E, 1),
  KeyQ: bindToNote(notes.C, 1),
  Digit2: bindToNote(notes.Db, 1),
  KeyW: bindToNote(notes.D, 1),
  Digit3: bindToNote(notes.Eb, 1),
  KeyE: bindToNote(notes.E, 1),
  KeyR: bindToNote(notes.F, 1),
  Digit5: bindToNote(notes.Gb, 1),
  KeyT: bindToNote(notes.G, 1),
  Digit6: bindToNote(notes.Ab, 1),
  KeyY: bindToNote(notes.A, 1),
  Digit7: bindToNote(notes.Bb, 1),
  KeyU: bindToNote(notes.B, 1),
  KeyI: bindToNote(notes.C, 2),
  Digit9: bindToNote(notes.Db, 2),
  KeyO: bindToNote(notes.D, 2),
  Digit0: bindToNote(notes.Eb, 2),
  KeyP: bindToNote(notes.E, 2),
  BracketLeft: bindToNote(notes.F, 2),
  Equal: bindToNote(notes.Gb, 2),
  BracketRight: bindToNote(notes.G, 2),
};

type DynamicClickSounds = Extract<PlaySoundOnClick, "8" | "9" | "10" | "11">;
type SupportedOscillatorTypes = Exclude<OscillatorType, "custom">;

const clickSoundIdsToOscillatorType: Record<
  DynamicClickSounds,
  SupportedOscillatorTypes
> = {
  "8": "sine",
  "9": "sawtooth",
  "10": "square",
  "11": "triangle",
};

let audioCtx: AudioContext | undefined | null;

function initAudioContext(): void {
  if (audioCtx === null) return;
  try {
    audioCtx = new AudioContext();
  } catch (e) {
    audioCtx = null;
    console.error(e);
    Notifications.add(
      createErrorMessage(e, "Error initializing audio context") +
        ". Notes will not play.",
      -1
    );
  }
}

type ValidScales = "pentatonic" | "wholetone";

const scales: Record<ValidScales, ValidNotes[]> = {
  pentatonic: ["C", "D", "E", "G", "A"],
  wholetone: ["C", "D", "E", "Gb", "Ab", "Bb"],
};

type ScaleData = {
  octave: number; // current octave of scale
  direction: number; // whether scale is ascending or descending
  position: number; // current position in scale
};

function createPreviewScale(scaleName: ValidScales): () => void {
  // We use a JavaScript closure to create a preview function that can be called multiple times and progress through the scale
  const scale: ScaleData = {
    position: 0,
    octave: 4,
    direction: 1,
  };

  return async () => {
    if (clickSounds === null) await init();
    playScale(scaleName, scale);
  };
}

type ScaleMeta = {
  name: ValidScales;
  preview: ReturnType<typeof createPreviewScale>;
  meta: ScaleData;
};

const defaultScaleData: ScaleData = {
  position: 0,
  octave: 4,
  direction: 1,
};

export const scaleConfigurations: Record<
  Extract<PlaySoundOnClick, "12" | "13">,
  ScaleMeta
> = {
  "12": {
    name: "pentatonic",
    preview: createPreviewScale("pentatonic"),
    meta: defaultScaleData,
  },
  "13": {
    name: "wholetone",
    preview: createPreviewScale("wholetone"),
    meta: defaultScaleData,
  },
};

function playScale(scale: ValidScales, scaleMeta: ScaleData): void {
  if (audioCtx === undefined) {
    initAudioContext();
  }
  if (!audioCtx) return;

  const randomNote = randomIntFromRange(0, scales[scale].length - 1);

  if (Math.random() < 0.5) {
    scaleMeta.octave += scaleMeta.direction;
  }

  if (scaleMeta.octave >= 6) {
    scaleMeta.direction = -1;
  }
  if (scaleMeta.octave <= 4) {
    scaleMeta.direction = 1;
  }

  const note = scales[scale][randomNote] as ValidNotes;

  const currentFrequency = notes[note][scaleMeta.octave] as number;

  const oscillatorNode = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillatorNode.type = "sine";
  gainNode.gain.value = Config.soundVolume / 10;
  oscillatorNode.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillatorNode.frequency.value = currentFrequency;
  oscillatorNode.start(audioCtx.currentTime);
  gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.3);
  oscillatorNode.stop(audioCtx.currentTime + 2);
}

export function playNote(
  codeOverride?: string,
  oscillatorTypeOverride?: SupportedOscillatorTypes
): void {
  if (audioCtx === undefined) {
    initAudioContext();
  }
  if (!audioCtx) return;

  currentCode = codeOverride ?? currentCode;
  if (!(currentCode in codeToNote)) {
    return;
  }

  const baseOctave = 3;
  const octave = baseOctave + (leftState || rightState || capsState ? 1 : 0);
  const currentFrequency = codeToNote[currentCode]?.(octave);

  const oscillatorNode = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillatorNode.type =
    oscillatorTypeOverride ??
    clickSoundIdsToOscillatorType[
      Config.playSoundOnClick as DynamicClickSounds
    ];
  gainNode.gain.value = Config.soundVolume / 10;

  oscillatorNode.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillatorNode.frequency.value = currentFrequency as number;
  oscillatorNode.start(audioCtx.currentTime);
  gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.15); //remove click sound
  oscillatorNode.stop(audioCtx.currentTime + 0.5);
}

export async function playClick(codeOverride?: string): Promise<void> {
  if (Config.playSoundOnClick === "off") return;

  if (Config.playSoundOnClick in scaleConfigurations) {
    const { name, meta } =
      scaleConfigurations[
        Config.playSoundOnClick as keyof typeof scaleConfigurations
      ];
    playScale(name, meta);
    return;
  }

  if (Config.playSoundOnClick in clickSoundIdsToOscillatorType) {
    playNote(codeOverride ?? undefined);
    return;
  }

  if (clickSounds === null) await init();

  const sounds = (clickSounds as ClickSounds)[Config.playSoundOnClick];

  if (sounds === undefined) throw new Error("Invalid click sound ID");

  const randomSound = randomElementFromArray(sounds);
  const soundToPlay = randomSound.sounds[randomSound.counter] as Howl;

  randomSound.counter++;
  if (randomSound.counter === 2) randomSound.counter = 0;
  soundToPlay.seek(0);
  soundToPlay.play();
}

export async function playError(): Promise<void> {
  if (Config.playSoundOnError === "off") return;
  if (errorSounds === null) await initErrorSound();

  const sounds = (errorSounds as ErrorSounds)[Config.playSoundOnError];
  if (sounds === undefined) throw new Error("Invalid error sound ID");

  const randomSound = randomElementFromArray(sounds);
  const soundToPlay = randomSound.sounds[randomSound.counter] as Howl;

  randomSound.counter++;
  if (randomSound.counter === 2) randomSound.counter = 0;
  soundToPlay.seek(0);
  soundToPlay.play();
}

function setVolume(val: number): void {
  try {
    Howler.volume(val);
  } catch (e) {
    //
  }
}

ConfigEvent.subscribe((eventKey, eventValue) => {
  if (eventKey === "playSoundOnClick" && eventValue !== "off") void init();
  if (eventKey === "soundVolume") {
    setVolume(parseFloat(eventValue as string));
  }
});
