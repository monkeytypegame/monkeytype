import { Config } from "../config/store";
import { configEvent } from "../events/config";
import { randomElementFromArray } from "../utils/arrays";
import { leftState, rightState } from "../test/shift-tracker";
import { capsState } from "../test/caps-warning";
import { showErrorNotification } from "../states/notifications";

import type { Howl } from "howler";
import {
  PlaySoundOnClick,
  PlaySoundOnError,
} from "@monkeytype/schemas/configs";
import {
  clickSoundConfig,
  ScaleSoundConfig,
  SoundConfigType,
  soundsConfig,
  SupportedOscillatorTypes,
  ValidNotes,
} from "../constants/sounds";

let howlerModulePromise: Promise<typeof import("howler")> | null = null;
async function getHowlerModule(): Promise<typeof import("howler")> {
  howlerModulePromise ??= import("howler");
  return howlerModulePromise;
}

let initPromise: Promise<void> | null = null;
const loadedBundles: Set<PlaySoundOnClick> = new Set();

const howlers: Record<string, Promise<Howl>> = {};

async function getHowl(src: string): Promise<Howl> {
  howlers[src] ??= (async () => {
    const { Howl } = await getHowlerModule();
    return new Howl({ src });
  })();

  return howlers[src];
}

type ErrorSounds = Record<Exclude<PlaySoundOnError, "off">, Howl[]>;

let errorSounds: ErrorSounds | null = null;

let timeWarning: Howl | null = null;

let fartReverb: Howl | null = null;

async function initTimeWarning(): Promise<void> {
  if (timeWarning !== null) return;
  timeWarning = await getHowl("../sounds/timeWarning.wav");
}

async function initFartReverb(): Promise<void> {
  if (fartReverb !== null) return;
  fartReverb = await getHowl("../sounds/fart-reverb.wav");
}

