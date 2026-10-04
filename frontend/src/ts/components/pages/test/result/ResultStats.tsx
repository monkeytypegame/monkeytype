import { getFunbox } from "@monkeytype/funbox";
import { isSafeNumber, roundTo2 } from "@monkeytype/util/numbers";
import {
  createMemo,
  createResource,
  createSignal,
  For,
  JSXElement,
  Show,
} from "solid-js";

import Ape from "../../../../ape";
import { useTagsLiveQuery } from "../../../../collections/tags";
import { getConfig } from "../../../../config/store";
import QuotesController, {
  Quote,
} from "../../../../controllers/quotes-controller";
import { navigate } from "../../../../controllers/route-controller";
import * as DB from "../../../../db";
import { getFormatting, isAuthenticated } from "../../../../states/core";
import { showEditResultTagsModal } from "../../../../states/edit-result-tags";
import { hideLoaderBar, showLoaderBar } from "../../../../states/loader-bar";
import { addNotificationWithLevel } from "../../../../states/notifications";
import {
  getQuoteStats,
  quoteStats,
  showQuoteRateModal,
} from "../../../../states/quote-rate";
import { showQuoteReportModal } from "../../../../states/quote-report";
import { ResultDetails, resultState } from "../../../../states/result";
import { getSnapshot } from "../../../../states/snapshot";
import { CompletedResult } from "../../../../states/test";
import { getAccuracy } from "../../../../test/events/stats";
import { EventLog } from "../../../../test/events/types";
import { cn } from "../../../../utils/cn";
import { secondsToString } from "../../../../utils/date-and-time";
import { getLanguageDisplayString } from "../../../../utils/strings";
import { AnimeShow } from "../../../common/anime";
import { Balloon } from "../../../common/Balloon";
import { Fa } from "../../../common/Fa";

type Props = {
  result: CompletedResult;
  eventLog: EventLog;
  hidden: boolean;
};

export function ResultStats(props: Props): JSXElement {
  const format = () => getFormatting();
  const decimals = () => getConfig.alwaysShowDecimalPlaces;
  const unit = () => getConfig.typingSpeedUnit;

  const speedText = (wpm: number): string =>
    wpm >= 1000 ? "Infinite" : format().typingSpeed(wpm);

  const speedBalloon = (wpm: number): string | undefined => {
    if (decimals()) {
      return unit() !== "wpm" ? `${wpm.toFixed(2)} wpm` : undefined;
    }
    let text = format().typingSpeed(wpm, {
      showDecimalPlaces: true,
      suffix: ` ${unit()}`,
    });
    if (unit() !== "wpm") text += ` (${wpm.toFixed(2)} wpm)`;
    return text;
  };

  const accCounts = createMemo(() => getAccuracy(props.eventLog));

  const accBalloon = (): string | undefined => {
    const counts = accCounts();
    const countsText = `${counts.correct} correct\n${counts.incorrect} incorrect`;
    if (decimals()) return countsText;
    const acc =
      props.result.acc === 100
        ? "100%"
        : format().percentage(props.result.acc, { showDecimalPlaces: true });
    return `${acc}\n${countsText}`;
  };

  const consistencyBalloon = (): string =>
    decimals()
      ? format().percentage(props.result.keyConsistency, {
          showDecimalPlaces: true,
          suffix: " key",
        })
      : `${props.result.consistency}% (${props.result.keyConsistency}% key)`;

  const afkPercent = (): number =>
    roundTo2((props.result.afkDuration / props.result.testDuration) * 100 || 0);

  const timeText = (): string => {
    const duration = props.result.testDuration;
    const rounded = decimals() ? roundTo2(duration) : Math.round(duration);
    if (duration > 61) return secondsToString(rounded);
    return decimals() ? `${rounded.toFixed(2)}s` : `${rounded}s`;
  };

  const timeBalloon = (): string => {
    const afk = `${props.result.afkDuration}s afk ${afkPercent()}%`;
    if (decimals()) return afk;
    return `${roundTo2(props.result.testDuration)}s (${afk})`;
  };

  const testType = createMemo(() =>
    getTestType(props.result, resultState.details),
  );
  const other = createMemo(() => getOther(props.result, resultState.details));

  return (
    <>
      <div class={cn("stats", { hidden: props.hidden })}>
        <div class="group wpm">
          <div class="top">
            <div class="text">{unit()}</div>
            <Crown />
          </div>
          <Balloon class="bottom" text={speedBalloon(props.result.wpm)}>
            {speedText(props.result.wpm)}
          </Balloon>
        </div>
        <div class="group acc">
          <div class="top">acc</div>
          <Balloon class="bottom" text={accBalloon()} break>
            {props.result.acc === 100
              ? "100%"
              : format().accuracy(props.result.acc)}
          </Balloon>
        </div>
      </div>
      <div class={cn("stats morestats", { hidden: props.hidden })}>
        <div class="group testType">
          <div class="top">test type</div>
          <div class="bottom">
            <Lines lines={testType()} />
          </div>
          <Tags />
        </div>
        <Show when={other().length > 0}>
          <div class="group info">
            <div class="top">other</div>
            <div class="bottom">
              <Lines lines={other()} />
            </div>
          </div>
        </Show>

        <div class="group raw">
          <div class="top">raw</div>
          <Balloon class="bottom" text={speedBalloon(props.result.rawWpm)}>
            {format().typingSpeed(props.result.rawWpm)}
          </Balloon>
        </div>
        <div class="group key">
          <div class="top">characters</div>
          <Balloon
            class="bottom"
            text={"correct\nincorrect\nextra\nmissed"}
            break
          >
            {props.result.charStats.join("/")}
          </Balloon>
        </div>

        <div class="group flat consistency">
          <div class="top">consistency</div>
          <Balloon class="bottom" text={consistencyBalloon()}>
            {format().percentage(props.result.consistency)}
          </Balloon>
        </div>
        <div class="group time">
          <div class="top">time</div>
          <Balloon class="bottom" text={timeBalloon()}>
            <div class="text">{timeText()}</div>
            <div class="afk">
              {afkPercent() > 0 ? `${afkPercent()}% afk` : ""}
            </div>
            <div class="timeToday">{resultState.timeToday}</div>
          </Balloon>
        </div>

        <AnimeShow
          when={resultState.dailyLeaderboardRank !== undefined}
          duration={250}
          class="group dailyLeaderboard"
        >
          <div class="top">daily leaderboard</div>
          <Balloon
            text="Show daily leaderboard"
            class="bottom cursor-pointer"
            onClick={() => {
              void navigate(
                `/leaderboards?type=daily&language=${props.result.language}&mode2=${props.result.mode2}&goToUserPage=true`,
              );
            }}
          >
            {format().rank(resultState.dailyLeaderboardRank, {
              fallback: "",
            })}
          </Balloon>
        </AnimeShow>

        <Show when={resultState.details?.quote}>
          {(quote) => <QuoteSource quote={quote()} />}
        </Show>
      </div>
    </>
  );
}

