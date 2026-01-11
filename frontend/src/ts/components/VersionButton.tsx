import { JSXElement, Show, createSignal } from "solid-js";
import { isDevEnvironment } from "../utils/misc";
import * as Version from "../states/version";
import { envConfig } from "virtual:env-config";
import { COMPATIBILITY_CHECK } from "@monkeytype/contracts";
import { lastSeenServerCompatibility } from "../ape/adapters/ts-rest-adapter";
import * as VersionHistoryModal from "./VersionHistoryModal";

export function VersionButton(): JSXElement {
  const [indicatorVisible, setIndicatorVisible] = createSignal(true);
  const getVersionText = (): string => {
    if (isDevEnvironment()) {
      return "localhost";
    }
    return Version.get();
  };

  const handleClick = (e: MouseEvent): void => {
    if (e.shiftKey) {
      alert(
        JSON.stringify(
          {
            clientVersion: envConfig.clientVersion,
            clientCompatibility: COMPATIBILITY_CHECK,
            lastSeenServerCompatibility,
          },
          null,
          2,
        ),
      );
    } else {
      VersionHistoryModal.show();
      setIndicatorVisible(false);
    }
  };

  const handleIndicatorClick = (e: MouseEvent): void => {
    e.stopPropagation();
    setIndicatorVisible(false);
  };

  return (
    <button
      type="button"
      class="currentVersion textButton"
      onClick={handleClick}
    >
      <i class="fas fa-fw fa-code-branch"></i>
      <div class="text">{getVersionText()}</div>
      <Show when={!isDevEnvironment() && Version.isNew() && indicatorVisible()}>
        <div id="newVersionIndicator" onClick={handleIndicatorClick}>
          new
        </div>
      </Show>
    </button>
  );
}
