import { createForm } from "@tanstack/solid-form";
import {
  JSXElement,
  createSignal,
  createEffect,
  For,
  Show,
  on,
} from "solid-js";

import Ape from "../../ape";
import { setConfig } from "../../config/setters";
import { Config } from "../../config/store";
import { isCaptchaAvailable } from "../../controllers/captcha-controller";
import QuotesController, { Quote } from "../../controllers/quotes-controller";
import * as DB from "../../db";
import { createDebouncedEffectOn } from "../../hooks/effects";
import { isAuthenticated } from "../../states/core";
import { hideLoaderBar, showLoaderBar } from "../../states/loader-bar";
import {
  hideModalAndClearChain,
  isModalOpen,
  showModal,
} from "../../states/modals";
import {
  showNoticeNotification,
  showErrorNotification,
} from "../../states/notifications";
import { showQuoteReportModal } from "../../states/quote-report";
import { showSimpleModal } from "../../states/simple-modal";
import * as TestLogic from "../../test/test-logic";
import * as TestState from "../../test/test-state";
import { cn } from "../../utils/cn";
import { getLanguage } from "../../utils/json-data";
import * as Misc from "../../utils/misc";
import {
  buildSearchService,
  SearchService,
  TextExtractor,
} from "../../utils/search-service";
import { highlightMatches } from "../../utils/strings";
import { AnimatedModal } from "../common/AnimatedModal";
import { Button } from "../common/Button";
import { InputField } from "../ui/form/InputField";
import SlimSelect from "../ui/SlimSelect";
import { QuoteApproveModal } from "./QuoteApproveModal";
import { QuoteSubmitModal } from "./QuoteSubmitModal";

const PAGE_SIZE = 100;

const searchServiceCache: Record<string, SearchService<Quote>> = {};

function getSearchService<T>(
  language: string,
  data: T[],
  textExtractor: TextExtractor<T>,
): SearchService<T> {
  if (language in searchServiceCache) {
    return searchServiceCache[language] as unknown as SearchService<T>;
  }
  const newSearchService = buildSearchService<T>(data, textExtractor);
  searchServiceCache[language] =
    newSearchService as unknown as (typeof searchServiceCache)[typeof language];
  return newSearchService;
}

function exactSearch(quotes: Quote[], captured: RegExp[]): [Quote[], string[]] {
  const matches: Quote[] = [];
  const exactSearchQueryTerms: Set<string> = new Set<string>();

  for (const quote of quotes) {
    const textAndSource = quote.text + quote.source;
    const currentMatches: string[] = [];
    let noMatch = false;

    for (const regex of captured) {
      const match = textAndSource.match(regex);
      if (!match) {
        noMatch = true;
        break;
      }
      currentMatches.push(Misc.escapeRegExp(match[0]));
    }

    if (!noMatch) {
      currentMatches.forEach((m) => exactSearchQueryTerms.add(m));
      matches.push(quote);
    }
  }

  return [matches, Array.from(exactSearchQueryTerms)];
}

function getLengthDesc(quote: Quote): string {
  if (quote.length < 101) return "short";
  if (quote.length < 301) return "medium";
  if (quote.length < 601) return "long";
  return "thicc";
}

