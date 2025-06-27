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
  public beforeShow: (options: Options<T>) => Promise<void>;
  public afterShow: () => Promise<void>;

  constructor(props: PageProperties<T>) {
    this.id = props.id;
    this.display = props.display;
    this.element = props.element;
    this.pathname = props.path;
    this.beforeHide = props.beforeHide ?? empty;
    this.afterHide = props.afterHide ?? empty;
    this.beforeShow = props.beforeShow ?? empty;
    this.afterShow = props.afterShow ?? empty;
  }
}

type UrlParameterSchema = z.ZodObject<Record<string, z.ZodTypeAny>>;
type PagePropertiesWithUrlParams<
  T,
  U extends UrlParameterSchema
> = PageProperties<T> & {
  urlParams: {
    schema: U;
    onLoad?: (params: z.infer<U> | null) => Promise<void>;
  };
};

export class PageWithUrlParams<
  T,
  U extends UrlParameterSchema
> extends Page<T> {
  private urlSchema: U;
  private urlOnload?: (params: z.infer<U> | null) => Promise<void>;

  constructor(props: PagePropertiesWithUrlParams<T, U>) {
    super(props);
    this.urlSchema = props.urlParams.schema;
    this.urlOnload = props.urlParams.onLoad;
  }

  public async readGetParameters(): Promise<void> {
    if (this.urlOnload === undefined) {
      return;
    }
    const urlParams = new URLSearchParams(window.location.search);

    const parsed = parseUrlSearchParams({
      schema: this.urlSchema,
      input: urlParams,
    });

    if (!parsed.success) {
      await this.urlOnload?.(null);
      return;
    }

    await this.urlOnload?.(parsed.data);
  }
  public setUrlParams(params: z.infer<U>): void {
    const urlParams = serializeUrlSearchParams({
      schema: this.urlSchema,
      data: params,
    });
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.history.replaceState({}, "", newUrl);
  }
}
