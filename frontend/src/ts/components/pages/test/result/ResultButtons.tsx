import { createSignal, JSXElement, onCleanup, Show } from "solid-js";

import { getConfig } from "../../../../config/store";
import { showModal } from "../../../../states/modals";
import { showNoticeNotification } from "../../../../states/notifications";
import {
  captureAndCopyToClipboard,
  captureAndDownload,
} from "../../../../test/screenshot";
import { repeatTest, restart } from "../../../../test/test-logic";
import { toggleResultWords } from "../../../../test/words-history";
import { FaObject } from "../../../../types/font-awesome";
import { cn } from "../../../../utils/cn";
import { buildBalloonHtmlProperties } from "../../../common/Balloon";
import { Fa } from "../../../common/Fa";
import { toggleReplayDisplay } from "./replay";

export function ResultButtons(props: {
  glarses: boolean;
  hidden: boolean;
}): JSXElement {
  const [isShiftHeld, setShiftHeld] = createSignal(false);

  const onKey = (event: KeyboardEvent): void => {
    if (event.key !== "Shift") return;
    setShiftHeld(event.type === "keydown");
  };
  document.addEventListener("keydown", onKey);
  document.addEventListener("keyup", onKey);
  onCleanup(() => {
    document.removeEventListener("keydown", onKey);
    document.removeEventListener("keyup", onKey);
  });

  return (
    <div class={cn("buttons", { hidden: props.hidden })}>
      <ResultButton
        id="nextTestButton"
        text="Next test"
        fa={{ icon: "fa-chevron-right" }}
        onClick={() => void restart()}
      />
      <ResultButton
        id="restartTestButtonWithSameWordset"
        text="Repeat test"
        fa={{ icon: "fa-sync-alt" }}
        onClick={repeatTest}
      />
      <ResultButton
        id="practiseWordsButton"
        text="Practice words"
        fa={{ icon: "fa-exclamation-triangle" }}
        onClick={() => {
          if (getConfig.mode === "zen") {
            showNoticeNotification("Practice words is unsupported in zen mode");
            return;
          }
          showModal("PractiseWords");
        }}
      />
      <Show when={!props.glarses}>
        <ResultButton
          id="showWordHistoryButton"
          text="Toggle words history"
          fa={{ icon: "fa-align-left" }}
          onClick={() => toggleResultWords()}
        />
        <ResultButton
          id="watchReplayButton"
          text="Watch replay"
          fa={{ icon: "fa-backward" }}
          onClick={toggleReplayDisplay}
        />
        <ResultButton
          id="saveScreenshotButton"
          text={"Copy screenshot to clipboard\n(shift click to download)"}
          fa={
            isShiftHeld()
              ? { icon: "fa-download" }
              : { icon: "fa-image", variant: "regular" }
          }
          onClick={(event) => {
            setShiftHeld(false);
            if (event.shiftKey) {
              void captureAndDownload();
            } else {
              void captureAndCopyToClipboard();
            }
          }}
        />
      </Show>
    </div>
  );
}

function ResultButton(props: {
  id: string;
  text: string;
  fa: FaObject;
  onClick: (event: MouseEvent) => void;
}): JSXElement {
  return (
    <button
      type="button"
      class="text"
      id={props.id}
      {...buildBalloonHtmlProperties({
        text: props.text,
        position: "down",
        break: props.text.includes("\n"),
      })}
      onClick={(event) => props.onClick(event)}
    >
      <Fa {...props.fa} fixedWidth />
    </button>
  );
}
