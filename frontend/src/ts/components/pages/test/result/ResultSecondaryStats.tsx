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
import { cn } from "../../../../utils/cn";
import { secondsToString } from "../../../../utils/date-and-time";
import { getLanguageDisplayString } from "../../../../utils/strings";
import { AnimeShow } from "../../../common/anime";
import { Balloon } from "../../../common/Balloon";
import { Button } from "../../../common/Button";
import { Fa } from "../../../common/Fa";
import { speedBalloon } from "./speed-balloon";

type Props = {
  result: CompletedResult;
};

export function ResultSecondaryStats(props: Props): JSXElement {
  const format = () => getFormatting();
  const decimals = () => getConfig.alwaysShowDecimalPlaces;

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
    <div
      class={cn(
        "mb-4 grid grid-flow-col items-start justify-between gap-2 gap-x-8 md:col-span-2",
        "max-lg:grid-cols-[repeat(3,max-content)] max-lg:grid-rows-[1fr_1fr]",
        "max-md:grid-cols-2 max-md:grid-rows-[1fr_1fr_1fr] max-md:justify-items-start max-md:gap-4",
        "max-xs:grid-flow-row max-xs:grid-cols-1 max-xs:grid-rows-none",
      )}
    >
      <div data-ui-element="resultStat">
        <div class="text-sub">test type</div>
        <div class="text-main" data-ui-element="resultStatValue">
          <Lines lines={testType()} />
        </div>
        <Tags />
      </div>
      <Show when={other().length > 0}>
        <div data-ui-element="resultStat">
          <div class="text-sub">other</div>
          <div class="text-main" data-ui-element="resultStatValue">
            <Lines lines={other()} />
          </div>
        </div>
      </Show>

      <div data-ui-element="resultStat">
        <div class="text-sub">raw</div>
        <Balloon
          data-ui-element="resultStatValue"
          class={cn("text-[2em] leading-[1em] text-main", mobileBalloonClass)}
          text={speedBalloon(props.result.rawWpm)}
        >
          {format().typingSpeed(props.result.rawWpm)}
        </Balloon>
      </div>
      <div data-ui-element="resultStat">
        <div class="text-sub">characters</div>
        <Balloon
          data-ui-element="resultStatValue"
          class={cn("text-[2em] leading-[1em] text-main", mobileBalloonClass)}
          text={"correct\nincorrect\nextra\nmissed"}
          break
        >
          {props.result.charStats.join("/")}
        </Balloon>
      </div>

      <div data-ui-element="resultStat">
        <div class="text-sub">consistency</div>
        <Balloon
          data-ui-element="resultStatValue"
          class={cn("text-[2em] leading-[1em] text-main", mobileBalloonClass)}
          text={consistencyBalloon()}
        >
          {format().percentage(props.result.consistency)}
        </Balloon>
      </div>
      <div data-ui-element="resultStat">
        <div class="text-sub">time</div>
        <Balloon
          data-ui-element="resultStatValue"
          class={cn("text-[2em] leading-[1em] text-main", mobileBalloonClass)}
          text={timeBalloon()}
        >
          <div>{timeText()}</div>
          <div class={timeNoteClass}>
            {afkPercent() > 0 ? `${afkPercent()}% afk` : ""}
          </div>
          <div class={timeNoteClass}>{resultState.timeToday}</div>
        </Balloon>
      </div>

      <AnimeShow
        when={resultState.dailyLeaderboardRank !== undefined}
        duration={250}
        class="max-w-52 whitespace-nowrap"
      >
        <div class="text-sub">daily leaderboard</div>
        <Balloon
          data-ui-element="resultStatValue"
          text="Show daily leaderboard"
          class={cn(
            "text-[2em] leading-[1em] text-main",
            mobileBalloonClass,
            "cursor-pointer",
          )}
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
  );
}

// on narrow screens the stats sit at the left edge, so left align their balloons
const mobileBalloonClass = "max-sm:after:left-0 max-sm:after:[transform:none]";
const timeNoteClass = "ml-[0.2rem] text-[0.75rem] leading-[0.75rem] text-sub";

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

function Tags(): JSXElement {
  const userTags = useTagsLiveQuery();
  const tagNames = createMemo(
    () => new Map((userTags() ?? []).map((t) => [t._id, t.name])),
  );

  const openEditModal = (): void => {
    if (tagNames().size === 0 || resultState.resultId === "") return;
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
      <div class="mt-2">
        <div class={cn("text-sub", "flex items-center")}>
          <span>tags</span>
          <Button
            variant="text"
            fa={{ icon: "fa-pen", fixedWidth: true }}
            onClick={openEditModal}
            balloon={{
              text: "Edit tags",
              position: "right",
            }}
            class={cn("-my-2 p-1", resultState.resultId === "" && "invisible")}
          />
        </div>
        <div class="text-main" data-ui-element="resultStatValue">
          <Show when={tags().length > 0} fallback={<div>no tags</div>}>
            <For each={tags()}>
              {(tag) => (
                <Balloon text={tag.balloon} class="flex">
                  {tag.name}
                  <Show when={tag.isPb}>
                    <Fa icon="fa-crown" class="ml-2" />
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
    <div class="max-w-120" data-ui-element="resultStat">
      <div class={cn("text-sub", "flex items-center")}>
        <span class="mr-2">source</span>
        <Show when={isAuthenticated()}>
          <QuoteButtons quote={props.quote} />
        </Show>
      </div>
      <div class="text-main" data-ui-element="resultStatValue">
        {props.quote.source}
      </div>
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
      <Button
        variant="text"
        class="-my-1 p-1"
        balloon={{ text: "Report quote" }}
        fa={{ icon: "fa-flag", fixedWidth: true }}
        onClick={() => showQuoteReportModal(props.quote.id)}
      />
      <Button
        variant="text"
        class="-my-1 p-1"
        balloon={{ text: "Favorite quote" }}
        fa={{
          icon: "fa-heart",
          variant: isFavorite() ? "solid" : "regular",
          fixedWidth: true,
        }}
        onClick={() => void toggleFavorite()}
      />
      <Button
        variant="text"
        class="-my-1 p-1"
        balloon={{ text: "Rate quote" }}
        fa={{
          icon: "fa-star",
          variant: isRated() ? "solid" : "regular",
          fixedWidth: true,
        }}
        text={rating()}
        onClick={() => showQuoteRateModal(props.quote)}
      />
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
