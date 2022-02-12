export default class Page {
  public name: string;
  public element: JQuery;
  public pathname: string;
  public beforeHide: () => void;
  public afterHide: () => void;
  public beforeShow: () => void;
  public afterShow: () => void;
  constructor(
    name: string,
    element: JQuery,
    pathname: string,
    beforeHide: () => void,
    afterHide: () => void,
    beforeShow: () => void,
    afterShow: () => void
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
