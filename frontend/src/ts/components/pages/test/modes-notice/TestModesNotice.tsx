import { createMemo } from "solid-js";

import { getActiveTags } from "../../../../queries/tags";
import { showCommandline } from "../../../../states/commandline";
import { getCustomTextIndicator, getFormatting } from "../../../../states/core";
import { hotkeys } from "../../../../states/hotkeys";
import {
  isFocusMode,
  getLoadedChallenge,
  getPaceCaretWpm,
  isPaceRepeat,
  isRepeated,
  wordsHaveNewline,
  wordsHaveTab,
} from "../../../../states/test";
import { testConfigView as config } from "../../../../states/test-config-view";
import { cn } from "../../../../utils/cn";
import {
  getLanguageDisplayString,
  replaceUnderscoresWithSpaces,
} from "../../../../utils/strings";
import { Kbd } from "../../../common/Kbd";
import { AverageNotice } from "./AverageNotice";
import { Notice } from "./Notice";
import { PbNotice } from "./PbNotice";

export function TestModesNotice() {
  return (
    <div
      class={cn(
        "flex flex-wrap justify-center gap-x-4 text-base text-sub transition-opacity duration-125 select-none",
        {
          "opacity-0": isFocusMode(),
        },
      )}
    >
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
      <DeleteOnError />
      <Layout />
      <OppositeShift />
      <Tags />
    </div>
  );
}

function Repeated() {
  return (
    <Notice
      when={isRepeated() && config.mode !== "quote"}
      class="text-error"
      icon="fa-sync-alt"
      text="repeated"
    />
  );
}

function ResultSaving() {
  return (
    <Notice
      when={!config.resultSaving}
      icon="fa-save"
      openCommandline="resultSaving"
      class="text-error"
      text="saving disabled"
    />
  );
}