function Item(props: {
  quote: Quote;
  matchedTerms: string[];
  isRtl: boolean;
  onSelect: () => void;
  onReport: () => void;
  onToggleFavorite: () => Promise<boolean>;
}): JSXElement {
  const loggedOut = (): boolean => !isAuthenticated();
  const [isFav, setIsFav] = createSignal(
    // oxlint-disable-next-line solid/reactivity -- intentionally reading once as initial value
    !loggedOut() && QuotesController.isQuoteFavorite(props.quote),
  );

  const handleToggleFavorite = async (): Promise<void> => {
    setIsFav((v) => !v);
    const success = await props.onToggleFavorite();
    if (!success) {
      setIsFav((v) => !v);
    }
  };

  return (
    <div
      class="grid cursor-pointer gap-2 rounded p-4 transition-[background-color] duration-125 select-none hover:bg-sub-alt"
      onClick={() => props.onSelect()}
    >
      <div
        class="text-text [&_.highlight]:text-main"
        dir="auto"
        // oxlint-disable-next-line solid/no-innerhtml
        innerHTML={highlightMatches(props.quote.text, props.matchedTerms)}
      ></div>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_3fr]">
        <div class="text-xs text-sub">
          <div class="opacity-50">id</div>
          <span
            class="[&_.highlight]:text-main"
            // oxlint-disable-next-line solid/no-innerhtml
            innerHTML={highlightMatches(
              props.quote.id.toString(),
              props.matchedTerms,
            )}
          ></span>
        </div>
        <div class="text-xs text-sub">
          <div class="opacity-50">length</div>
          {getLengthDesc(props.quote)}
        </div>
        <div class="col-span-2 flex sm:col-span-1">
          <div class="grow text-xs text-sub">
            <div class="opacity-50">source</div>
            <span
              class="[&_.highlight]:text-main"
              // oxlint-disable-next-line solid/no-innerhtml
              innerHTML={highlightMatches(
                props.quote.source,
                props.matchedTerms,
              )}
            ></span>
          </div>
          <Show when={!loggedOut()}>
            <div class="flex shrink">
              <Button
                variant="text"
                fa={{ icon: "fa-flag" }}
                onClick={(e) => {
                  e.stopPropagation();
                  props.onReport();
                }}
                balloon={{
                  text: "Report quote",
                  position: props.isRtl ? "right" : "left",
                }}
              />
              <Button
                variant="text"
                fa={{
                  icon: "fa-heart",
                  variant: isFav() ? "solid" : "regular",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  void handleToggleFavorite();
                }}
                balloon={{
                  text: "Favorite quote",
                  position: props.isRtl ? "right" : "left",
                }}
              />
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
}

