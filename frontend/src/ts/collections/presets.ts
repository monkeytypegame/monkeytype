import { Preset } from "@monkeytype/schemas/presets";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import {
  createCollection,
  createOptimisticAction,
  useLiveQuery,
} from "@tanstack/solid-db";
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

// oxlint-disable-next-line typescript/explicit-function-return-type
export function usePresetsLiveQuery() {
  return useLiveQuery((q) => {
    return q.from({ preset: presetsCollection }).select((p) => ({ ...p }));
  });
}

const presetsCollection = createCollection(
  queryCollectionOptions({
    staleTime: Infinity,
    startSync: true,
    queryKey: queryKeys.root(),

    queryClient,
    getKey: (it) => it._id,
    queryFn: async () => {
      return [] as PresetItem[];
    },
  }),
);

type ActionType = {
  addPreset: {
    name: string;
    config: Preset["config"];
    settingGroups: ConfigGroupName[] | undefined;
  };
  editPreset: {
    presetId: string;
    name: string;
    config?: Preset["config"];
    settingGroups?: ConfigGroupName[] | null;
  };
  deletePreset: {
    presetId: string;
  };
};

const actions = {
  addPreset: createOptimisticAction<ActionType["addPreset"]>({
    onMutate: ({ name, config, settingGroups }) => {
      presetsCollection.insert({
        _id: "temp-" + Date.now(),
        name,
        display: name.replaceAll("_", " "),
        config,
        settingGroups,
      });
    },
    mutationFn: async ({ name, config, settingGroups }) => {
      const response = await Ape.presets.add({
        body: {
          name,
          config,
          ...(settingGroups !== undefined && { settingGroups }),
        },
      });
      if (response.status !== 200) {
        throw new Error(`Failed to add preset: ${response.body.message}`);
      }
      presetsCollection.utils.writeInsert(
        toPresetItem({
          _id: response.body.data.presetId,
          name: name,
          settingGroups: settingGroups,
          config: config,
        }),
      );
    },
  }),
  editPreset: createOptimisticAction<ActionType["editPreset"]>({
    onMutate: ({ presetId, name, config, settingGroups }) => {
      presetsCollection.update(presetId, (preset) => {
        preset.name = name;
        preset.display = name.replaceAll("_", " ");

        if (config !== undefined) {
          preset.config = config;
        }
        if (settingGroups !== undefined) {
          preset.settingGroups = settingGroups;
        }
      });
    },
    mutationFn: async ({ presetId, name, config, settingGroups }) => {
      const existing = presetsCollection.get(presetId);

      if (existing === undefined) {
        throw new Error("Preset not found");
      }

      const response = await Ape.presets.save({
        body: {
          _id: presetId,
          name: name,
          ...(config !== undefined && {
            config: config,
            settingGroups: settingGroups,
          }),
        },
      });
      if (response.status !== 200) {
        throw new Error(`Failed to edit preset: ${response.body.message}`);
      }

      // if this is missing getPreset is out of sync
      presetsCollection.utils.writeUpdate({
        _id: presetId,
        name,
        display: name.replaceAll("_", " "),
        ...(config !== undefined && { config }),
        ...(settingGroups !== undefined && { settingGroups }),
      });
    },
  }),
  deletePreset: createOptimisticAction<ActionType["deletePreset"]>({
    onMutate: ({ presetId }) => {
      presetsCollection.delete(presetId);
    },
    mutationFn: async ({ presetId }) => {
      const response = await Ape.presets.delete({
        params: { presetId },
      });
      if (response.status !== 200) {
        throw new Error(`Failed to delete preset: ${response.body.message}`);
      }
      presetsCollection.utils.writeDelete(presetId);
    },
  }),
};

// --- Public API ---

// todo: this might not be reactive
export function getPresets(): PresetItem[] {
  return [...presetsCollection.values()];
}

// todo: this might not be reactive
export function getPreset(id: string): PresetItem | undefined {
  return presetsCollection.get(id);
}

export function fillPresetsCollection(presets: Preset[]): void {
  const presetItems = presets
    .map(toPresetItem)
    .sort((a, b) => a.name.localeCompare(b.name));

  presetsCollection.utils.writeBatch(() => {
    presetsCollection.forEach((preset) => {
      presetsCollection.utils.writeDelete(preset._id);
    });
    presetItems.forEach((item) => {
      presetsCollection.utils.writeInsert(item);
    });
  });
}

export async function addPreset(
  params: ActionType["addPreset"],
): Promise<void> {
  const transaction = actions.addPreset(params);
  await transaction.isPersisted.promise;
}

export async function editPreset(
  params: ActionType["editPreset"],
): Promise<void> {
  const transaction = actions.editPreset(params);
  await transaction.isPersisted.promise;
}

export async function deletePreset(
  params: ActionType["deletePreset"],
): Promise<void> {
  const transaction = actions.deletePreset(params);
  await transaction.isPersisted.promise;
}