function Lines(props: { lines: string[] }): JSXElement {
  return (
    <For each={props.lines}>
      {(line, i) => (
        <>
          <Show when={i() > 0}>
            <br />
          </Show>
          {line}
        </>
      )}
    </For>
  );
}

function Crown(): JSXElement {
  return (
    <AnimeShow when={resultState.crown.visible}>
      <Balloon
        class={cn("crown", resultState.crown.type)}
        text={resultState.crown.text}
        length={resultState.crown.wide ? "medium" : undefined}
      >
        <Fa icon="fa-question" />
        <Fa icon="fa-crown" />
        <Fa icon="fa-slash" />
        <Fa icon="fa-exclamation-triangle" />
      </Balloon>
    </AnimeShow>
  );
}

function Tags(): JSXElement {
  const userTags = useTagsLiveQuery();
  const tagNames = createMemo(
    () => new Map((userTags() ?? []).map((t) => [t._id, t.name])),
  );

  const openEditModal = (): void => {
    if (tagNames().size === 0) return;
    showEditResultTagsModal({
      _id: resultState.resultId,
      tags: resultState.tags.map((t) => t.id),
      source: "resultPage",
    });
  };

  const tags = () =>
    resultState.tags.flatMap((tag) => {
      const name = tagNames().get(tag.id);
      return name === undefined ? [] : [{ ...tag, name }];
    });

  return (
    <Show when={tagNames().size > 0}>
      <div class="tags mt-2">
        <div class="top">
          <span>tags</span>
          <Balloon
            class={cn("textButton editTagsButton", {
              invisible: resultState.resultId === "",
            })}
            text="Edit tags"
            position="right"
            role="button"
            onClick={openEditModal}
          >
            <Fa icon="fa-pen" fixedWidth />
          </Balloon>
        </div>
        <div class="bottom">
          <Show
            when={tags().length > 0}
            fallback={<div class="noTags">no tags</div>}
          >
            <For each={tags()}>
              {(tag) => (
                <Balloon text={tag.balloon}>
                  {tag.name}
                  <Show when={tag.isPb}>
                    <Fa icon="fa-crown" />
                  </Show>
                </Balloon>
              )}
            </For>
          </Show>
        </div>
      </div>
    </Show>
  );
}

function QuoteSource(props: { quote: Quote }): JSXElement {
  return (
    <div class="group source">
      <div class="top">
        <span class="mr-[0.5em]">source</span>
        <Show when={isAuthenticated()}>
          <QuoteButtons quote={props.quote} />
        </Show>
      </div>
      <div class="bottom">{props.quote.source}</div>
    </div>
  );
}

