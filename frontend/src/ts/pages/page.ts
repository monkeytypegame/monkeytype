type Options<T> = {
  params?: Record<string, string>;
  data?: T;
};

type PageProperties<T> = {
  name: MonkeyTypes.PageName;
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
  public name: MonkeyTypes.PageName;
  public element: JQuery;
  public pathname: string;
  public beforeHide: () => Promise<void>;
  public afterHide: () => Promise<void>;
  public beforeShow: (options: Options<T>) => Promise<void>;
  public afterShow: () => Promise<void>;

  constructor(props: PageProperties<T>) {
    this.name = props.name;
    this.element = props.element;
    this.pathname = props.path;
    this.beforeHide = props.beforeHide ?? empty;
    this.afterHide = props.afterHide ?? empty;
    this.beforeShow = props.beforeShow ?? empty;
    this.afterShow = props.afterShow ?? empty;
  }
}