async function initErrorSound(): Promise<void> {
  if (errorSounds !== null) return;
  errorSounds = {
    1: [await getHowl("../sounds/error1/1.wav")],
    2: [await getHowl("../sounds/error2/1.wav")],
    3: [await getHowl("../sounds/error3/1.wav")],
    4: [
      await getHowl("../sounds/error4/1.wav"),
      await getHowl("../sounds/error4/2.wav"),
    ],
  };
  (await getHowlerModule()).Howler.volume(Config.soundVolume);
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
    16: [
      {
        sounds: [
          new Howl({ src: "../sound/click16/click16_1.wav" }),
          new Howl({ src: "../sound/click16/click16_1.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click16/click16_2.wav" }),
          new Howl({ src: "../sound/click16/click16_2.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click16/click16_3.wav" }),
          new Howl({ src: "../sound/click16/click16_3.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click16/click16_4.wav" }),
          new Howl({ src: "../sound/click16/click16_4.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click16/click16_8.wav" }),
          new Howl({ src: "../sound/click16/click16_8.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click16/click16_9.wav" }),
          new Howl({ src: "../sound/click16/click16_9.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click16/click16_10.wav" }),
          new Howl({ src: "../sound/click16/click16_10.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click16/click16_11.wav" }),
          new Howl({ src: "../sound/click16/click16_11.wav" }),
        ],
        counter: 0,
      },
    ],
    17: [
      {
        sounds: [
          new Howl({ src: "../sound/click17/1.wav" }),
          new Howl({ src: "../sound/click17/1.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click17/2.wav" }),
          new Howl({ src: "../sound/click17/2.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click17/3.wav" }),
          new Howl({ src: "../sound/click17/3.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click17/4.wav" }),
          new Howl({ src: "../sound/click17/4.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click17/5.wav" }),
          new Howl({ src: "../sound/click17/5.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click17/6.wav" }),
          new Howl({ src: "../sound/click17/6.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click17/7.wav" }),
          new Howl({ src: "../sound/click17/7.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click17/8.wav" }),
          new Howl({ src: "../sound/click17/8.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click17/9.wav" }),
          new Howl({ src: "../sound/click17/9.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click17/10.wav" }),
          new Howl({ src: "../sound/click17/10.wav" }),
        ],
        counter: 0,
      },
    ],
    18: [
      {
        sounds: [
          new Howl({ src: "../sound/click18/1.wav" }),
          new Howl({ src: "../sound/click18/1.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click18/2.wav" }),
          new Howl({ src: "../sound/click18/2.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click18/3.wav" }),
          new Howl({ src: "../sound/click18/3.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click18/4.wav" }),
          new Howl({ src: "../sound/click18/4.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click18/5.wav" }),
          new Howl({ src: "../sound/click18/5.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click18/6.wav" }),
          new Howl({ src: "../sound/click18/6.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click18/7.wav" }),
          new Howl({ src: "../sound/click18/7.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click18/8.wav" }),
          new Howl({ src: "../sound/click18/8.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click18/9.wav" }),
          new Howl({ src: "../sound/click18/9.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click18/10.wav" }),
          new Howl({ src: "../sound/click18/10.wav" }),
        ],
        counter: 0,
      },
    ],
    19: [
      {
        sounds: [
          new Howl({ src: "../sound/click19/1.wav" }),
          new Howl({ src: "../sound/click19/1.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click19/2.wav" }),
          new Howl({ src: "../sound/click19/2.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click19/3.wav" }),
          new Howl({ src: "../sound/click19/3.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click19/4.wav" }),
          new Howl({ src: "../sound/click19/4.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click19/5.wav" }),
          new Howl({ src: "../sound/click19/5.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click19/6.wav" }),
          new Howl({ src: "../sound/click19/6.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click19/7.wav" }),
          new Howl({ src: "../sound/click19/7.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click19/8.wav" }),
          new Howl({ src: "../sound/click19/8.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click19/9.wav" }),
          new Howl({ src: "../sound/click19/9.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click19/10.wav" }),
          new Howl({ src: "../sound/click19/10.wav" }),
        ],
        counter: 0,
      },
    ],
    20: [
      {
        sounds: [
          new Howl({ src: "../sound/click20/1.wav" }),
          new Howl({ src: "../sound/click20/1.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click20/2.wav" }),
          new Howl({ src: "../sound/click20/2.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click20/3.wav" }),
          new Howl({ src: "../sound/click20/3.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click20/4.wav" }),
          new Howl({ src: "../sound/click20/4.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click20/5.wav" }),
          new Howl({ src: "../sound/click20/5.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click20/6.wav" }),
          new Howl({ src: "../sound/click20/6.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click20/7.wav" }),
          new Howl({ src: "../sound/click20/7.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click20/8.wav" }),
          new Howl({ src: "../sound/click20/8.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click20/9.wav" }),
          new Howl({ src: "../sound/click20/9.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click20/10.wav" }),
          new Howl({ src: "../sound/click20/10.wav" }),
        ],
        counter: 0,
      },
    ],
    21: [
      {
        sounds: [
          new Howl({ src: "../sound/click21/1.wav" }),
          new Howl({ src: "../sound/click21/1.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click21/2.wav" }),
          new Howl({ src: "../sound/click21/2.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click21/3.wav" }),
          new Howl({ src: "../sound/click21/3.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click21/4.wav" }),
          new Howl({ src: "../sound/click21/4.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click21/5.wav" }),
          new Howl({ src: "../sound/click21/5.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click21/6.wav" }),
          new Howl({ src: "../sound/click21/6.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click21/7.wav" }),
          new Howl({ src: "../sound/click21/7.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click21/8.wav" }),
          new Howl({ src: "../sound/click21/8.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click21/9.wav" }),
          new Howl({ src: "../sound/click21/9.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click21/10.wav" }),
          new Howl({ src: "../sound/click21/10.wav" }),
        ],
        counter: 0,
      },
    ],
    22: [
      {
        sounds: [
          new Howl({ src: "../sound/click22/1.wav" }),
          new Howl({ src: "../sound/click22/1.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click22/2.wav" }),
          new Howl({ src: "../sound/click22/2.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click22/3.wav" }),
          new Howl({ src: "../sound/click22/3.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click22/4.wav" }),
          new Howl({ src: "../sound/click22/4.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click22/5.wav" }),
          new Howl({ src: "../sound/click22/5.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click22/6.wav" }),
          new Howl({ src: "../sound/click22/6.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click22/7.wav" }),
          new Howl({ src: "../sound/click22/7.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click22/8.wav" }),
          new Howl({ src: "../sound/click22/8.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click22/9.wav" }),
          new Howl({ src: "../sound/click22/9.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click22/10.wav" }),
          new Howl({ src: "../sound/click22/10.wav" }),
        ],
        counter: 0,
      },
    ],
    23: [
      {
        sounds: [
          new Howl({ src: "../sound/click23/1.wav" }),
          new Howl({ src: "../sound/click23/1.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click23/2.wav" }),
          new Howl({ src: "../sound/click23/2.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click23/3.wav" }),
          new Howl({ src: "../sound/click23/3.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click23/4.wav" }),
          new Howl({ src: "../sound/click23/4.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click23/5.wav" }),
          new Howl({ src: "../sound/click23/5.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click23/6.wav" }),
          new Howl({ src: "../sound/click23/6.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click23/7.wav" }),
          new Howl({ src: "../sound/click23/7.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click23/8.wav" }),
          new Howl({ src: "../sound/click23/8.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click23/9.wav" }),
          new Howl({ src: "../sound/click23/9.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click23/10.wav" }),
          new Howl({ src: "../sound/click23/10.wav" }),
        ],
        counter: 0,
      },
    ],
    24: [
      {
        sounds: [
          new Howl({ src: "../sound/click24/1.wav" }),
          new Howl({ src: "../sound/click24/1.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click24/2.wav" }),
          new Howl({ src: "../sound/click24/2.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click24/3.wav" }),
          new Howl({ src: "../sound/click24/3.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click24/4.wav" }),
          new Howl({ src: "../sound/click24/4.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click24/5.wav" }),
          new Howl({ src: "../sound/click24/5.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click24/6.wav" }),
          new Howl({ src: "../sound/click24/6.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click24/7.wav" }),
          new Howl({ src: "../sound/click24/7.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click24/8.wav" }),
          new Howl({ src: "../sound/click24/8.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click24/9.wav" }),
          new Howl({ src: "../sound/click24/9.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click24/10.wav" }),
          new Howl({ src: "../sound/click24/10.wav" }),
        ],
        counter: 0,
      },
    ],
    25: [
      {
        sounds: [
          new Howl({ src: "../sound/click25/1.wav" }),
          new Howl({ src: "../sound/click25/1.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click25/2.wav" }),
          new Howl({ src: "../sound/click25/2.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click25/3.wav" }),
          new Howl({ src: "../sound/click25/3.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click25/4.wav" }),
          new Howl({ src: "../sound/click25/4.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click25/5.wav" }),
          new Howl({ src: "../sound/click25/5.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click25/6.wav" }),
          new Howl({ src: "../sound/click25/6.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click25/7.wav" }),
          new Howl({ src: "../sound/click25/7.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click25/8.wav" }),
          new Howl({ src: "../sound/click25/8.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click25/9.wav" }),
          new Howl({ src: "../sound/click25/9.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click25/10.wav" }),
          new Howl({ src: "../sound/click25/10.wav" }),
        ],
        counter: 0,
      },
    ],
    26: [
      {
        sounds: [
          new Howl({ src: "../sound/click26/1.wav" }),
          new Howl({ src: "../sound/click26/1.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click26/2.wav" }),
          new Howl({ src: "../sound/click26/2.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click26/3.wav" }),
          new Howl({ src: "../sound/click26/3.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click26/4.wav" }),
          new Howl({ src: "../sound/click26/4.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click26/5.wav" }),
          new Howl({ src: "../sound/click26/5.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click26/6.wav" }),
          new Howl({ src: "../sound/click26/6.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click26/7.wav" }),
          new Howl({ src: "../sound/click26/7.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click26/8.wav" }),
          new Howl({ src: "../sound/click26/8.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click26/9.wav" }),
          new Howl({ src: "../sound/click26/9.wav" }),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Howl({ src: "../sound/click26/10.wav" }),
          new Howl({ src: "../sound/click26/10.wav" }),
        ],
        counter: 0,
      },
    ],
  };
  Howler.volume(Config.soundVolume);
}
export async function previewClick(val: PlaySoundOnClick): Promise<void> {
  if (["8", "9", "10", "11"].includes(val)) {
    playNote("KeyQ", clickSoundIdsToOscillatorType[val as DynamicClickSounds]);
    return;
  }

  if ("validNotes" in config) {
    scaleConfigurations[clickId]?.preview();
    return;
  }

  await init();

  const safeClickSounds = clickSoundConfig[clickId];
  if (safeClickSounds === undefined || safeClickSounds[0] === undefined) {
    return;
  }

  const howl = await getHowl(safeClickSounds[0]);
  howl.seek(0);
  howl.play();
}

