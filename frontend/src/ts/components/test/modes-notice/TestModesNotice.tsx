import { createMemo, Show } from "solid-js";

import { useActiveTagsLiveQuery } from "../../../collections/tags";
import * as Commandline from "../../../commandline/commandline";
import { getConfig } from "../../../config/store";
import {
  getCustomTextIndicator,
  showCommandLineForConfig,
} from "../../../states/core";
import { hotkeys } from "../../../states/hotkeys";
import {
  getLoadedChallenge,
  getPaceCaretWpm,
  isPaceRepeat,
  isRepeated,
  wordsHaveNewline,
  wordsHaveTab,
} from "../../../states/test";
import { getActiveFunboxNames } from "../../../test/funbox/list";
import { Formatting } from "../../../utils/format";
import {
  getLanguageDisplayString,
  replaceUnderscoresWithSpaces,
} from "../../../utils/strings";
import { Kbd } from "../../common/Kbd";
import { AverageNotice } from "./AverageNotice";
import { Notice } from "./Notice";
import { PbNotice } from "./PbNotice";
export function TestModesNotice() {
  return (
    <div class="flex flex-wrap justify-center gap-x-4 text-base text-sub transition-opacity select-none">
      <Repeated />
      <ResultSaving />
      <QuickRestart />
      <LongText />
      <LoadedChallenge />
      <ZenMode />
      <Language />
      <Difficulty />
      <BlindMode />
      <LazyMode />
      <PaceCaretNotice />
      <AverageNotice />
      <PbNotice />
      <MinSpeed />
      <MinAcc />
      <MinBurst />
      <Funbox />
      <ConfidenceMode />
      <StopOnError />
      <Layout />
      <OppositeShift />
      <Tags />
    </div>
  );
}

function Repeated() {
  return (
    <Notice
      when={isRepeated() && getConfig.mode !== "quote"}
      class="text-error"
      icon="fa-sync-alt"
    >
      repeated
    </Notice>
  );
}

function ResultSaving() {
  return (
    <Notice
      when={!getConfig.resultSaving}
      icon="fa-save"
      openCommandline="resultSaving"
      class="text-error"
    >
      saving disabled
    </Notice>
  );
}

function QuickRestart() {
  return (
    <>
      <Notice when={wordsHaveTab() && getConfig.quickRestart === "esc"}>
        <Kbd hotkey={hotkeys.commandline} /> to open commandline
      </Notice>
      <Notice
        when={
          wordsHaveTab() &&
          (getConfig.quickRestart === "tab" || getConfig.quickRestart === "esc")
        }
      >
        <Kbd hotkey={hotkeys.quickRestart} /> to restart
      </Notice>

      <Notice
        when={
          getConfig.quickRestart === "enter" &&
          (wordsHaveNewline() || getConfig.funbox.includes("58008"))
        }
      >
        <Kbd hotkey={hotkeys.quickRestart} /> to restart
      </Notice>
    </>
  );
}

function LongText() {
  return (
    <Notice
      when={getConfig.mode === "custom" && getCustomTextIndicator()?.isLong}
      icon="fa-book"
    >
      {getCustomTextIndicator()?.name} (
      <Kbd hotkey="Shift+Enter" /> to save progress)
    </Notice>
  );
}

function LoadedChallenge() {
  return (
    <Notice
      when={getLoadedChallenge() !== null}
      icon="fa-award"
      openCommandline="loadChallenge"
    >
      {getLoadedChallenge()?.display}
    </Notice>
  );
}

function ZenMode() {
  return (
    <Show when={getConfig.mode === "zen"}>
      <div>
        <Kbd hotkey="Shift+Enter" /> to finish zen
      </div>
    </Show>
  );
}

function Language() {
  const isUsingPolyglot = createMemo(() => {
    //react on config.funbox
    const _ = getConfig.funbox;
    return getActiveFunboxNames().includes("polyglot");
  });

  return (
    <>
      <Notice
        when={getConfig.mode !== "zen" && !isUsingPolyglot()}
        icon="fa-globe-americas"
        openCommandline="language"
      >
        {getLanguageDisplayString(
          getConfig.language,
          getConfig.mode === "quote",
        )}
      </Notice>
      <Notice
        when={getConfig.funbox.includes("polyglot")}
        icon="fa-globe-americas"
        onClick={() =>
          Commandline.show({ commandOverride: "setCustomPolyglotCustom" })
        }
      >
        {getConfig.customPolyglot
          .map((lang) => getLanguageDisplayString(lang, true))
          .join(", ")}
      </Notice>
    </>
  );
}

