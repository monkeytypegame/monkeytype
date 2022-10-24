interface Options {
  params?: Record<string, string>;
  data?: any;
  tribeOverride?: boolean;
}

interface PageFunctionOptions {
  params?: { [key: string]: string };
  tribeOverride?: boolean;
}

export default class Page {
  public name: string;
  public element: JQuery;
  public pathname: string;
  public beforeHide: (options: PageFunctionOptions) => Promise<void>;
  public afterHide: () => Promise<void>;
  public beforeShow: (options: Options) => Promise<void>;
  public afterShow: () => Promise<void>;
  constructor(
    name: string,
    element: JQuery,
    pathname: string,
    beforeHide: (options: PageFunctionOptions) => Promise<void>,
    afterHide: () => Promise<void>,
    beforeShow: (options: Options) => Promise<void>,
    afterShow: () => Promise<void>
  ) {
    this.name = name;
    this.element = element;
    this.pathname = pathname;
    this.beforeHide = beforeHide;
    this.afterHide = afterHide;
    this.beforeShow = beforeShow;
    this.afterShow = afterShow;
  }
}
