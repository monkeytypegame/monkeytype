// Url actions: links the test page applies once, then drops from the url
// (apply.ts). Each link format is a module in actions/

/**
 * The value of `param` (a search param, or a hash param) applied by `apply`.
 * A hash action drops the whole hash (an oauth redirect's fragment).
 */
type UrlActionBase<In extends "search" | "hash"> = {
  in: In;
  param: string;
  /** the error notification's message when `apply` throws, see apply.ts */
  failure: string;
  /**
   * Throws if the value is invalid or applying it failed. `getParam` reads
   * the other params of the same part of the url
   */
  apply: (
    value: string,
    getParam: (param: string) => string | null,
  ) => void | Promise<void>;
};

export type UrlSearchAction = UrlActionBase<"search">;
export type UrlHashAction = UrlActionBase<"hash">;
export type UrlAction = UrlSearchAction | UrlHashAction;

/** The link applying a search action with `value`. */
export function urlActionLink(action: UrlSearchAction, value: string): string {
  return `${location.origin}?${action.param}=${value}`;
}
