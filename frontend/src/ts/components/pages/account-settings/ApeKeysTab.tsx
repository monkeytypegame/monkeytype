import { ApeKeyNameSchema } from "@monkeytype/schemas/ape-keys";
import { createColumnHelper } from "@tanstack/solid-table";
import { format as dateFormat } from "date-fns";
import { createMemo } from "solid-js";
import { z } from "zod";

import {
  ApeKeyEntry,
  insertApeKey,
  removeApeKey,
  renameApeKey,
  updateApeKeyEnabled,
  useApeKeyLiveQuery,
} from "../../../collections/ape-keys";
import { showModal } from "../../../states/modals";
import { showSimpleModal } from "../../../states/simple-modal";
import { replaceSpacesWithUnderscores } from "../../../utils/strings";
import AsyncContent from "../../common/AsyncContent";
import { Button } from "../../common/Button";
import { DataTable, DataTableColumnDef } from "../../ui/table/DataTable";
import { Section } from "./utils";

export function ApeKeysTab() {
  const columns = createMemo(() => getColumns());
  const apeKeyQuery = useApeKeyLiveQuery();
  return (
    <>
      <Section
        title="ape keys"
        fa={{ icon: "fa-key" }}
        text=<>
          Generate Ape Keys to access certain API endpoints (
          <Button
            text="documentation"
            href="https://api.monkeytype.com/docs"
            variant="text"
          />
          ).
        </>
        button={{
          text: "generate new key",
          onClick: addNewKey,
        }}
      />
      <AsyncContent collections={{ apeKeyQuery }}>
        {({ apeKeyQueryData }) => (
          <DataTable
            id="apeKeys"
            columns={columns()}
            data={apeKeyQueryData()}
            fallback={
              <div class="text-center text-sub">
                You don&lsquo;t have any ape keys yet.
              </div>
            }
          />
        )}
      </AsyncContent>
    </>
  );
}

function getColumns(): DataTableColumnDef<ApeKeyEntry>[] {
  const defineColumn = createColumnHelper<ApeKeyEntry>().accessor;

  const columns = [
    defineColumn("_id", {
      header: "active",
      cell: (info) => (
        <Button
          variant="text"
          fa={
            info.row.original.enabled
              ? { fixedWidth: true, icon: "fa-check-square" }
              : { variant: "regular", fixedWidth: true, icon: "fa-square" }
          }
          onClick={() =>
            void updateApeKeyEnabled({
              apeKeyId: info.getValue(),
              enabled: !info.row.original.enabled,
            })
          }
        />
      ),
    }),
    defineColumn("name", {
      header: "name",
    }),
    defineColumn("createdOn", {
      header: "created on",
      cell: (info) => dateFormat(info.getValue(), "dd MMM yyyy HH:mm"),
    }),
    defineColumn("modifiedOn", {
      header: "modified on",
      cell: (info) => dateFormat(info.getValue(), "dd MMM yyyy HH:mm"),
    }),
    defineColumn("lastUsedOn", {
      header: "last used on",
      cell: (info) =>
        info.getValue() === -1
          ? "-"
          : dateFormat(info.getValue(), "dd MMM yyyy HH:mm"),
    }),
    defineColumn("_id", {
      header: "",
      cell: (info) => (
        <div class="flex justify-end gap-2">
          <Button
            fa={{ fixedWidth: true, icon: "fa-pen" }}
            balloon={{ text: "rename" }}
            onClick={() => showRenameModal(info.getValue())}
          />
          <Button
            fa={{ fixedWidth: true, icon: "fa-trash-alt" }}
            balloon={{ text: "delete" }}
            onClick={() => {
              showSimpleModal({
                title: "Delete Ape key",
                text: "Are you sure?",
                buttonText: "delete",
                execFn: async () => {
                  await removeApeKey({ apeKeyId: info.getValue() });
                  return { status: "success", message: "Key deleted" };
                },
              });
            }}
          />
        </div>
      ),
    }),
  ];

  //mark each column non sortable
  return columns.map((it) => ({ ...it, enableSorting: false }));
}

function addNewKey(): void {
  showSimpleModal({
    title: "Generate new Ape key",
    buttonText: "generate",
    schema: z.object({ name: ApeKeyNameSchema }),
    inputs: {
      name: {
        type: "text",
        placeholder: "Name",
        preprocess: replaceSpacesWithUnderscores,
      },
    },

    execFn: async ({ name }) => {
      await insertApeKey({ name });
      return {
        status: "success",
        message: "Key generated",
        afterHide: (): void => {
          showModal("ViewApeKey");
        },
      };
    },
  });
}

function showRenameModal(apeKeyId: string): void {
  showSimpleModal({
    title: "Edit Ape key",
    buttonText: "edit",
    schema: z.object({ name: ApeKeyNameSchema }),
    inputs: {
      name: {
        type: "text",
        placeholder: "name",
        preprocess: replaceSpacesWithUnderscores,
      },
    },

    execFn: async ({ name }) => {
      await renameApeKey({ apeKeyId, name });
      return {
        status: "success",
        message: "Key updated",
      };
    },
  });
}
