interface Options<T> {
  params?: Record<string, string>;
  data?: T;
}

export default class Page<T> {
  public name: MonkeyTypes.PageName;
  public element: JQuery;
  public pathname: string;
  public beforeHide: () => Promise<void>;
  public afterHide: () => Promise<void>;
  public beforeShow: (options: Options<T>) => Promise<void>;
  public afterShow: () => Promise<void>;
  constructor(
    name: MonkeyTypes.PageName,
    element: JQuery,
    pathname: string,
    beforeHide: () => Promise<void>,
    afterHide: () => Promise<void>,
    beforeShow: (options: Options<T>) => Promise<void>,
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
