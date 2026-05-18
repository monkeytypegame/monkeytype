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
import { Button } from "../../common/Button";
import { Fa } from "../../common/Fa";
import { Kbd } from "../../common/Kbd";
import { Last10Average } from "./Last10Average";

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
      <Last10Average />
      {/* pace caret */}
      {/* average */}
      {/* pb */}
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
    <Show when={isRepeated() && getConfig.mode !== "quote"}>
      <div class="text-error">
        <Fa icon="fa-sync-alt" /> repeated
      </div>
    </Show>
  );
}

function ResultSaving() {
  return (
    <Show when={!getConfig.resultSaving}>
      <div>
        <Button
          class="text-error"
          variant="text"
          fa={{ icon: "fa-save" }}
          onClick={() => showCommandLineForConfig("resultSaving")}
        >
          saving disabled
        </Button>
      </div>
    </Show>
  );
}

function QuickRestart() {
  return (
    <>
      <Show when={wordsHaveTab()}>
        <Show when={getConfig.quickRestart === "esc"}>
          <Kbd hotkey={hotkeys.commandline} /> to open commandline
          <Kbd hotkey={hotkeys.quickRestart} /> to restart
        </Show>
        <Show when={getConfig.quickRestart === "tab"}>
          <Kbd hotkey={hotkeys.quickRestart} /> to restart
        </Show>
      </Show>
      <Show
        when={
          getConfig.quickRestart === "enter" &&
          (wordsHaveNewline() || getConfig.funbox.includes("58008"))
        }
      >
        <Kbd hotkey={hotkeys.quickRestart} /> to restart
      </Show>
    </>
  );
}

function LongText() {
  return (
    <Show
      when={getConfig.mode === "custom" && getCustomTextIndicator()?.isLong}
    >
      <div>
        <Fa icon="fa-book" /> {getCustomTextIndicator()?.name} (
        <Kbd hotkey="Shift+Enter" /> to save progress)
      </div>
    </Show>
  );
}

function LoadedChallenge() {
  return (
    <Show when={getLoadedChallenge() !== null}>
      <div>
        <Fa icon="fa-award" /> {getLoadedChallenge()?.display}
      </div>
    </Show>
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
      <Show when={getConfig.mode !== "zen" && !isUsingPolyglot()}>
        <div>
          <Button
            variant="text"
            fa={{ icon: "fa-globe-americas" }}
            onClick={() => showCommandLineForConfig("language")}
          >
            {getLanguageDisplayString(
              getConfig.language,
              getConfig.mode === "quote",
            )}
          </Button>
        </div>
      </Show>
      <Show when={getConfig.funbox.includes("polyglot")}>
        <div>
          <Button
            variant="text"
            fa={{ icon: "fa-globe-americas" }}
            onClick={() =>
              Commandline.show({ commandOverride: "setCustomPolyglotCustom" })
            }
          >
            {getConfig.customPolyglot
              .map((lang) => getLanguageDisplayString(lang, true))
              .join(", ")}
          </Button>
        </div>
      </Show>
    </>
  );
}

function Difficulty() {
  return (
    <Show
      when={
        getConfig.difficulty === "expert" || getConfig.difficulty === "master"
      }
    >
      <div>
        <Button
          variant="text"
          fa={{
            icon:
              getConfig.difficulty === "expert"
                ? "fa-star-half-alt"
                : "fa-star",
          }}
          onClick={() => showCommandLineForConfig("difficulty")}
        >
          {getConfig.difficulty}
        </Button>
      </div>
    </Show>
  );
}

function BlindMode() {
  return (
    <Show when={getConfig.blindMode}>
      <div>
        <Button
          variant="text"
          fa={{ icon: "fa-eye-slash" }}
          onClick={() => showCommandLineForConfig("blindMode")}
        >
          blind
        </Button>
      </div>
    </Show>
  );
}

function LazyMode() {
  return (
    <Show when={getConfig.lazyMode}>
      <div>
        <Button
          variant="text"
          fa={{ icon: "fa-couch" }}
          onClick={() => showCommandLineForConfig("lazyMode")}
        >
          lazy
        </Button>
      </div>
    </Show>
  );
}

