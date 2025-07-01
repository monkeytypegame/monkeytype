import { z } from "zod";
import {
  safeParse as parseUrlSearchParams,
  serialize as serializeUrlSearchParams,
} from "zod-urlsearchparams";

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
  | "leaderboards";

type Options<T> = {
  params?: Record<string, string>;
  data?: T;
};

type PageProperties<T> = {
  id: PageName;
  display?: string;
  element: JQuery;
  path: string;
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
  public element: JQuery;
  public pathname: string;

  public beforeHide: () => Promise<void>;
  public afterHide: () => Promise<void>;
  protected _beforeShow: (options: Options<T>) => Promise<void>;
  public afterShow: () => Promise<void>;

  constructor(props: PageProperties<T>) {
    this.id = props.id;
    this.display = props.display;
    this.element = props.element;
    this.pathname = props.path;
    this.beforeHide = props.beforeHide ?? empty;
    this.afterHide = props.afterHide ?? empty;
    this._beforeShow = props.beforeShow ?? empty;
    this.afterShow = props.afterShow ?? empty;
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
    options: OptionsWithUrlParams<T, U>
  ) => Promise<void>;

  constructor(props: PagePropertiesWithUrlParams<T, U>) {
    super(props);
    this.urlSchema = props.urlParamsSchema;
    this._beforeShow = props.beforeShow ?? empty;
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
