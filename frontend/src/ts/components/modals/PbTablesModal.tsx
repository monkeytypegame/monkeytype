import { Mode2, Mode, PersonalBest } from "@monkeytype/schemas/shared";
import { createColumnHelper } from "@tanstack/solid-table";
import { format as formatDate } from "date-fns/format";
import { createMemo, createSignal, JSXElement, Show } from "solid-js";

import { getConfig } from "../../config/store";
import * as DB from "../../db";
import { pbTablesMode } from "../../states/pb-tables-modal";
import { cn } from "../../utils/cn";
import { Formatting } from "../../utils/format";
import { getLanguageDisplayString } from "../../utils/strings";
import { AnimatedModal } from "../common/AnimatedModal";
import { Fa } from "../common/Fa";
import { DataTable, DataTableColumnDef } from "../ui/table/DataTable";
import { MOCK_PERSONAL_BESTS, USE_MOCK_PB_DATA } from "./PbTablesModal.mock";

type PBWithMode2 = PersonalBest & {
  mode2: Mode2<Mode>;
};

type PBRow = {
  pb: PBWithMode2;
  showMode2: boolean;
};

function buildRows(mode: Mode): PBRow[] {
  const allmode2 = (
    USE_MOCK_PB_DATA
      ? MOCK_PERSONAL_BESTS[mode as "time" | "words"]
      : DB.getSnapshot()?.personalBests?.[mode]
  ) as Record<string, PBWithMode2[]> | undefined;
  if (allmode2 === undefined) return [];

  const list: PBWithMode2[] = [];
  Object.keys(allmode2).forEach((key) => {
    let pbs = allmode2[key] ?? [];
    pbs = [...pbs].sort((a, b) => b.wpm - a.wpm);
    pbs.forEach((pb) => {
      pb.mode2 = key;
      list.push(pb);
    });
  });

  const rows: PBRow[] = [];
  let currentMode2: string | undefined;

  list.forEach((pb) => {
    const showMode2 = currentMode2 !== pb.mode2;
    currentMode2 = pb.mode2;
    rows.push({ pb, showMode2 });
  });

  return rows;
}

function getColumns(options: {
  format: Formatting;
  mode: Mode;
}): DataTableColumnDef<PBRow>[] {
  const col = createColumnHelper<PBRow>().accessor;
  const { format: f, mode: m } = options;

  return [
    col((row) => row.pb.mode2, {
      id: "mode2",
      enableSorting: false,
      header: () => m,
      cell: (info) => info.row.original.pb.mode2,
      meta: {
        align: "right",
        cellMeta: (info) => ({
          class: cn(
            "text-xl font-light text-text/40",
            info.row.showMode2 && "font-normal text-text",
          ),
        }),
      },
    }),
    col((row) => row.pb.wpm, {
      id: "wpm",
      enableSorting: false,
      header: () => (
        <>
          {f.typingSpeedUnit}
          <br />
          <span class="opacity-50">accuracy</span>
        </>
      ),
      cell: (info) => (
        <>
          {f.typingSpeed(info.row.original.pb.wpm)}
          <br />
          <span class="opacity-50">{f.accuracy(info.row.original.pb.acc)}</span>
        </>
      ),
      meta: { align: "right" },
    }),
    col((row) => row.pb.raw, {
      id: "raw",
      enableSorting: false,
      header: () => (
        <>
          raw
          <br />
          <span class="opacity-50">consistency</span>
        </>
      ),
      cell: (info) => (
        <>
          {f.typingSpeed(info.row.original.pb.raw)}
          <br />
          <span class="opacity-50">
            {f.percentage(info.row.original.pb.consistency)}
          </span>
        </>
      ),
      meta: { align: "right" },
    }),
    col((row) => row.pb.difficulty, {
      id: "difficulty",
      enableSorting: false,
      header: () => "difficulty",
      cell: (info) => info.row.original.pb.difficulty,
      meta: { align: "right" },
    }),
    col((row) => row.pb.language, {
      id: "language",
      enableSorting: false,
      header: () => "language",
      cell: (info) => {
        const lang = info.row.original.pb.language;
        return lang ? getLanguageDisplayString(lang) : "-";
      },
      meta: { align: "right" },
    }),
    col((row) => row.pb.punctuation, {
      id: "punctuation",
      enableSorting: false,
      header: () => "punctuation",
      cell: (info) =>
        info.row.original.pb.punctuation ? <Fa icon="fa-check" /> : null,
      meta: { align: "center" },
    }),
    col((row) => row.pb.numbers, {
      id: "numbers",
      enableSorting: false,
      header: () => "numbers",
      cell: (info) =>
        info.row.original.pb.numbers ? <Fa icon="fa-check" /> : null,
      meta: { align: "center" },
    }),
    col((row) => row.pb.lazyMode, {
      id: "lazyMode",
      enableSorting: false,
      header: () => "lazy mode",
      cell: (info) =>
        info.row.original.pb.lazyMode ? <Fa icon="fa-check" /> : null,
      meta: { align: "center" },
    }),
    col((row) => row.pb.timestamp, {
      id: "date",
      enableSorting: false,
      header: () => "date",
      cell: (info) => {
        const ts = info.row.original.pb.timestamp;
        return (
          <Show
            when={ts}
            fallback={
              <>
                -<br />
                <span class="opacity-50">-</span>
              </>
            }
          >
            {formatDate(ts, "dd MMM yyyy")}
            <br />
            <div class="opacity-50">{formatDate(ts, "HH:mm")}</div>
          </Show>
        );
      },
      meta: { align: "right" },
    }),
  ];
}

export function PbTablesModal(): JSXElement {
  const [rows, setRows] = createSignal<PBRow[]>([]);
  const format = createMemo(() => new Formatting(getConfig));
  const mode = createMemo(() => pbTablesMode());
  const columns = createMemo(() =>
    getColumns({ format: format(), mode: mode() }),
  );

  return (
    <AnimatedModal
      id="PbTables"
      modalClass="max-w-full gap-0 p-8"
      beforeShow={() => {
        setRows(buildRows(mode()));
      }}
    >
      <DataTable
        id="pbTables"
        columns={columns()}
        data={rows()}
        class="[&>thead]:sticky [&>thead]:-top-8 [&>thead]:z-3 [&>thead]:bg-bg [&>thead]:text-xs"
      />
    </AnimatedModal>
  );
}
