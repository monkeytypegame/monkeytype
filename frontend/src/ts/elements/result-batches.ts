import * as DB from "../db";
import * as ServerConfiguration from "../ape/server-configuration";

export function hide(): void {
  $(".pageAccount .resultBatches").addClass("hidden");
}

export function show(): void {
  $(".pageAccount .resultBatches").removeClass("hidden");
}

export function update(): void {
  const results = DB.getSnapshot()?.results;
  const maxResults = DB.getSnapshot()?.typingStats?.completedTests;
  let percentageDownloaded = 0;

  if (results !== undefined && maxResults !== undefined) {
    percentageDownloaded = Math.round((results.length / maxResults) * 100);
  }

  const limit = ServerConfiguration.get()?.results.limits.premiumUser;
  let percentageLimit = 0;
  if (results !== undefined && limit !== undefined) {
    percentageLimit = Math.round((results?.length / limit) * 100);
  }

  const barsWrapper = $(".pageAccount .resultBatches .bars");

  const bars = {
    downloaded: {
      fill: barsWrapper.find(".downloaded .fill"),
      rightText: barsWrapper.find(".downloaded.rightText"),
    },
    limit: {
      fill: barsWrapper.find(".limit .fill"),
      rightText: barsWrapper.find(".limit.rightText"),
    },
  };

  bars.downloaded.fill.css("width", percentageDownloaded + "%");
  bars.downloaded.rightText.text(
    `${results?.length} / ${maxResults} (${percentageDownloaded}%)`
  );

  bars.limit.fill.css("width", percentageLimit + "%");
  bars.limit.rightText.text(
    `${results?.length} / ${limit} (${percentageLimit}%)`
  );

  const text = $(".pageAccount .resultBatches > .text");

  if (DB.getSnapshot()?.isPremium) {
    text.text(
      `As a premium user, you can request up to ${limit} results in batches of 100.`
    );
  } else {
    text.text(
      `As a non-premium user, you can request up to ${
        ServerConfiguration.get()?.results.limits.regularUser
      } results in batches of 100. You can increase that limit by becoming a premium member.`
    );
  }
}

export function disableButton(): void {
  $(".pageAccount .resultBatches button").prop("disabled", true);
}

export function enableButton(): void {
  $(".pageAccount .resultBatches button").prop("disabled", false);
}
