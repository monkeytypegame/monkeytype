import { createMemo, JSXElement } from "solid-js";

import {
  registerSearchable,
  settingMatchesSearch,
} from "../../../states/settings-search";
import { cn } from "../../../utils/cn";
import { Setting, SettingProps } from "../../common/Setting";

export type SearchableSettingProps = SettingProps & {
  // extra text (e.g. option labels) the search filter also matches against
  extraSearchKeywords?: string;
};

// pull plain text out of a (possibly JSX) description so search can match it.
// solid renders JSX to real DOM nodes/arrays, so we can read their textContent.
function textOf(node: string | JSXElement): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join(" ");
  if (node instanceof Node) return node.textContent ?? "";
  return "";
}

// a Setting that hides itself when it doesn't match the active settings search.
// hides (via css) instead of unmounting so typing doesn't remount every setting
// on each keypress; the hidden class stays on the Setting root so the section
// auto-collapse selector keeps working.
export function SearchableSetting(props: SearchableSettingProps): JSXElement {
  // static per setting — only the query changes as the user types, so build once
  const haystack = createMemo(() =>
    [props.title, textOf(props.description), props.extraSearchKeywords ?? ""]
      .join(" ")
      .toLowerCase(),
  );

  // scoring is global (a setting shows only if it ties the best match across all
  // settings), so register this haystack for the shared best-match computation.
  // oxlint-disable-next-line solid/reactivity -- getter stored, called in a tracked memo
  registerSearchable(haystack);

  return (
    <Setting
      {...props}
      class={cn(props.class, !settingMatchesSearch(haystack()) && "hidden")}
    />
  );
}
