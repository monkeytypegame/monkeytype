import Config from "../config";
import * as JSONData from "../utils/json-data";
import * as ConfigEvent from "../observables/config-event";
import * as SoundController from "./sound-controller";

let voice: SpeechSynthesisUtterance | undefined;
let isInitialized = false;
let isSpeaking = false;
let currentWordIndex = -1;
let totalWords = 0;

// Audio oscillator for additional feedback
let audioContext: AudioContext | undefined;

async function initAudioContext(): Promise<void> {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
}

export async function setLanguage(lang = Config.language): Promise<void> {
  if (!voice) return;
  const language = await JSONData.getLanguage(lang);
  const bcp = language.bcp47 ?? "en-US";
  voice.lang = bcp;
}

export async function init(): Promise<void> {
  if (isInitialized) return;

  voice = new SpeechSynthesisUtterance();
  await setLanguage();
  await initAudioContext();

  isInitialized = true;
  currentWordIndex = -1;
  totalWords = 0;
}

export function clear(): void {
  window.speechSynthesis.cancel();
  voice = undefined;
  isInitialized = false;
  isSpeaking = false;
  currentWordIndex = -1;
  totalWords = 0;
}

export function stop(): void {
  window.speechSynthesis.cancel();
  isSpeaking = false;
}

async function speak(text: string, rate?: number): Promise<void> {
  if (!isInitialized) await init();
  if (voice === undefined) return;

  window.speechSynthesis.cancel();

  voice.text = text;
  voice.rate = rate ?? Config.blindModeSpeechRate;

  isSpeaking = true;

  window.speechSynthesis.speak(voice);

  // Wait for speech to end
  voice.onend = () => {
    isSpeaking = false;
  };
}

// Play a short beep for correct keypress (minimal mode)
async function playCorrectBeep(): Promise<void> {
  if (!audioContext) await initAudioContext();
  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 800; // Higher pitch for correct
  gainNode.gain.value = 0.1 * Config.soundVolume;

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.05); // Very short beep
}

// Play a short buzz for incorrect keypress (minimal mode)
async function playIncorrectBuzz(): Promise<void> {
  if (!audioContext) await initAudioContext();
  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 200; // Lower pitch for incorrect
  oscillator.type = "sawtooth"; // Harsher sound
  gainNode.gain.value = 0.15 * Config.soundVolume;

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.1); // Slightly longer buzz
}

// Play word completion sound
async function playWordCompletionSound(): Promise<void> {
  if (!audioContext) await initAudioContext();
  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 1200; // High pitch ding
  gainNode.gain.setValueAtTime(0.2 * Config.soundVolume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.2);
}

/**
 * Announces the next word to type
 */
export async function announceNextWord(word: string, wordIndex: number): Promise<void> {
  if (Config.blindModeAudioFeedback === "off") return;
  if (!Config.blindMode) return;

  currentWordIndex = wordIndex;

  if (Config.blindModeAudioFeedback === "full") {
    // In full mode, speak each word
    await speak(word);
  } else if (Config.blindModeAudioFeedback === "minimal") {
    // In minimal mode, just play a tone to indicate word transition
    void playWordCompletionSound();
  }
}

/**
 * Provides feedback on keypress (correct or incorrect)
 */
export function feedbackOnKeypress(isCorrect: boolean): void {
  if (Config.blindModeAudioFeedback === "off") return;
  if (!Config.blindMode) return;

  if (Config.blindModeAudioFeedback === "minimal") {
    if (isCorrect) {
      void playCorrectBeep();
    } else {
      void playIncorrectBuzz();
    }
  } else if (Config.blindModeAudioFeedback === "full") {
    // In full mode, use existing error sound for mistakes
    // Correct keypresses can have a subtle beep
    if (isCorrect) {
      void playCorrectBeep();
    } else {
      void playIncorrectBuzz();
    }
  }
}

/**
 * Announces when a word is completed
 */
export async function announceWordCompletion(isCorrect: boolean): Promise<void> {
  if (Config.blindModeAudioFeedback === "off") return;
  if (!Config.blindMode) return;

  void playWordCompletionSound();

  if (Config.blindModeAudioFeedback === "full") {
    if (isCorrect) {
      // Optional: could speak "correct" or just play the sound
    } else {
      await speak("incorrect");
    }
  }
}

/**
 * Announces test start
 */
export async function announceTestStart(
  mode: string,
  value: number,
  language: string
): Promise<void> {
  if (Config.blindModeAudioFeedback === "off") return;
  if (!Config.blindMode) return;

  if (Config.blindModeAudioFeedback === "full") {
    if (mode === "time") {
      await speak(`${value} second test starting`);
    } else if (mode === "words") {
      totalWords = value;
      await speak(`${value} word test starting`);
    } else {
      await speak("Test starting");
    }
  }
}

/**
 * Announces test completion with results
 */
export async function announceTestComplete(
  wpm: number,
  accuracy: number
): Promise<void> {
  if (Config.blindModeAudioFeedback === "off") return;
  if (!Config.blindMode) return;

  if (Config.blindModeAudioFeedback === "full") {
    const wpmRounded = Math.round(wpm);
    const accRounded = Math.round(accuracy);
    await speak(
      `Test complete. ${wpmRounded} words per minute, ${accRounded} percent accuracy`
    );
  } else if (Config.blindModeAudioFeedback === "minimal") {
    // Play a completion sound sequence
    if (audioContext) {
      const playNote = (freq: number, delay: number): void => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.value = freq;
          gainNode.gain.value = 0.15 * Config.soundVolume;

          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.15);
        }, delay);
      };

      // Play a pleasant ascending sequence
      playNote(523, 0);    // C
      playNote(659, 150);  // E
      playNote(784, 300);  // G
    }
  }
}

/**
 * Announces remaining time (for time warnings)
 */
export async function announceTimeWarning(secondsLeft: number): Promise<void> {
  if (Config.blindModeAudioFeedback === "off") return;
  if (!Config.blindMode) return;

  if (Config.blindModeAudioFeedback === "full") {
    await speak(`${secondsLeft} seconds remaining`);
  }

  // Always play the time warning sound
  SoundController.playTimeWarning();
}

/**
 * Announces progress (e.g., halfway through)
 */
export async function announceProgress(percentage: number): Promise<void> {
  if (Config.blindModeAudioFeedback === "off") return;
  if (!Config.blindMode) return;

  if (Config.blindModeAudioFeedback === "full") {
    if (percentage === 25) {
      await speak("Quarter way");
    } else if (percentage === 50) {
      await speak("Halfway");
    } else if (percentage === 75) {
      await speak("Three quarters");
    }
  }
}

// Listen to config changes
ConfigEvent.subscribe((eventKey) => {
  if (eventKey === "blindMode") {
    if (Config.blindMode && Config.blindModeAudioFeedback !== "off") {
      void init();
    } else {
      clear();
    }
  }
  if (eventKey === "blindModeAudioFeedback") {
    if (Config.blindMode && Config.blindModeAudioFeedback !== "off") {
      void init();
    } else {
      clear();
    }
  }
  if (eventKey === "language" && Config.blindMode) {
    void setLanguage();
  }
});
