import { Mode2, Mode, PersonalBest } from "@monkeytype/schemas/shared";
import { format as formatDate } from "date-fns/format";
import { createMemo, createSignal, For, JSXElement, Show } from "solid-js";

import { getConfig } from "../../config/store";
import * as DB from "../../db";
import { pbTablesMode } from "../../states/pb-tables-modal";
import { Formatting } from "../../utils/format";
import { getLanguageDisplayString } from "../../utils/strings";
import { AnimatedModal } from "../common/AnimatedModal";
import { Fa } from "../common/Fa";
import {
  Table,
  TableBody,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from "../ui/table/Table";
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

export function PbTablesModal(): JSXElement {
  const [rows, setRows] = createSignal<PBRow[]>([]);
  const format = createMemo(() => new Formatting(getConfig));
  const mode = createMemo(() => pbTablesMode());

  return (
    <AnimatedModal
      id="PbTables"
      modalClass="max-w-full gap-0 overflow-y-scroll overscroll-y-contain p-8"
      beforeShow={() => {
        setRows(buildRows(mode()));
      }}
    >
      <Table>
        <TableHeader class="sticky -top-8 z-3 bg-bg text-xs">
          <TableRow>
            <TableHead class="w-[1%]">{mode()}</TableHead>
            <TableHead class="text-right">
              {format().typingSpeedUnit}
              <br />
              <span class="opacity-50">accuracy</span>
            </TableHead>
            <TableHead class="text-right">
              raw
              <br />
              <span class="opacity-50">consistency</span>
            </TableHead>
            <TableHead class="text-right">difficulty</TableHead>
            <TableHead class="text-right">language</TableHead>
            <TableHead class="text-center">punctuation</TableHead>
            <TableHead class="text-center">numbers</TableHead>
            <TableHead class="text-right">lazy mode</TableHead>
            <TableHead class="text-right">date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <For each={rows()}>
            {(row) => {
              return (
                <TableRow>
                  <Show when={row.showMode2} fallback={<TableCell />}>
                    <TableCell class="text-right text-2xl">
                      {row.pb.mode2}
                    </TableCell>
                  </Show>
                  <TableCell class="text-right">
                    {format().typingSpeed(row.pb.wpm)}
                    <br />
                    <span class="opacity-50">
                      {format().accuracy(row.pb.acc)}
                    </span>
                  </TableCell>
                  <TableCell class="text-right">
                    {format().typingSpeed(row.pb.raw)}
                    <br />
                    <span class="opacity-50">
                      {format().percentage(row.pb.consistency)}
                    </span>
                  </TableCell>
                  <TableCell class="text-right">{row.pb.difficulty}</TableCell>
                  <TableCell class="text-right">
                    {row.pb.language
                      ? getLanguageDisplayString(row.pb.language)
                      : "-"}
                  </TableCell>
                  <TableCell class="text-center">
                    <Show when={row.pb.punctuation}>
                      <Fa icon="fa-check" />
                    </Show>
                  </TableCell>
                  <TableCell class="text-center">
                    <Show when={row.pb.numbers}>
                      <Fa icon="fa-check" />
                    </Show>
                  </TableCell>
                  <TableCell class="text-right">
                    <Show when={row.pb.lazyMode}>
                      <Fa icon="fa-check" />
                    </Show>
                  </TableCell>
                  <TableCell class="text-right">
                    <Show
                      when={row.pb.timestamp}
                      fallback={
                        <>
                          -<br />
                          <span class="opacity-50">-</span>
                        </>
                      }
                    >
                      {formatDate(row.pb.timestamp, "dd MMM yyyy")}
                      <br />
                      <div class="opacity-50">
                        {formatDate(row.pb.timestamp, "HH:mm")}
                      </div>
                    </Show>
                  </TableCell>
                </TableRow>
              );
            }}
          </For>
        </TableBody>
      </Table>
    </AnimatedModal>
  );
}