function MinSpeed() {
  const format = createMemo(() => new Formatting(getConfig));
  return (
    <Show when={getConfig.minWpm !== "off"}>
      <div>
        <Button
          variant="text"
          fa={{ icon: "fa-bomb" }}
          onClick={() => showCommandLineForConfig("minWpm")}
        >
          min{" "}
          {format().typingSpeed(getConfig.minWpmCustomSpeed, {
            showDecimalPlaces: false,
            suffix: ` ${getConfig.typingSpeedUnit}`,
          })}
        </Button>
      </div>
    </Show>
  );
}

function MinAcc() {
  const format = createMemo(() => new Formatting(getConfig));
  return (
    <Show when={getConfig.minAcc !== "off"}>
      <div>
        <Button
          variant="text"
          fa={{ icon: "fa-bomb" }}
          onClick={() => showCommandLineForConfig("minAcc")}
        >
          min{" "}
          {format().accuracy(getConfig.minAccCustom, {
            showDecimalPlaces: false,
            suffix: " acc",
          })}
        </Button>
      </div>
    </Show>
  );
}

function MinBurst() {
  const format = createMemo(() => new Formatting(getConfig));
  return (
    <Show when={getConfig.minBurst !== "off"}>
      <div>
        <Button
          variant="text"
          fa={{ icon: "fa-bomb" }}
          onClick={() => showCommandLineForConfig("minBurst")}
        >
          min{" "}
          {format().typingSpeed(getConfig.minBurstCustomSpeed, {
            showDecimalPlaces: false,
            suffix: ` ${getConfig.typingSpeedUnit} burst ${getConfig.minBurst === "flex" ? "(flex)" : ""}`,
          })}
        </Button>
      </div>
    </Show>
  );
}

function Funbox() {
  //TODO not working when removing/adding funboxes (try empty). getconfig.funbox doesnt seem to be fully reactive
  return (
    <Show when={getConfig.funbox.length > 0}>
      <div>
        <Button
          variant="text"
          fa={{ icon: "fa-gamepad" }}
          onClick={() => showCommandLineForConfig("funbox")}
        >
          {getConfig.funbox.map(replaceUnderscoresWithSpaces).join(", ")}
        </Button>
      </div>
    </Show>
  );
}

function ConfidenceMode() {
  return (
    <Show when={getConfig.confidenceMode !== "off"}>
      <div>
        <Button
          variant="text"
          fa={{ icon: "fa-backspace" }}
          onClick={() => showCommandLineForConfig("confidenceMode")}
        >
          {getConfig.confidenceMode === "max" ? "max" : ""} confidence
        </Button>
      </div>
    </Show>
  );
}

function StopOnError() {
  return (
    <Show when={getConfig.stopOnError !== "off"}>
      <div>
        <Button
          variant="text"
          fa={{ icon: "fa-hand-paper" }}
          onClick={() => showCommandLineForConfig("stopOnError")}
        >
          stop on {getConfig.stopOnError}
        </Button>
      </div>
    </Show>
  );
}

function Layout() {
  return (
    <Show when={getConfig.layout !== "default"}>
      <div>
        <Button
          variant="text"
          fa={{ icon: "fa-keyboard" }}
          onClick={() => showCommandLineForConfig("layout")}
        >
          emulating {replaceUnderscoresWithSpaces(getConfig.layout)}
        </Button>
      </div>
    </Show>
  );
}

function OppositeShift() {
  return (
    <Show when={getConfig.oppositeShiftMode !== "off"}>
      <div>
        <Button
          variant="text"
          fa={{ icon: "fa-exchange-alt" }}
          onClick={() => showCommandLineForConfig("oppositeShiftMode")}
        >
          opposite shift
          <Show when={getConfig.oppositeShiftMode === "keymap"}> (keymap)</Show>
        </Button>
      </div>
    </Show>
  );
}

function Tags() {
  const tags = useActiveTagsLiveQuery();

  return (
    <Show when={tags().length > 0}>
      <div>
        <Button
          variant="text"
          fa={{ icon: tags().length === 1 ? "fa-tag" : "fa-tags" }}
          onClick={() => showCommandLineForConfig("tags")}
        >
          {tags()
            .map((tag) => tag.name)
            .join(", ")}
        </Button>
      </div>
    </Show>
  );
}