export async function previewError(val: PlaySoundOnError): Promise<void> {
  if (val === "off") return;
  if (errorSounds === null) await initErrorSound();

  const safeErrorSounds = errorSounds as ErrorSounds;

  const errorSoundIds = Object.keys(safeErrorSounds);
  if (!errorSoundIds.includes(val)) return;

  errorSounds?.[val]?.[0]?.seek(0);
  errorSounds?.[val]?.[0]?.play();
}

let currentCode = "KeyA";

document.addEventListener("keydown", (event) => {
  currentCode = event.code || "KeyA";
});

const notes: Record<ValidNotes, ValidFrequencies> = {
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

type ValidFrequencies = number[];

type GetNoteFrequencyCallback = (octave: number) => number;

function bindToNote(
  noteFrequencies: ValidFrequencies,
  octaveOffset = 0,
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

let audioCtx: AudioContext | undefined | null;

function initAudioContext(): void {
  if (audioCtx === null) return;
  try {
    audioCtx = new AudioContext();
  } catch (e) {
    audioCtx = null;
    console.error(e);
    showErrorNotification(
      "Error initializing audio context. Notes will not play.",
      {
        error: e,
      },
    );
  }
}

type ScaleData = {
  octave: number; // current octave of scale
  direction: number; // whether scale is ascending or descending
  position: number; // current position in scale
};

function createPreviewScale(validNotes: ValidNotes[]): () => void {
  // We use a JavaScript closure to create a preview function that can be called multiple times and progress through the scale
  const scale: ScaleData = {
    position: 0,
    octave: 4,
    direction: 1,
  };

  return async () => {
    await init();
    playScale(validNotes, scale);
  };
}

type ScaleMeta = {
  preview: ReturnType<typeof createPreviewScale>;
  meta: ScaleData;
};

const defaultScaleData: ScaleData = {
  position: 0,
  octave: 4,
  direction: 1,
};

type ScaleConfigurationType = Partial<Record<PlaySoundOnClick, ScaleMeta>>;

export const scaleConfigurations: ScaleConfigurationType =
  extractScaleSounds(soundsConfig);

function playScale(validNotes: ValidNotes[], scaleMeta: ScaleData): void {
  if (audioCtx === undefined) {
    initAudioContext();
  }
  if (!audioCtx) return;

  if (Math.random() < 0.5) {
    scaleMeta.octave += scaleMeta.direction;
  }

  if (scaleMeta.octave >= 6) {
    scaleMeta.direction = -1;
  }
  if (scaleMeta.octave <= 4) {
    scaleMeta.direction = 1;
  }

  const note = randomElementFromArray(validNotes);

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

export async function playTimeWarning(): Promise<void> {
  if (timeWarning === null) await initTimeWarning();
  const soundToPlay = timeWarning as Howl;
  soundToPlay.stop();
  soundToPlay.seek(0);
  soundToPlay.play();
}

export async function playFartReverb(): Promise<void> {
  if (fartReverb === null) await initFartReverb();
  const soundToPlay = fartReverb as Howl;
  soundToPlay.stop();
  soundToPlay.seek(0);
  soundToPlay.play();
}

export async function clearAllSounds(): Promise<void> {
  const { Howler } = await getHowlerModule();
  Howler.stop();
}

function playNote(options: {
  codeOverride?: string;
  oscillatorType: SupportedOscillatorTypes;
}): void {
  if (audioCtx === undefined) {
    initAudioContext();
  }
  if (!audioCtx) return;

  currentCode = options.codeOverride ?? currentCode;
  if (!(currentCode in codeToNote)) {
    return;
  }

  const baseOctave = 3;
  const octave = baseOctave + (leftState || rightState || capsState ? 1 : 0);
  const currentFrequency = codeToNote[currentCode]?.(octave);

  const oscillatorNode = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillatorNode.type = options.oscillatorType;
  gainNode.gain.value = Config.soundVolume / 10;

  oscillatorNode.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillatorNode.frequency.value = currentFrequency as number;
  oscillatorNode.start(audioCtx.currentTime);
  gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.15); //remove click sound
  oscillatorNode.stop(audioCtx.currentTime + 0.5);
}

export async function playClick(codeOverride?: string): Promise<void> {
  const val = Config.playSoundOnClick;
  if (val === "off") return;

  const config = soundsConfig[val];

  if ("oscillatorType" in config) {
    playNote({ codeOverride, oscillatorType: config.oscillatorType });
    return;
  }

  if ("validNotes" in config) {
    const scaleConfig = scaleConfigurations[val];
    if (scaleConfig === undefined) {
      throw new Error("missing scale config");
    }
    playScale(config.validNotes, scaleConfig.meta);
    return;
  }

  await init();

  const sounds = clickSoundConfig[val];
  if (sounds === undefined) throw new Error("Invalid click sound ID");
  const randomSound = randomElementFromArray(sounds);
  const soundToPlay = await getHowl(randomSound);
  soundToPlay.seek(0);
  soundToPlay.play();
}

export async function playError(): Promise<void> {
  if (Config.playSoundOnError === "off") return;
  if (errorSounds === null) await initErrorSound();

  const sounds = (errorSounds as ErrorSounds)[Config.playSoundOnError];
  if (sounds === undefined) throw new Error("Invalid error sound ID");

  const randomSound = randomElementFromArray(sounds);
  randomSound.seek(0);
  randomSound.play();
}

async function setVolume(val: number): Promise<void> {
  try {
    const { Howler } = await getHowlerModule();
    Howler.volume(val);
  } catch {
    //
  }
}

function extractScaleSounds(
  shortConfig: SoundConfigType,
): ScaleConfigurationType {
  return Object.fromEntries(
    Object.entries(shortConfig)
      .filter(([_, cfg]) => "validNotes" in cfg)
      .map(([key, cfg]) => {
        const config = cfg as ScaleSoundConfig;

        return [
          key,
          {
            preview: createPreviewScale(config.validNotes),
            meta: { ...defaultScaleData },
          } as ScaleMeta,
        ];
      }),
  );
}

configEvent.subscribe(({ key, newValue }) => {
  if (key === "playSoundOnClick" && newValue !== "off") void init();
  if (key === "soundVolume") {
    void setVolume(newValue);
  }
});
