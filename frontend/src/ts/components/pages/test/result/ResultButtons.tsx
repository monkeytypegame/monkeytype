import { createKeyHold } from "@tanstack/solid-hotkeys";
import { JSXElement, Show } from "solid-js";

import { getConfig } from "../../../../config/store";
import { getIsScreenshotting } from "../../../../states/core";
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

export function ResultButtons(props: { glarses: boolean }): JSXElement {
  const isShiftHeld = createKeyHold("Shift");

  return (
    <>
      <div
        id="resultButtonsPrefocusTarget"
        class="focus:outline-none focus-visible:outline-none"
        tabIndex="-1"
      ></div>
      <div
        class={cn(
          "grid grid-flow-col justify-center gap-4 max-sm:grid-flow-row max-sm:grid-cols-2 md:col-span-2",
          getIsScreenshotting() && "hidden",
        )}
      >
        <ResultButton
          data-ui-element="restartTestButton"
          class="max-sm:col-span-2"
          text="Next test"
          fa={{ icon: "fa-chevron-right" }}
          onClick={() => void restart()}
        />
        <ResultButton
          data-ui-element="restartTestButtonWithSameWordset"
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
              showNoticeNotification(
                "Practice words is unsupported in zen mode",
              );
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
            class="max-sm:col-span-2"
            text={"Copy screenshot to clipboard\n(shift click to download)"}
            fa={
              isShiftHeld()
                ? { icon: "fa-download" }
                : { icon: "fa-image", variant: "regular" }
            }
            onClick={(event) => {
              if (event.shiftKey) {
                void captureAndDownload();
              } else {
                void captureAndCopyToClipboard();
              }
            }}
          />
        </Show>
      </div>
    </>
  );
}

function ResultButton(props: {
  id?: string;
  class?: string;
  text: string;
  fa: FaObject;
  onClick: (event: MouseEvent) => void;
  "data-ui-element"?: string;
}): JSXElement {
  return (
    <button
      type="button"
      class={cn("text px-[2em] py-[1em]", props.class)}
      id={props.id}
      data-ui-element={props["data-ui-element"]}
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
