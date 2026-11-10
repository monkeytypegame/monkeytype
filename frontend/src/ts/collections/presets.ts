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
import { tempId, keepForever } from "./utils/misc";
import { createRoot } from "solid-js";
import { isAuthenticated } from "../states/core";
import { replaceUnderscoresWithSpaces } from "../utils/strings";

export type PresetItem = Preset;

const queryKeys = {
  root: () => [...baseKey("presets", { isUserSpecific: true })],
};

const presetsCollection = createCollection({
  ...queryCollectionOptions({
    ...keepForever,
    staleTime: Infinity,
    queryKey: queryKeys.root(),
    queryClient,
    enabled: isAuthenticated,
    getKey: (it) => it._id,
    queryFn: async () => {
      const response = await Ape.presets.get();

      if (response.status !== 200) {
        throw new Error(`Error fetching presets:${response.body.message}`);
      }

      return response.body.data.map((it) => ({
        ...it,
        name: replaceUnderscoresWithSpaces(it.name),
      }));
    },
  }),
  ...keepForever,
});

// The module-level mirror the getters read: a live query owned by a root that
// lives as long as the page. Read `.state` and `.status` only: calling
// `presetsQuery()` suspends
const presetsQuery = createRoot(() =>
  useLiveQuery((q) => {
    if (!isAuthenticated()) return undefined;
    return q.from({ preset: presetsCollection });
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

      await presetsCollection.utils.writeInsert(newPreset);
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
      await presetsCollection.utils.writeUpdate({
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
      await presetsCollection.utils.writeDelete(presetId);
    },
  }),
};

// --- Public API ---
export async function waitForPresetsReady(): Promise<void> {
  await presetsCollection.stateWhenReady();
}

/**
 * The loaded presets, sorted by name. Reactive in components and effects, a
 * plain read elsewhere. Returns only what's loaded, never fetches.
 */
export function getPresets(): PresetItem[] {
  return [...presetsQuery.state.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

/** A loaded preset by id. Reactive like `getPresets`, never fetches. */
export function getPreset(id: string): PresetItem | undefined {
  return presetsQuery.state.get(id);
}

/** Whether the presets have loaded (false while loading, failed or signed out). */
export function arePresetsLoaded(): boolean {
  return presetsQuery.status === "ready";
}

export async function addPreset(
  params: ActionType["addPreset"],
): Promise<void> {
  const transaction = actions.addPreset(params);
  await transaction.when("settled");
}

export async function editPreset(
  params: ActionType["editPreset"],
): Promise<void> {
  const transaction = actions.editPreset(params);
  await transaction.when("settled");
}

export async function deletePreset(
  params: ActionType["deletePreset"],
): Promise<void> {
  const transaction = actions.deletePreset(params);
  await transaction.when("settled");
}
