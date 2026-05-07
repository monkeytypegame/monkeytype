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
import { tempId } from "./utils/misc";

export type PresetItem = Preset;

const queryKeys = {
  root: () => [...baseKey("presets", { isUserSpecific: true })],
};

// oxlint-disable-next-line typescript/explicit-function-return-type
export function usePresetsLiveQuery() {
  return useLiveQuery((q) => {
    return q
      .from({ preset: presetsCollection })
      .orderBy(({ preset }) => preset.name, "asc");
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
        _id: tempId(),
        name: name.replace(/_/g, " "),
        config,
        settingGroups,
      });
    },
    mutationFn: async ({ name, config, settingGroups }) => {
      const response = await Ape.presets.add({
        body: {
          name: name.replace(/ /g, "_"),
          config,
          ...(settingGroups !== undefined && { settingGroups }),
        },
      });
      if (response.status !== 200) {
        throw new Error(`Failed to add preset: ${response.body.message}`);
      }

      const newPreset = {
        _id: response.body.data.presetId,
        name: name.replace(/_/g, " "),
        config,
        settingGroups,
      };

      presetsCollection.utils.writeInsert(newPreset);
    },
  }),
  editPreset: createOptimisticAction<ActionType["editPreset"]>({
    onMutate: ({ presetId, name, config, settingGroups }) => {
      presetsCollection.update(presetId, (preset) => {
        preset.name = name.replace(/_/g, " ");

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
          name: name.replace(/ /g, "_"),
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
        name: name.replace(/_/g, " "),
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

function getPresets(): PresetItem[] {
  return [...presetsCollection.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

function getPreset(id: string): PresetItem | undefined {
  return presetsCollection.get(id);
}

export function fillPresetsCollection(presets: Preset[]): void {
  const presetItems = presets.map((preset) => ({
    _id: preset._id,
    name: preset.name.replace(/_/g, " "),
    config: preset.config,
    settingGroups: preset.settingGroups,
  }));

  presetsCollection.utils.writeBatch(() => {
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

/**
 * Used for non reactive access. Do not use in Solid components.
 */
export const __nonReactive = {
  getPresets,
  getPreset,
};
