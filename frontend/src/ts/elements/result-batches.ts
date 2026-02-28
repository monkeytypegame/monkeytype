import * as DB from "../db";
import * as ServerConfiguration from "../ape/server-configuration";
import { blendTwoHexColors } from "../utils/colors";
import { mapRange } from "@monkeytype/util/numbers";
import { getTheme } from "../signals/theme";
import { qs } from "../utils/dom";

export function hide(): void {
  qs(".pageAccount .resultBatches")?.hide();
}

export function show(): void {
  qs(".pageAccount .resultBatches")?.show();
}

export async function update(): Promise<void> {
  const results = DB.getSnapshot()?.results;

  if (results === undefined) {
    console.error(
      "(Result batches) Results are missing but they should be available at the time of drawing the account page?",
    );
    hide();
    return;
  }

  enableButton();

  const completedTests = DB.getSnapshot()?.typingStats?.completedTests ?? 0;
  const percentageDownloaded = Math.round(
    (results.length / completedTests) * 100,
  );
  const limits = ServerConfiguration.get()?.results.limits ?? {
    regularUser: 0,
    premiumUser: 0,
  };
  const currentLimit = DB.getSnapshot()?.isPremium
    ? limits.premiumUser
    : limits.regularUser;
  const percentageLimit = Math.round((results?.length / currentLimit) * 100);

  const barsWrapper = qs(".pageAccount .resultBatches .bars");

  const bars = {
    downloaded: {
      fill: barsWrapper?.qs(".downloaded .fill"),
      rightText: barsWrapper?.qs(".downloaded.rightText"),
    },
    limit: {
      fill: barsWrapper?.qs(".limit .fill"),
      rightText: barsWrapper?.qs(".limit.rightText"),
    },
  };

  bars.downloaded.fill?.setStyle({
    width: Math.min(percentageDownloaded, 100) + "%",
  });
  bars.downloaded.rightText?.setText(
    `${results?.length} / ${completedTests} (${percentageDownloaded}%)`,
  );

  const colors = getTheme();

  bars.limit.fill?.setStyle({
    width: Math.min(percentageLimit, 100) + "%",
    background: blendTwoHexColors(
      colors.sub,
      colors.error,
      mapRange(percentageLimit, 50, 100, 0, 1),
    ),
  });
  bars.limit.rightText?.setText(
    `${results?.length} / ${currentLimit} (${percentageLimit}%)`,
  );

  const text = qs(".pageAccount .resultBatches > .text");
  text?.setText("");

  if (results.length >= completedTests) {
    disableButton();
    updateButtonText("all results loaded");
  }

  if (results.length >= currentLimit) {
    disableButton();
    updateButtonText("limit reached");

    // if (DB.getSnapshot()?.isPremium === false) {
    //   text.html(
    //     `<br>Want to load up to ${limits?.premiumUser} results and gain access to more perks? Join Monkeytype Premium.<br>`
    //   );
    // }
  }
}

export function disableButton(): void {
  qs(".pageAccount .resultBatches button")?.disable();
}

export function enableButton(): void {
  qs(".pageAccount .resultBatches button")?.enable();
}

export function updateButtonText(text: string): void {
  qs(".pageAccount .resultBatches button")?.setText(text);
}

export function showOrHideIfNeeded(): void {
  //for now, just hide if not premium - will show this to everyone later
  const isPremium = DB.getSnapshot()?.isPremium ?? false;
  if (!isPremium) {
    hide();
    return;
  }

  const completed = DB.getSnapshot()?.typingStats?.completedTests ?? 0;
  const batchSize = ServerConfiguration.get()?.results.maxBatchSize ?? 0;

  //no matter if premium or not, if the user is below the initial batch, hide the element
  if (completed <= batchSize) {
    hide();
    return;
  }

  show();
}
