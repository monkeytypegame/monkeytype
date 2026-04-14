import { Preset } from "@monkeytype/schemas/presets";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/solid-db";
import Ape from "../ape";
import { queryClient } from "../queries";
import { baseKey } from "../queries/utils/keys";
import { ConfigGroupName } from "@monkeytype/schemas/configs";

export type PresetItem = Preset & { display: string };

const queryKeys = {
  root: () => [...baseKey("presets", { isUserSpecific: true })],
};

function toPresetItem(preset: Preset): PresetItem {
  return {
    ...preset,
    display: preset.name.replaceAll("_", " "),
  };
}

let seedData: PresetItem[] = [];

const presetsCollection = createCollection(
  queryCollectionOptions({
    staleTime: Infinity,
    startSync: true,
    queryKey: queryKeys.root(),

    queryClient,
    getKey: (it) => it._id,
    onUpdate: async ({ transaction }) => {
      const mutation = transaction.mutations[0];
      if (mutation === undefined) return { refetch: false };

      const action = (mutation.metadata as Record<string, string>)?.[
        "action"
      ] as string;

      if (action === "editPreset") {
        const m = mutation.modified;
        const meta = mutation.metadata as Record<string, unknown>;
        const response = await Ape.presets.save({
          body: {
            _id: mutation.key as string,
            name: m.name,
            ...(meta["updateConfig"] === true && {
              config: m.config,
              settingGroups: m.settingGroups,
            }),
          },
        });
        if (response.status !== 200) {
          throw new Error(`Failed to edit preset: ${response.body.message}`);
        }
      }

      return { refetch: false };
    },
    queryFn: async () => {
      return seedData;
    },
    onInsert: async ({ transaction }) => {
      const newItems = transaction.mutations.map((m) => m.modified);

      const serverItems = await Promise.all(
        newItems.map(async (it) => {
          const response = await Ape.presets.add({
            body: {
              name: it.name,
              config: it.config,
              ...(it.settingGroups !== undefined &&
                it.settingGroups !== null && {
                  settingGroups: it.settingGroups,
                }),
            },
          });
          if (response.status !== 200) {
            throw new Error(`Failed to add preset: ${response.body.message}`);
          }
          return toPresetItem({
            ...it,
            _id: response.body.data.presetId,
          });
        }),
      );

      presetsCollection.utils.writeBatch(() => {
        serverItems.forEach((it) => presetsCollection.utils.writeInsert(it));
      });
      return { refetch: false };
    },
    onDelete: async ({ transaction }) => {
      const ids = transaction.mutations.map((it) => it.key as string);

      await Promise.all(
        ids.map(async (id) => {
          const response = await Ape.presets.delete({
            params: { presetId: id },
          });
          if (response.status !== 200) {
            throw new Error(
              `Failed to delete preset: ${response.body.message}`,
            );
          }
        }),
      );
      return { refetch: false };
    },
  }),
);

// --- Public API ---

export function getPresets(): PresetItem[] {
  return [...presetsCollection.values()];
}

export function getPreset(id: string): PresetItem | undefined {
  return presetsCollection.get(id);
}

export function seedFromUserData(presets: Preset[]): void {
  seedData = presets
    .map(toPresetItem)
    .sort((a, b) => a.name.localeCompare(b.name));

  presetsCollection.utils.writeBatch(() => {
    presetsCollection.forEach((preset) => {
      presetsCollection.utils.writeDelete(preset._id);
    });
    seedData.forEach((item) => {
      presetsCollection.utils.writeInsert(item);
    });
  });
}

export async function addPreset(
  name: string,
  config: Preset["config"],
  settingGroups: ConfigGroupName[] | undefined,
): Promise<void> {
  const transaction = presetsCollection.insert(
    toPresetItem({
      _id: "temp-" + Date.now(),
      name,
      config,
      ...(settingGroups !== undefined && { settingGroups }),
    }),
  );
  await transaction.isPersisted.promise;
}

export async function editPreset(
  presetId: string,
  name: string,
  config?: Preset["config"],
  settingGroups?: ConfigGroupName[] | null,
): Promise<void> {
  const existing = presetsCollection.get(presetId);
  if (existing === undefined) throw new Error("Preset not found");

  const transaction = presetsCollection.update(
    presetId,
    { metadata: { action: "editPreset", updateConfig: config !== undefined } },
    (preset) => {
      preset.name = name;
      preset.display = name.replaceAll("_", " ");

      //todo: config doesnt seem to get updated. related to objects?

      if (config !== undefined) {
        preset.config = config;
      }
      if (settingGroups !== undefined) {
        preset.settingGroups = settingGroups;
      }
    },
  );

  console.log("transaction", transaction);

  await transaction.isPersisted.promise;
}

export async function deletePreset(presetId: string): Promise<void> {
  const transaction = presetsCollection.delete(presetId);
  await transaction.isPersisted.promise;
}
