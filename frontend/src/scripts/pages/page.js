export default class Page {
  constructor(
    name,
    element,
    pathname,
    beforeHide,
    afterHide,
    beforeShow,
    afterShow
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
