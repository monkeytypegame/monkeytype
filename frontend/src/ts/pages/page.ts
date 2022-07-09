export default class Page {
  public name: string;
  public element: JQuery;
  public pathname: string;
  public beforeHide: () => Promise<void>;
  public afterHide: () => Promise<void>;
  public beforeShow: (params?: { [key: string]: string }) => Promise<void>;
  public afterShow: () => Promise<void>;
  constructor(
    name: string,
    element: JQuery,
    pathname: string,
    beforeHide: () => Promise<void>,
    afterHide: () => Promise<void>,
    beforeShow: (params?: { [key: string]: string }) => Promise<void>,
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
