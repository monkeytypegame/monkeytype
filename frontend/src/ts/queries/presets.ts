import { ConfigGroupName } from "@monkeytype/schemas/configs";
import { Preset as PresetSchema } from "@monkeytype/schemas/presets";
import { Result } from "@monkeytype/util/trycatch";
import { createMemo, createRoot } from "solid-js";

import Ape from "../ape";
import { tempId } from "../collections/utils/misc";
import {
  replaceSpacesWithUnderscores,
  replaceUnderscoresWithSpaces,
} from "../utils/strings";
import { DeepReadonly } from "../utils/types";
import { UserDataLoadError } from "../utils/user-data-load-error";
import {
  type ApiResponse,
  type MutationOptions,
  type OptimisticMutation,
  optimisticMutation,
  runMutation,
} from "./utils/optimistic-mutation";
import { createSessionQuery } from "./utils/session-query";

/**
 * The signed-in user's config presets: a list session query, downloaded in the
 * blocking user-data step. Getters return only what's loaded, never fetch;
 * reactive inside components and effects, a plain read elsewhere.
 */
export type Preset = DeepReadonly<PresetSchema>;

const presetsQuery = createSessionQuery<PresetSchema[]>({
  name: "presets",
  fetch: fetchPresets,
  id: (preset) => preset._id,
});

const presets = createRoot(() =>
  createMemo(() =>
    [...(presetsQuery.get() ?? [])].sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
  ),
);

// --- Loading ---

/** Names with spaces. */
async function fetchPresets(): Promise<PresetSchema[]> {
  const response = await Ape.presets.get();
  if (response.status !== 200) {
    throw new UserDataLoadError(
      `Presets didn't load: ${response.body.message}`,
      response.status,
    );
  }
  return response.body.data.map((preset) => ({
    ...preset,
    name: replaceUnderscoresWithSpaces(preset.name),
  }));
}

/** Downloads the presets (the auth flow, beside `loadUserData`); throws on failure. */
export async function loadPresets(): Promise<void> {
  await presetsQuery.download();
}

// --- Reads ---

/** The user's presets, sorted by name; empty without a user. */
export function getPresets(): readonly Preset[] {
  return presets();
}

export function getPreset(id: string): Preset | undefined {
  return presets().find((preset) => preset._id === id);
}

// --- Optimistic actions: rolled back by preset id if the request fails ---

/** An optimistic mutation on the presets, rolled back by preset id. */
function presetsMutation<V, R extends ApiResponse>(
  options: MutationOptions<PresetSchema[], V, R>,
): OptimisticMutation<PresetSchema[], V> {
  return optimisticMutation({ ...options, query: presetsQuery });
}

type Insert = {
  tempId: string;
  name: string;
  config: PresetSchema["config"];
  settingGroups: ConfigGroupName[] | undefined;
  /** The server's id, once saved. */
  presetId?: string;
};

const addPresetMutation = presetsMutation({
  name: "addPreset",
  // idempotent: the server's id replaces the temporary one
  apply: (list, { tempId, name, config, settingGroups, presetId }: Insert) => {
    const temp = list.findIndex((it) => it._id === tempId);
    if (temp !== -1) list.splice(temp, 1);
    const _id = presetId ?? tempId;
    if (list.some((it) => it._id === _id)) return;
    list.push({
      _id,
      name,
      config,
      ...(settingGroups !== undefined && { settingGroups }),
    });
  },
  mutationFn: async (vars) =>
    Ape.presets.add({
      body: {
        name: replaceSpacesWithUnderscores(vars.name),
        config: vars.config,
        ...(vars.settingGroups !== undefined && {
          settingGroups: vars.settingGroups,
        }),
      },
    }),
  reconcileVars: (vars, response) => ({
    ...vars,
    presetId: response.body.data.presetId,
  }),
});

export async function addPreset(params: {
  name: string;
  config: PresetSchema["config"];
  settingGroups: ConfigGroupName[] | undefined;
}): Promise<Result<void>> {
  return runMutation(addPresetMutation, {
    ...params,
    tempId: tempId(),
    name: replaceUnderscoresWithSpaces(params.name),
  });
}

type Edit = {
  presetId: string;
  name: string;
  /** Left out to only rename. */
  config?: PresetSchema["config"];
  /** `null` for a full preset. */
  settingGroups?: ConfigGroupName[] | null;
};

const editPresetMutation = presetsMutation({
  name: "editPreset",
  apply: (list, { presetId, name, config, settingGroups }: Edit) => {
    const preset = list.find((it) => it._id === presetId);
    if (preset === undefined) return;
    preset.name = name;
    if (config !== undefined) preset.config = config;
    if (settingGroups !== undefined) preset.settingGroups = settingGroups;
  },
  mutationFn: async (edit) =>
    Ape.presets.save({
      body: {
        _id: edit.presetId,
        name: replaceSpacesWithUnderscores(edit.name),
        ...(edit.config !== undefined && {
          config: edit.config,
          settingGroups: edit.settingGroups,
        }),
      },
    }),
});

export async function editPreset(params: Edit): Promise<Result<void>> {
  return runMutation(editPresetMutation, {
    ...params,
    name: replaceUnderscoresWithSpaces(params.name),
  });
}

const deletePresetMutation = presetsMutation({
  name: "deletePreset",
  apply: (list, presetId: string) => {
    const index = list.findIndex((it) => it._id === presetId);
    if (index !== -1) list.splice(index, 1);
  },
  mutationFn: async (presetId) => Ape.presets.delete({ params: { presetId } }),
});

export async function deletePreset({
  presetId,
}: {
  presetId: string;
}): Promise<Result<void>> {
  return runMutation(deletePresetMutation, presetId);
}
