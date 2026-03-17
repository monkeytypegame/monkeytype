import { z } from "zod";
import { ElementWithUtils } from "./dom";

export const SortSchema = z.object({
  property: z.string(),
  descending: z.boolean(),
});
export type Sort = z.infer<typeof SortSchema>;

type Persistence = {
  get: () => Sort;
  set: (sort: Sort) => boolean;
};

type SortedTableOptions<T> = {
  table: ElementWithUtils;
  data?: T[];
  buildRow: (entry: T) => HTMLTableRowElement;
} & (
  | { initialSort?: Sort; persistence?: never }
  | { persistence?: Persistence; initialSort?: never }
);

export class SortedTable<T> {
  protected data: { source: T; element?: HTMLTableRowElement }[] = [];
  private table: ElementWithUtils;
  private buildRow: (entry: T) => HTMLTableRowElement;
  private sort?: Sort;
  private persistence?: Persistence;

  constructor(options: SortedTableOptions<T>) {
    this.table = options.table;

    this.buildRow = options.buildRow;

    if (options.data !== undefined) {
      this.setData(options.data);
    }

    if ("persistence" in options && options.persistence !== undefined) {
      this.persistence = options.persistence;
      this.sort = this.persistence.get();
      this.doSort();
    } else if ("initialSort" in options && options.initialSort !== undefined) {
      this.sort = options.initialSort;
      this.doSort();
    }

    //init headers
    for (const col of this.table.qsa(`td[data-sort-property]`)) {
      col.addClass("sortable");
      col.setAttribute("type", "button");
      col.on("click", (e: MouseEvent) => {
        const target = e.currentTarget as HTMLElement;
        const property = target.dataset["sortProperty"] as string;
        const defaultDirection =
          target.dataset["sortDefaultDirection"] === "desc";
        if (property === undefined) return;

        let updatedSort = this.sort;

        if (updatedSort === undefined || property !== updatedSort.property) {
          updatedSort = { property, descending: defaultDirection };
        } else {
          updatedSort.descending = !updatedSort?.descending;
        }
        this.setSort(updatedSort);

        this.updateBody();
      });
    }
  }

  public setSort(sort: Partial<Sort>): void {
    this.sort = { ...this.sort, ...sort } as Sort;
    this.persistence?.set(this.sort);
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
    this.table.qsa("thead td").removeClass("headerSorted");
    this.table.qsa("thead td > i").remove();
    this.table
      .qsa(`thead td[data-sort-property="${property}"]`)
      .addClass("headerSorted")
      .appendHtml(
        `<i class="fas ${
          descending ? "fa-sort-down" : "fa-sort-up"
        } aria-hidden="true"></i>`,
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
    const body = this.table.qs("tbody");
    body?.empty();
    body?.append(
      this.getData().map((data) => {
        data.element ??= this.buildRow(data.source);
        return data.element;
      }),
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
