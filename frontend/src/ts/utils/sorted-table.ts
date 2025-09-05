type Sort = {
  property: string;
  descending: boolean;
};

type SortedTableOptions<T> = {
  table: string;
  data?: T[];
  buildRow: (entry: T) => HTMLTableRowElement;
  initialSort?: Sort;
};
export class SortedTable<T> {
  protected data: { source: T; element?: HTMLTableRowElement }[];
  private table: JQuery<HTMLTableElement>;
  private buildRow: (entry: T) => HTMLTableRowElement;
  private sort?: Sort;

  constructor({ table, data, buildRow, initialSort }: SortedTableOptions<T>) {
    this.table = $(table);
    if (this.table === undefined) {
      throw new Error(`No element found for ${table}`);
    }

    this.buildRow = buildRow;
    this.data = [];
    if (data !== undefined) {
      this.setData(data);
    }

    if (initialSort !== undefined) {
      this.sort = initialSort;
      this.doSort();
    }

    //init headers
    for (const col of this.table.find(`td[data-sort-property]`)) {
      col.classList.add("sortable");
      col.setAttribute("type", "button");
      col.onclick = (e: MouseEvent) => {
        const target = e.currentTarget as HTMLElement;
        const property = target.dataset["sortProperty"] as string;
        const defaultDirection =
          target.dataset["sortDefaultDirection"] === "desc";
        if (property === undefined) return;

        if (this.sort === undefined || property !== this.sort.property) {
          this.sort = { property, descending: defaultDirection };
        } else {
          this.sort.descending = !this.sort?.descending;
        }

        this.doSort();
        this.updateBody();
      };
    }
  }

  public setSort(sort: Partial<Sort>): void {
    this.sort = { ...this.sort, ...sort } as Sort;
    this.doSort();
  }

  public setData(data: T[]): void {
    this.data = data.map((source) => ({ source }));
    this.doSort();
  }

  private doSort(): void {
    if (this.sort === undefined) return;

    const { property, descending } = this.sort;
    // Removes styling from previous sorting requests:
    this.table.find("thead td").removeClass("headerSorted");
    this.table.find("thead td").children("i").remove();
    this.table
      .find(`thead td[data-sort-property="${property}"]`)
      .addClass("headerSorted")
      .append(
        `<i class="fas ${
          descending ? "fa-sort-down" : "fa-sort-up"
        } aria-hidden="true"></i>`
      );

    this.data.sort((a, b) => {
      const valA = getValueByPath(a.source, property);
      const valB = getValueByPath(b.source, property);

      let result = 0;

      if (valA === undefined && valB !== undefined) {
        return descending ? 1 : -1;
      } else if (valA !== undefined && valB === undefined) {
        return descending ? -1 : 1;
      }

      if (typeof valA === "string" && typeof valB === "string") {
        result = valA.localeCompare(valB);
      }

      if (typeof valA === "number" && typeof valB === "number") {
        result = valA - valB;
      }

      return descending ? -result : result;
    });
  }
  public updateBody(): void {
    const body = this.table.find("tbody");
    body.empty();
    body.append(
      this.getData().map((data) => {
        if (data.element === undefined) {
          data.element = this.buildRow(data.source);
        }
        return data.element;
      })
    );
  }
  protected getData(): { source: T; element?: HTMLTableRowElement }[] {
    return this.data;
  }
}

function getValueByPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce((acc, key) => {
    // oxlint-disable-next-line no-explicit-any
    // @ts-expect-error this is fine
    return acc !== null && acc !== undefined ? acc[key] : undefined;
  }, obj);
}

export class SortedTableWithLimit<T> extends SortedTable<T> {
  private limit: number;
  constructor(options: SortedTableOptions<T> & { limit: number }) {
    super(options);
    this.limit = options.limit;
  }
  protected override getData(): { source: T; element?: HTMLTableRowElement }[] {
    return this.data.slice(0, this.limit);
  }

  public setLimit(limit: number): void {
    this.limit = limit;
  }
}