export function QuoteSearchModal(): JSXElement {
  const form = createForm(() => ({
    defaultValues: {
      searchText: "",
    },
  }));

  const [currentPage, setCurrentPage] = createSignal(1);
  const [lengthFilter, setLengthFilter] = createSignal<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = createSignal(false);
  const [customFilterMin, setCustomFilterMin] = createSignal(0);
  const [customFilterMax, setCustomFilterMax] = createSignal(0);
  const [hasCustomFilter, setHasCustomFilter] = createSignal(false);
  const [quotes, setQuotes] = createSignal<Quote[]>([]);
  const [searchResults, setSearchResults] = createSignal<{
    quotes: Quote[];
    matchedTerms: string[];
  }>({ quotes: [], matchedTerms: [] });
  const [isRtl, setIsRtl] = createSignal(false);
  const [favVersion, setFavVersion] = createSignal(0);

  const [searchText, setSearchText] = createSignal("");
  createDebouncedEffectOn(
    250,
    searchText,
    (text) => {
      setCurrentPage(1);
      performSearch(text);
    },
    { defer: true },
  );

  const isOpen = (): boolean => isModalOpen("QuoteSearch");

  const isQuoteMod = (): boolean => {
    const quoteMod = DB.getSnapshot()?.quoteMod;
    return (
      quoteMod !== undefined &&
      (quoteMod === true || (quoteMod as string) !== "")
    );
  };

  const performSearch = (text: string): void => {
    const allQuotes = quotes();
    if (allQuotes.length === 0) {
      setSearchResults({ quotes: [], matchedTerms: [] });
      return;
    }

    let matches: Quote[] = [];
    let matchedQueryTerms: string[] = [];

    if (text === "") {
      setSearchResults({ quotes: allQuotes, matchedTerms: [] });
      return;
    }

    let exactSearchMatches: Quote[] = [];
    let exactSearchMatchedQueryTerms: string[] = [];

    const quotationsRegex = /"(.*?)"/g;
    const exactSearchQueries = Array.from(text.matchAll(quotationsRegex));
    const removedSearchText = text.replaceAll(quotationsRegex, "");

    if (exactSearchQueries[0]) {
      const searchQueriesRaw = exactSearchQueries.map(
        (query) => new RegExp(Misc.escapeRegExp(query[1] ?? ""), "i"),
      );
      [exactSearchMatches, exactSearchMatchedQueryTerms] = exactSearch(
        allQuotes,
        searchQueriesRaw,
      );
    }

    const quoteSearchService = getSearchService<Quote>(
      Config.language,
      allQuotes,
      (quote: Quote) => `${quote.text} ${quote.id} ${quote.source}`,
    );

    if (exactSearchMatches.length > 0 || removedSearchText === text) {
      const ids = exactSearchMatches.map((m) => m.id);
      ({ results: matches, matchedQueryTerms } = quoteSearchService.query(
        removedSearchText,
        ids,
      ));
      exactSearchMatches.forEach((m) => {
        if (!matches.includes(m)) matches.push(m);
      });
      matchedQueryTerms = [
        ...exactSearchMatchedQueryTerms,
        ...matchedQueryTerms,
      ];
    }

    setSearchResults({ quotes: matches, matchedTerms: matchedQueryTerms });
  };

  const filteredQuotes = (): Quote[] => {
    favVersion();

    let result = searchResults().quotes;

    const lengths = lengthFilter();
    if (lengths.length > 0) {
      const groupFilter = new Set(
        lengths.filter((v) => v !== "4").map((v) => parseInt(v, 10)),
      );
      const hasCustom = lengths.includes("4");

      result = result.filter((quote) => {
        if (groupFilter.has(quote.group)) return true;
        if (
          hasCustom &&
          hasCustomFilter() &&
          quote.length >= customFilterMin() &&
          quote.length <= customFilterMax()
        ) {
          return true;
        }
        return false;
      });
    }

    if (showFavoritesOnly()) {
      result = result.filter((quote) =>
        QuotesController.isQuoteFavorite(quote),
      );
    }

    return result;
  };

  const totalPages = (): number =>
    Math.max(1, Math.ceil(filteredQuotes().length / PAGE_SIZE));

  const pageQuotes = (): Quote[] => {
    const start = (currentPage() - 1) * PAGE_SIZE;
    return filteredQuotes().slice(start, start + PAGE_SIZE);
  };

  const pageInfo = (): string => {
    const filtered = filteredQuotes();
    if (filtered.length === 0) return "No search results";
    const start = (currentPage() - 1) * PAGE_SIZE + 1;
    const end = Math.min(currentPage() * PAGE_SIZE, filtered.length);
    return `${start} - ${end} of ${filtered.length}`;
  };

  createEffect(
    on(lengthFilter, (lengths) => {
      if (lengths.includes("4") && !hasCustomFilter()) {
        showSimpleModal({
          title: "Enter minimum and maximum number of words",
          inputs: [
            { type: "number", placeholder: "1" },
            { type: "number", placeholder: "100" },
          ],
          buttonText: "save",
          execFn: async (min: string, max: string) => {
            const minNum = parseInt(min, 10);
            const maxNum = parseInt(max, 10);
            if (isNaN(minNum) || isNaN(maxNum)) {
              return { status: "notice", message: "Invalid min/max values" };
            }
            setCustomFilterMin(minNum);
            setCustomFilterMax(maxNum);
            setHasCustomFilter(true);
            return { status: "success", message: "Saved custom filter" };
          },
        });
      }
    }),
  );

  const handleBeforeShow = (isChained: boolean): void => {
    if (isChained) return;
    form.reset();
    setSearchText("");
    setCurrentPage(1);
    setLengthFilter([]);
    setShowFavoritesOnly(false);
    setHasCustomFilter(false);
  };

  const handleAfterShow = async (): Promise<void> => {
    const quotesLanguage = await getLanguage(Config.language);
    setIsRtl(quotesLanguage?.rightToLeft ?? false);
    const { quotes: fetchedQuotes } = await QuotesController.getQuotes(
      Config.language,
    );
    setQuotes(fetchedQuotes);
    performSearch(form.state.values.searchText);
  };

  const applyQuote = (quoteId: number): void => {
    if (isNaN(quoteId) || quoteId < 0) {
      showNoticeNotification("Quote ID must be at least 1");
      return;
    }
    TestState.setSelectedQuoteId(quoteId);
    setConfig("quoteLength", [-2]);
    TestLogic.restart();
    hideModalAndClearChain("QuoteSearch");
  };

  const toggleFavorite = async (quote: Quote): Promise<boolean> => {
    const alreadyFavorited = QuotesController.isQuoteFavorite(quote);

    try {
      showLoaderBar();
      await QuotesController.setQuoteFavorite(quote, !alreadyFavorited);
      hideLoaderBar();
      setFavVersion((v) => v + 1);
      return true;
    } catch (e) {
      hideLoaderBar();
      showErrorNotification(
        alreadyFavorited
          ? "Failed to remove quote from favorites"
          : "Failed to add quote to favorites",
        { error: e },
      );
      return false;
    }
  };

  const handleSubmitClick = async (): Promise<void> => {
    if (!isCaptchaAvailable()) {
      showErrorNotification(
        "Captcha is not available. Please refresh the page or contact support if this issue persists.",
      );
      return;
    }
    showLoaderBar();
    const getSubmissionEnabled = await Ape.quotes.isSubmissionEnabled();
    const isEnabled =
      (getSubmissionEnabled.status === 200 &&
        getSubmissionEnabled.body.data?.isEnabled) ??
      false;
    hideLoaderBar();
    if (!isEnabled) {
      showNoticeNotification(
        "Quote submission is disabled temporarily due to a large submission queue.",
        { durationMs: 5000 },
      );
      return;
    }
    showModal("QuoteSubmit");
  };

  return (
    <>
      <AnimatedModal
        id="QuoteSearch"
        focusFirstInput={true}
        beforeShow={handleBeforeShow}
        afterShow={handleAfterShow}
        modalClass="max-w-[1000px] h-[80vh] grid-rows-[auto_auto_1fr_auto]"
      >
        <div class="flex flex-col justify-between gap-2 sm:flex-row">
          <div class="text-2xl text-sub">Quote search</div>
          <div class="grid gap-2">
            <Show when={isAuthenticated()}>
              <Button
                fa={{ icon: "fa-plus" }}
                text="Submit a quote"
                onClick={() => void handleSubmitClick()}
              />
            </Show>
            <Show when={isQuoteMod()}>
              <Button
                fa={{ icon: "fa-check" }}
                text="Approve quotes"
                onClick={() => showModal("QuoteApprove")}
              />
            </Show>
          </div>
        </div>
        <div class="flex flex-col gap-4 sm:flex-row">
          <form.Field
            name="searchText"
            listeners={{
              onChange: ({ value }) => {
                if (!isOpen()) return;
                setSearchText(value);
              },
            }}
            children={(field) => (
              <InputField
                class="grow-3"
                field={field}
                placeholder="filter by text, source or id"
                autocomplete="off"
                dir="auto"
                maxLength={200}
              />
            )}
          />
          <div class="grow">
            <SlimSelect
              multiple
              options={[
                { value: "0", text: "short" },
                { value: "1", text: "medium" },
                { value: "2", text: "long" },
                { value: "3", text: "thicc" },
                { value: "4", text: "custom" },
              ]}
              selected={lengthFilter()}
              onChange={(val) => setLengthFilter(val)}
              settings={{
                showSearch: false,
                placeholderText: "filter by length",
              }}
            />
          </div>
          <Show when={isAuthenticated()}>
            <Button
              variant="button"
              fa={{ icon: "fa-heart", fixedWidth: true }}
              active={showFavoritesOnly()}
              onClick={() => setShowFavoritesOnly((v) => !v)}
            />
          </Show>
        </div>
        <div
          class="grid content-baseline gap-2 overflow-y-auto"
          dir={isRtl() ? "rtl" : undefined}
        >
          <For each={pageQuotes()}>
            {(quote) => (
              <Item
                quote={quote}
                matchedTerms={searchResults().matchedTerms}
                isRtl={isRtl()}
                onSelect={() => applyQuote(quote.id)}
                onReport={() => showQuoteReportModal(quote.id)}
                // oxlint-disable-next-line solid/reactivity, typescript-eslint/promise-function-async -- fire-and-forget, no reactive tracking needed
                onToggleFavorite={() => toggleFavorite(quote)}
              />
            )}
          </For>
        </div>
        <div
          class={cn(
            "grid grid-cols-2 items-center justify-center gap-2",
            "sm:grid-cols-3",
          )}
        >
          <Button
            class="justify-self-end px-10 sm:w-max"
            fa={{ icon: "fa-chevron-left", fixedWidth: true }}
            disabled={currentPage() <= 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          />
          <div
            class={cn(
              "col-span-2 row-start-1 px-4 text-center text-sub",
              "sm:col-span-1 sm:row-auto",
            )}
          >
            {pageInfo()}
          </div>
          <Button
            class="px-10 sm:w-max"
            fa={{ icon: "fa-chevron-right", fixedWidth: true }}
            disabled={currentPage() >= totalPages()}
            onClick={() => setCurrentPage((p) => p + 1)}
          />
        </div>
      </AnimatedModal>
      <QuoteSubmitModal />
      <QuoteApproveModal />
    </>
  );
}