function QuickRestart() {
  return (
    <>
      <Notice when={wordsHaveTab() && config.quickRestart === "esc"}>
        <Kbd hotkey={hotkeys.commandline} /> to open commandline
      </Notice>
      <Notice
        when={
          wordsHaveTab() &&
          (config.quickRestart === "tab" || config.quickRestart === "esc")
        }
      >
        <Kbd hotkey={hotkeys.quickRestart} /> to restart
      </Notice>

      <Notice
        when={
          config.quickRestart === "enter" &&
          (wordsHaveNewline() || config.funbox.includes("58008"))
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
      when={config.mode === "custom" && getCustomTextIndicator()?.isLong}
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
      text={getLoadedChallenge()?.display}
    />
  );
}

function ZenMode() {
  return (
    <Notice when={config.mode === "zen"}>
      <Kbd hotkey="Shift+Enter" /> to finish zen
    </Notice>
  );
}

function Language() {
  const isUsingPolyglot = (): boolean => config.funbox.includes("polyglot");

  return (
    <>
      <Notice
        when={config.mode !== "zen" && !isUsingPolyglot()}
        icon="fa-globe-americas"
        openCommandline="language"
        text={getLanguageDisplayString(
          config.language,
          config.mode === "quote",
        )}
      />
      <Notice
        when={config.funbox.includes("polyglot")}
        icon="fa-globe-americas"
        onClick={() =>
          showCommandline({ commandOverride: "setCustomPolyglotCustom" })
        }
        text={config.customPolyglot
          .map((lang) => getLanguageDisplayString(lang, true))
          .join(", ")}
      />
    </>
  );
}

function Difficulty() {
  return (
    <Notice
      when={config.difficulty === "expert" || config.difficulty === "master"}
      icon={config.difficulty === "expert" ? "fa-star-half-alt" : "fa-star"}
      onClick={() => showCommandline({ subgroupOverride: "difficulty" })}
      text={config.difficulty}
    />
  );
}

function BlindMode() {
  return (
    <Notice
      when={config.blindMode}
      icon="fa-eye-slash"
      openCommandline="blindMode"
      text="blind"
    />
  );
}

function LazyMode() {
  return (
    <Notice
      when={config.lazyMode}
      icon="fa-couch"
      openCommandline="lazyMode"
      text="lazy"
    />
  );
}

function PaceCaretNotice() {
  const displaySpeed = createMemo(() => {
    let type: string = config.paceCaret;
    if (type === "off") type = "custom";
    else if (type === "tagPb") type = "tag pb";

    const format = getFormatting();
    const speed = format.typingSpeed(getPaceCaretWpm() ?? 0, {
      showDecimalPlaces: false,
      suffix: ` ${config.typingSpeedUnit}`,
    });

    return `${type} pace ${speed}`;
  });

  return (
    <Notice
      when={
        config.paceCaret !== "off" || (config.repeatedPace && isPaceRepeat())
      }
      icon="fa-tachometer-alt"
      openCommandline="paceCaret"
      text={displaySpeed()}
    />
  );
}

function MinSpeed() {
  const displaySpeed = createMemo(() => {
    const format = getFormatting();
    const speed = format.typingSpeed(config.minWpmCustomSpeed ?? 0, {
      showDecimalPlaces: false,
      suffix: ` ${config.typingSpeedUnit}`,
    });

    return `min ${speed}`;
  });

  return (
    <Notice
      when={config.minWpm !== "off"}
      icon="fa-bomb"
      openCommandline="minWpm"
      text={displaySpeed()}
    />
  );
}

function MinAcc() {
  const displayAcc = createMemo(() => {
    const format = getFormatting();
    const acc = format.accuracy(config.minAccCustom, {
      showDecimalPlaces: false,
      suffix: " acc",
    });

    return `min ${acc}`;
  });

  return (
    <Notice
      when={config.minAcc !== "off"}
      icon="fa-bomb"
      openCommandline="minAcc"
      text={displayAcc()}
    />
  );
}

function MinBurst() {
  const displaySpeed = createMemo(() => {
    const format = getFormatting();
    const speed = format.typingSpeed(config.minBurstCustomSpeed ?? 0, {
      showDecimalPlaces: false,
      suffix: ` ${config.typingSpeedUnit}`,
    });

    return `min ${speed} burst ${config.minBurst === "flex" ? "(flex)" : ""}`;
  });

  return (
    <Notice
      when={config.minBurst !== "off"}
      icon="fa-bomb"
      openCommandline="minBurst"
      text={displaySpeed()}
    />
  );
}

function Funbox() {
  const funboxes = createMemo(() => {
    //config.funbox doesn't work reactive, wrapping in a memo
    if (config.funbox.length === 0) return undefined;
    return [...config.funbox].map(replaceUnderscoresWithSpaces).join(", ");
  });

  return (
    <Notice
      when={funboxes() !== undefined}
      icon="fa-gamepad"
      openCommandline="funbox"
      text={funboxes()}
    />
  );
}

function ConfidenceMode() {
  return (
    <Notice
      when={config.confidenceMode !== "off"}
      icon="fa-backspace"
      openCommandline="confidenceMode"
      text={config.confidenceMode === "max" ? "max confidence" : "confidence"}
    />
  );
}

function StopOnError() {
  return (
    <Notice
      when={config.stopOnError !== "off"}
      icon="fa-hand-paper"
      openCommandline="stopOnError"
      text={`stop on ${config.stopOnError}`}
    />
  );
}

function DeleteOnError() {
  return (
    <Notice
      when={config.deleteOnError !== "off"}
      icon="fa-eraser"
      openCommandline="deleteOnError"
      text={`delete on ${replaceUnderscoresWithSpaces(config.deleteOnError)}`}
    />
  );
}

function Layout() {
  return (
    <Notice
      when={config.layout !== "default"}
      icon="fa-keyboard"
      openCommandline="layout"
      text={`emulating ${replaceUnderscoresWithSpaces(config.layout)}`}
    />
  );
}

function OppositeShift() {
  return (
    <Notice
      when={config.oppositeShiftMode !== "off"}
      icon="fa-exchange-alt"
      openCommandline="oppositeShiftMode"
      text={`opposite shift${config.oppositeShiftMode === "keymap" ? " (keymap)" : ""}`}
    />
  );
}

function Tags() {
  return (
    <Notice
      when={getActiveTags().length > 0}
      icon={getActiveTags().length === 1 ? "fa-tag" : "fa-tags"}
      openCommandline="tags"
      text={getActiveTags()
        .map((tag) => tag.name)
        .join(", ")}
    />
  );
}