function Difficulty() {
  return (
    <Notice
      when={
        getConfig.difficulty === "expert" || getConfig.difficulty === "master"
      }
      icon={getConfig.difficulty === "expert" ? "fa-star-half-alt" : "fa-star"}
      onClick={() => showCommandLineForConfig("difficulty")}
    >
      {getConfig.difficulty}
    </Notice>
  );
}

function BlindMode() {
  return (
    <Notice
      when={getConfig.blindMode}
      icon="fa-eye-slash"
      openCommandline="blindMode"
    >
      blind
    </Notice>
  );
}

function LazyMode() {
  return (
    <Notice
      when={getConfig.lazyMode}
      icon="fa-couch"
      openCommandline="lazyMode"
    >
      lazy
    </Notice>
  );
}

function PaceCaretNotice() {
  const format = createMemo(() => new Formatting(getConfig));
  return (
    <Notice
      when={
        getConfig.paceCaret !== "off" ||
        (getConfig.repeatedPace && isPaceRepeat())
      }
      icon="fa-tachometer-alt"
      openCommandline="paceCaret"
    >
      <Show
        when={getConfig.paceCaret === "tagPb"}
        fallback={getConfig.paceCaret}
      >
        tag pb
      </Show>{" "}
      pace{" "}
      {format().typingSpeed(getPaceCaretWpm() ?? 0, {
        showDecimalPlaces: false,
        suffix: ` ${getConfig.typingSpeedUnit}`,
      })}
    </Notice>
  );
}

function MinSpeed() {
  const format = createMemo(() => new Formatting(getConfig));
  return (
    <Notice
      when={getConfig.minWpm !== "off"}
      icon="fa-bomb"
      openCommandline="minWpm"
    >
      min{" "}
      {format().typingSpeed(getConfig.minWpmCustomSpeed, {
        showDecimalPlaces: false,
        suffix: ` ${getConfig.typingSpeedUnit}`,
      })}
    </Notice>
  );
}

function MinAcc() {
  const format = createMemo(() => new Formatting(getConfig));
  return (
    <Notice
      when={getConfig.minAcc !== "off"}
      icon="fa-bomb"
      openCommandline="minAcc"
    >
      min{" "}
      {format().accuracy(getConfig.minAccCustom, {
        showDecimalPlaces: false,
        suffix: " acc",
      })}
    </Notice>
  );
}

function MinBurst() {
  const format = createMemo(() => new Formatting(getConfig));
  return (
    <Notice
      when={getConfig.minBurst !== "off"}
      icon="fa-bomb"
      openCommandline="minBurst"
    >
      min{" "}
      {format().typingSpeed(getConfig.minBurstCustomSpeed, {
        showDecimalPlaces: false,
        suffix: ` ${getConfig.typingSpeedUnit} burst ${getConfig.minBurst === "flex" ? "(flex)" : ""}`,
      })}
    </Notice>
  );
}

function Funbox() {
  const funboxes = createMemo(() => {
    //getConfig.funbox doesn't work reaactive, wrapping in a memo
    if (getConfig.funbox.length === 0) return undefined;
    return [...getConfig.funbox].map(replaceUnderscoresWithSpaces).join(", ");
  });

  return (
    <Notice
      when={funboxes() !== undefined}
      icon="fa-gamepad"
      openCommandline="funbox"
    >
      {funboxes()}
    </Notice>
  );
}

function ConfidenceMode() {
  return (
    <Notice
      when={getConfig.confidenceMode !== "off"}
      icon="fa-backspace"
      openCommandline="confidenceMode"
    >
      {getConfig.confidenceMode === "max" ? "max" : ""} confidence
    </Notice>
  );
}

function StopOnError() {
  return (
    <Notice
      when={getConfig.stopOnError !== "off"}
      icon="fa-hand-paper"
      openCommandline="stopOnError"
    >
      stop on {getConfig.stopOnError}
    </Notice>
  );
}

function Layout() {
  return (
    <Notice
      when={getConfig.layout !== "default"}
      icon="fa-keyboard"
      openCommandline="layout"
    >
      emulating {replaceUnderscoresWithSpaces(getConfig.layout)}
    </Notice>
  );
}

function OppositeShift() {
  return (
    <Notice
      when={getConfig.oppositeShiftMode !== "off"}
      icon="fa-exchange-alt"
      openCommandline="oppositeShiftMode"
    >
      opposite shift
      <Show when={getConfig.oppositeShiftMode === "keymap"}> (keymap)</Show>
    </Notice>
  );
}

function Tags() {
  const tags = useActiveTagsLiveQuery();

  return (
    <Notice
      when={tags().length > 0}
      icon={tags().length === 1 ? "fa-tag" : "fa-tags"}
      openCommandline="tags"
    >
      {tags()
        .map((tag) => tag.name)
        .join(", ")}
    </Notice>
  );
}
