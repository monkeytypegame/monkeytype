import { z } from "zod";
import {
  safeParse as parseUrlSearchParams,
  serialize as serializeUrlSearchParams,
} from "zod-urlsearchparams";
import { ElementWithUtils } from "../utils/dom";

export type PageName =
  | "loading"
  | "test"
  | "settings"
  | "about"
  | "account"
  | "login"
  | "profile"
  | "profileSearch"
  | "404"
  | "accountSettings"
  | "leaderboards"
  | "friends";

type Options<T> = {
  params?: Record<string, string>;
  data?: T;
};

export type LoadingOptions = {
  /**
   * Get the loading mode for this page.
   * "none" - No loading screen will be shown.
   * "sync" - A loading spinner or bar (depending on style) will be shown until the page is ready.
   * { mode: "async", beforeLoading, afterLoading } - The loadingPromise will be executed in the background and afterLoading called after it resolves.
   */
  loadingMode: () =>
    | "none"
    | "sync"
    | { mode: "async"; beforeLoading?: () => void; afterLoading?: () => void };
  /**
   * When this promise resolves, the loading screen will be hidden.
   */
  loadingPromise: () => Promise<void>;
} & (
  | {
      style: "spinner";
    }
  | {
      style: "bar";
      /**
       * Keyframes for the loading bar.
       * Each keyframe will be shown in order, with the specified percentage and duration.
       * If not provided, a loading spinner will be shown instead.
       */
      keyframes: {
        /**
         * Percentage of the loading bar to fill.
         */
        percentage: number;
        /**
         * Duration in milliseconds for the keyframe animation.
         */
        durationMs: number;
        /**
         * Text to display below the loading bar.
         */
        text?: string;
      }[];
    }
);

export type PageProperties<T> = {
  id: PageName;
  display?: string;
  element: ElementWithUtils;
  path: string;
  loadingOptions?: LoadingOptions;
  beforeHide?: () => Promise<void>;
  afterHide?: () => Promise<void>;
  beforeShow?: (options: Options<T>) => Promise<void>;
  afterShow?: () => Promise<void>;
};

async function empty(): Promise<void> {
  return;
}
export default class Page<T> {
  public id: PageName;
  public display: string | undefined;
  public element: ElementWithUtils;
  public pathname: string;
  public loadingOptions: LoadingOptions | undefined;

  public beforeHide: () => Promise<void>;
  public afterHide: () => Promise<void>;
  protected _beforeShow: (options: Options<T>) => Promise<void>;
  public afterShow: () => Promise<void>;

  constructor(options: PageProperties<T>) {
    this.id = options.id;
    this.display = options.display;
    this.element = options.element;
    this.pathname = options.path;
    this.loadingOptions = options.loadingOptions;
    this.beforeHide = options.beforeHide ?? empty;
    this.afterHide = options.afterHide ?? empty;
    this._beforeShow = options.beforeShow ?? empty;
    this.afterShow = options.afterShow ?? empty;
  }

  public async beforeShow(options: Options<T>): Promise<void> {
    await this._beforeShow?.(options);
  }
}

type OptionsWithUrlParams<T, U extends UrlParamsSchema> = Options<T> & {
  urlParams?: z.infer<U>;
};

type UrlParamsSchema = z.ZodObject<Record<string, z.ZodTypeAny>>;
type PagePropertiesWithUrlParams<T, U extends UrlParamsSchema> = Omit<
  PageProperties<T>,
  "beforeShow"
> & {
  urlParamsSchema: U;
  beforeShow?: (options: OptionsWithUrlParams<T, U>) => Promise<void>;
};

export class PageWithUrlParams<T, U extends UrlParamsSchema> extends Page<T> {
  private urlSchema: U;
  protected override _beforeShow: (
    options: OptionsWithUrlParams<T, U>,
  ) => Promise<void>;

  constructor(options: PagePropertiesWithUrlParams<T, U>) {
    super(options);
    this.urlSchema = options.urlParamsSchema;
    this._beforeShow = options.beforeShow ?? empty;
  }

  private readUrlParams(): z.infer<U> | undefined {
    const urlParams = new URLSearchParams(window.location.search);

    const parsed = parseUrlSearchParams({
      schema: this.urlSchema,
      input: urlParams,
    });

    if (!parsed.success) {
      return undefined;
    }
    return parsed.data;
  }

  public setUrlParams(params: z.infer<U>): void {
    const urlParams = serializeUrlSearchParams({
      schema: this.urlSchema,
      data: params,
    });
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.history.replaceState({}, "", newUrl);
  }

  public override async beforeShow(options: Options<T>): Promise<void> {
    const urlParams = this.readUrlParams();
    await this._beforeShow?.({ ...options, urlParams: urlParams });
  }
}
