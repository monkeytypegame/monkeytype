import { CompletedEvent } from "@monkeytype/schemas/results";
import { Mode } from "@monkeytype/schemas/shared";
import objectHash from "object-hash";
import { createMemo, JSX } from "solid-js";

import Ape from "../../ape";
import { getConfig } from "../../config/store";
import { SnapshotResult } from "../../constants/default-snapshot";
import { saveLocalResult, SaveLocalResultData } from "../../db";
import { authEvent } from "../../events/auth";
import { getAuthenticatedUser } from "../../firebase";
import { hideModal, showModal } from "../../states/modals";
import {
  showErrorNotification,
  showNoticeNotification,
  showSuccessNotification,
} from "../../states/notifications";
import {
  getLastSignedOutResult,
  setLastSignedOutResult,
} from "../../states/test";
import { cn } from "../../utils/cn";
import { Formatting } from "../../utils/format";
import { AnimatedModal } from "../common/AnimatedModal";
import { Button } from "../common/Button";

const modalId = "LastSignedOutResult";

export function LastSignedOutResultModal() {
  const format = createMemo(
    () =>
      new Formatting({
        alwaysShowDecimalPlaces: getConfig.alwaysShowDecimalPlaces,
        typingSpeedUnit: getConfig.typingSpeedUnit,
      }),
  );

  return (
    <AnimatedModal
      id={modalId}
      title="Last signed out result"
      modalClass="max-w-2xl"
    >
      <p class="">Would you like to save it?</p>

      <div class="grid grid-cols-2 gap-4">
        <Value
          class="text-xl"
          label={format().typingSpeedUnit}
          value={format().typingSpeed(getLastSignedOutResult()?.wpm ?? 0)}
        />
        <Value
          class="text-xl"
          label="accuracy"
          value={format().accuracy(getLastSignedOutResult()?.acc ?? 0)}
        />
        <Value
          label="raw"
          value={format().typingSpeed(getLastSignedOutResult()?.rawWpm ?? 0)}
        />
        <Value
          label="consistency"
          value={format().percentage(
            getLastSignedOutResult()?.consistency ?? 0,
          )}
        />
        <Value
          class="col-span-2"
          label="characters"
          value={getLastSignedOutResult()?.charStats.join("/") ?? "-"}
        />
        <Value
          label="test type"
          class="col-span-2"
          value={formatTestType(getLastSignedOutResult())}
        />

        <Button
          text="discard"
          onClick={() => {
            setLastSignedOutResult(null);
            showNoticeNotification("Last test result discarded");
            hideModal(modalId);
          }}
        />
        <Button
          text="save"
          onClick={() => {
            void syncLastSignedOutResult();
          }}
        />
      </div>
    </AnimatedModal>
  );
}

function Value(props: {
  label: string;
  value: string | (string | JSX.Element)[];
  class?: string;
}) {
  return (
    <div class={cn("flex flex-col text-sm", props.class)}>
      <span class="text-[0.75em] text-sub">{props.label}</span>
      <span>{props.value}</span>
    </div>
  );
}

function formatTestType(r: CompletedEvent | null): (string | JSX.Element)[] {
  if (r === null) return ["-"];
  const tt: (string | JSX.Element)[] = [`${r.mode} ${r.mode2}`];

  tt.push(<br />, `${r.language}`);

  if (r.numbers) tt.push(<br />, "numbers");
  if (r.punctuation) tt.push(<br />, "punctuation");
  if (r.blindMode) tt.push(<br />, "blind");
  if (r.lazyMode) tt.push(<br />, "lazy");
  if (r.funbox.length > 0) {
    const funboxLabel = r.funbox.map((it) => it.replace(/_/g, " ")).join(",");
    tt.push(<br />, funboxLabel);
  }
  if (r.difficulty !== "normal") tt.push(<br />, `${r.difficulty}`);
  if (r.tags.length > 0) tt.push(<br />, `${r.tags.length} tags`);
  return tt;
}

async function syncLastSignedOutResult(): Promise<void> {
  const user = getAuthenticatedUser();
  const lastResult = getLastSignedOutResult();
  if (user === null) {
    showNoticeNotification(
      "Failed to save last test result: user not authenticated",
    );
    hideModal(modalId);
    return;
  }
  if (lastResult === null) {
    showNoticeNotification("Failed to save last test result: no last result");
    hideModal(modalId);
    return;
  }

  const updatedResult = updateUidAndHash(user.uid, lastResult);
  const response = await Ape.results.add({ body: { result: updatedResult } });

  if (response.status !== 200) {
    showErrorNotification(`Failed to save last result`, {
      response,
    });
    hideModal(modalId);
    return;
  }

  //TODO - this type cast was not needed before because we were using JSON cloning
  // but now with the stronger types it shows that we are forcing completed event
  // into a snapshot result - might not cause issues but worth investigating
  const result = structuredClone(
    updatedResult,
  ) as unknown as SnapshotResult<Mode>;

  const dataToSave: SaveLocalResultData = {
    xp: response.body.data.xp,
    streak: response.body.data.streak,
    result,
    isPb: response.body.data.isPb,
  };

  result._id = response.body.data.insertedId;
  if (response.body.data.isPb) {
    result.isPb = true;
  }
  saveLocalResult(dataToSave);
  setLastSignedOutResult(null);
  showSuccessNotification(
    `Last test result saved ${response.body.data.isPb ? `(new pb!)` : ""}`,
  );
  hideModal(modalId);
}

export function updateUidAndHash(
  uid: string,
  notSignedInLastResult: CompletedEvent,
): CompletedEvent {
  notSignedInLastResult.uid = uid;
  //@ts-expect-error really need to delete this
  delete notSignedInLastResult.hash;
  notSignedInLastResult.hash = objectHash(notSignedInLastResult);
  return notSignedInLastResult;
}

authEvent.subscribe((event) => {
  if (event.type === "snapshotUpdated" && event.data.isInitial) {
    if (getLastSignedOutResult() !== null) {
      showModal(modalId);
    }
  }
});