function QuoteButtons(props: { quote: Quote }): JSXElement {
  // favorites live in the non-reactive DB snapshot, bumped after each toggle
  const [favoritesVersion, setFavoritesVersion] = createSignal(0);
  const isFavorite = (): boolean => {
    favoritesVersion();
    return QuotesController.isQuoteFavorite(props.quote);
  };
  // fills quoteStats() in states/quote-rate, which the rate modal also updates
  // keyed on the details too, since restart clears stats and a repeated quote is the same object.
  // not the result - it's set before the details, so it would fetch the previous quote
  const [statsRequest] = createResource(
    () => ({ quote: props.quote, details: resultState.details }),
    async ({ quote }) => getQuoteStats(quote),
  );

  const isRated = (): boolean =>
    isSafeNumber(
      getSnapshot()?.quoteRatings?.[props.quote.language]?.[props.quote.id],
    );

  const rating = (): string => {
    if (statsRequest.error !== undefined) return "?";
    return quoteStats()?.average?.toFixed(1) ?? "";
  };

  const toggleFavorite = async (): Promise<void> => {
    const dbSnapshot = DB.getSnapshot();
    if (!dbSnapshot) return;
    const language = props.quote.language;
    const quoteId = props.quote.id.toString();
    const remove = isFavorite();

    showLoaderBar();
    const response = remove
      ? await Ape.users.removeQuoteFromFavorites({
          body: { language, quoteId },
        })
      : await Ape.users.addQuoteToFavorites({ body: { language, quoteId } });
    hideLoaderBar();

    addNotificationWithLevel(
      response.body.message,
      response.status === 200 ? "success" : "error",
    );
    if (response.status !== 200) return;

    if (remove) {
      const list = dbSnapshot.favoriteQuotes?.[language];
      list?.splice(list.indexOf(quoteId), 1);
    } else {
      dbSnapshot.favoriteQuotes ??= {};
      dbSnapshot.favoriteQuotes[language] ??= [];
      dbSnapshot.favoriteQuotes[language]?.push(quoteId);
    }
    setFavoritesVersion((v) => v + 1);
  };

  return (
    <>
      <Balloon
        inline
        id="reportQuoteButton"
        class="textButton"
        text="Report quote"
        onClick={() => showQuoteReportModal(props.quote.id)}
      >
        <Fa icon="fa-flag" fixedWidth class="icon" />
      </Balloon>
      <Balloon
        inline
        id="favoriteQuoteButton"
        class="textButton"
        text="Favorite quote"
        onClick={() => void toggleFavorite()}
      >
        <Fa
          icon="fa-heart"
          variant={isFavorite() ? "solid" : "regular"}
          fixedWidth
          class="icon"
        />
      </Balloon>
      <Balloon
        inline
        id="rateQuoteButton"
        class="textButton"
        text="Rate quote"
        onClick={() => showQuoteRateModal(props.quote)}
      >
        <Fa
          icon="fa-star"
          variant={isRated() ? "solid" : "regular"}
          fixedWidth
          class="icon"
        />
        <span class="rating">{rating()}</span>
      </Balloon>
    </>
  );
}

function getTestType(
  result: CompletedResult,
  details: ResultDetails | null,
): string[] {
  let first: string = result.mode;
  if (result.mode === "time" || result.mode === "words") {
    first += ` ${result.mode2}`;
  } else if (result.mode === "quote") {
    const group = details?.quote?.group;
    if (group !== undefined) {
      first += ` ${["short", "medium", "long", "thicc"][group]}`;
    }
  }
  const lines = [first];

  const ignoresLanguage = getFunbox(result.funbox).some((fb) =>
    fb.properties?.includes("ignoresLanguage"),
  );
  if (result.mode !== "custom" && !ignoresLanguage) {
    lines.push(getLanguageDisplayString(result.language));
  }
  if (result.punctuation) lines.push("punctuation");
  if (result.numbers) lines.push("numbers");
  if (result.blindMode) lines.push("blind");
  if (result.lazyMode) lines.push("lazy");
  if (result.funbox.length > 0) {
    lines.push(result.funbox.map((it) => it.replace(/_/g, " ")).join(", "));
  }
  if (result.difficulty === "expert" || result.difficulty === "master") {
    lines.push(result.difficulty);
  }
  if (details !== null && details.stopOnError !== "off") {
    lines.push(`stop on ${details.stopOnError}`);
  }
  if (details !== null && details.deleteOnError !== "off") {
    lines.push(`delete on ${details.deleteOnError.replace(/_/g, " ")}`);
  }
  return lines;
}

function getOther(
  result: CompletedResult,
  details: ResultDetails | null,
): string[] {
  if (details === null) return [];
  const lines: string[] = [];
  if (details.difficultyFailed) {
    lines.push(`failed (${details.failReason})`);
  }
  if (details.afkDetected) {
    lines.push("afk detected");
  }
  if (details.invalid) {
    const isWords10 = result.mode === "words" && result.mode2 === "10";
    const isOutOfRange = (wpm: number): boolean =>
      wpm < 0 ||
      (wpm > 350 && result.mode !== "words" && result.mode2 !== "10") ||
      (wpm > 420 && isWords10);
    const extra: string[] = [];
    if (isOutOfRange(result.wpm)) extra.push("wpm");
    if (isOutOfRange(result.rawWpm)) extra.push("raw");
    if (result.acc < 75 || result.acc > 100) extra.push("accuracy");
    lines.push(extra.length > 0 ? `invalid (${extra.join(",")})` : "invalid");
  }
  if (details.isRepeated) {
    lines.push("repeated");
  }
  if (result.bailedOut) {
    lines.push("bailed out");
  }
  if (details.tooShort) {
    lines.push("too short");
  }
  return lines;
}
