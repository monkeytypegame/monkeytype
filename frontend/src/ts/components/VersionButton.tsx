import { JSXElement, Show, createSignal } from "solid-js";
import { isDevEnvironment } from "../utils/misc";
import { envConfig } from "virtual:env-config";
import { COMPATIBILITY_CHECK } from "@monkeytype/contracts";
import { lastSeenServerCompatibility } from "../ape/adapters/ts-rest-adapter";
import { getVersion } from "../signals/core";
import { showModal } from "../stores/modals";

export function VersionButton(): JSXElement {
  const [indicatorVisible, setIndicatorVisible] = createSignal(true);
  const getVersionText = (): string => {
    if (isDevEnvironment()) {
      return "localhost";
    }
    return getVersion().text;
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
      showModal("VersionHistory");
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
      <Show
        when={!isDevEnvironment() && getVersion().isNew && indicatorVisible()}
      >
        <div id="newVersionIndicator" onClick={handleIndicatorClick}>
          new
        </div>
      </Show>
    </button>
  );
}
