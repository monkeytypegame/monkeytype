import { PlaySoundOnClick } from "@monkeytype/schemas/configs";
import { Config } from "../config/store";
import {
  clickSoundConfig,
  ScaleSoundConfig,
  SoundConfigType,
  soundsConfig,
  ValidNotes,
} from "../constants/sounds";
import { randomElementFromArray } from "../utils/arrays";
import { initErrorSounds } from "./error";
import { getHowl, initHowlerVolume, playFromStart } from "./howler";
import { playNote, playScale, ScaleData } from "./synth";

const loadedBundles: Set<PlaySoundOnClick> = new Set();

export async function preloadSounds(): Promise<void> {
  await initHowlerVolume();

  //preload error sounds
  await initErrorSounds();

  //preload sounds
  const clickId = Config.playSoundOnClick;
  if (clickId === "off") return;

  if (!loadedBundles.has(clickId)) {
    loadedBundles.add(clickId);

    const config = clickSoundConfig[clickId];

    if (config === undefined) return;

    await Promise.all(config.flatMap(getHowl));
  }
}

function createPreviewScale(validNotes: ValidNotes[]): () => void {
  // We use a JavaScript closure to create a preview function that can be called multiple times and progress through the scale
  const scale: ScaleData = {
    position: 0,
    octave: 4,
    direction: 1,
  };

  return async () => {
    await preloadSounds();
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
          },
        ];
      }),
  );
}

const scaleConfigurations: ScaleConfigurationType =
  extractScaleSounds(soundsConfig);

export async function previewClick(clickId: PlaySoundOnClick): Promise<void> {
  if (clickId === "off") return;

  const config = soundsConfig[clickId];

  if ("oscillatorType" in config) {
    playNote({ codeOverride: "KeyQ", oscillatorType: config.oscillatorType });
    return;
  }

  if ("validNotes" in config) {
    scaleConfigurations[clickId]?.preview();
    return;
  }

  await preloadSounds();

  const safeClickSounds = clickSoundConfig[clickId];
  if (safeClickSounds?.[0] === undefined) {
    return;
  }

  playFromStart(await getHowl(safeClickSounds[0]));
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

  await preloadSounds();

  const sounds = clickSoundConfig[val];
  if (sounds === undefined) throw new Error("Invalid click sound ID");
  const randomSound = randomElementFromArray(sounds);
  const soundToPlay = await getHowl(randomSound);
  soundToPlay.seek(0);
  soundToPlay.play();
}
