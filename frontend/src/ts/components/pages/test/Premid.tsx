import { getConfig } from "../../../config/store";
import { currentLiveStats, getCurrentQuote } from "../../../states/test";
import { getMode2 } from "../../../utils/misc";
import { getLanguageDisplayString } from "../../../utils/strings";

/**
 * Hidden elements read by the PreMiD browser extension to show Discord rich
 * presence. Not visible to the user.
 */
export function Premid() {
  const testMode = () => {
    const mode2 = getMode2(getConfig, getCurrentQuote());
    const funbox =
      getConfig.funbox.length > 0 ? ` ${getConfig.funbox.join(" ")}` : "";
    return `${getConfig.mode} ${mode2} ${getLanguageDisplayString(
      getConfig.language,
    )}${funbox}`;
  };

  const secondsLeft = () => getConfig.time - (currentLiveStats.seconds ?? 0);

  return (
    <>
      <div id="premidTestMode" class="hidden">
        {testMode()}
      </div>
      <div id="premidSecondsLeft" class="hidden">
        {secondsLeft()}
      </div>
    </>
  );
}
