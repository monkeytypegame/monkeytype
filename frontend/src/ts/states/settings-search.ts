import { createMemo, createSignal, onCleanup } from "solid-js";

// the current settings filter query, shared between the search input and the
// settings/sections that hide themselves when they don't match
export const [getSettingsSearch, setSettingsSearch] = createSignal("");

export const isSettingsSearchActive = (): boolean =>
  getSettingsSearch().trim() !== "";

// registry of every searchable setting's haystack getter. settings register on
// mount and clean up on unmount, so best-match scoring sees only live settings.
const [getHaystacks, setHaystacks] = createSignal<Set<() => string>>(
  new Set(),
  {
    equals: false,
  },
);

export function registerSearchable(haystack: () => string): void {
  setHaystacks((s) => s.add(haystack));
  onCleanup(() =>
    setHaystacks((s) => {
      s.delete(haystack);
      return s;
    }),
  );
}

const queryTokens = createMemo(() => {
  const query = getSettingsSearch().trim().toLowerCase();
  return query === "" ? [] : query.split(/\s+/);
});

// how many of the query's tokens appear in this haystack
function scoreOf(haystack: string, tokens: string[]): number {
  let score = 0;
  for (const token of tokens) if (haystack.includes(token)) score++;
  return score;
}

// the highest token-match count any live setting achieves for the current query.
// we only reveal settings that tie this, so a partial match shows only when
// nothing matches better (2/2 beats 1/2; 1/2 shows only if nothing hits 2/2).
const bestScore = createMemo(() => {
  const tokens = queryTokens();
  if (tokens.length === 0) return 0;
  let best = 0;
  for (const haystack of getHaystacks()) {
    const score = scoreOf(haystack(), tokens);
    if (score > best) best = score;
  }
  return best;
});

export function settingMatchesSearch(haystack: string): boolean {
  const tokens = queryTokens();
  if (tokens.length === 0) return true;
  const best = bestScore();
  return best > 0 && scoreOf(haystack, tokens) === best;
}
