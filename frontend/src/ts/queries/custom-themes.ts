import { CustomTheme as CustomThemeSchema } from "@monkeytype/schemas/users";
import { Result } from "@monkeytype/util/trycatch";
import { createMemo, createRoot } from "solid-js";

import Ape from "../ape";
import { tempId } from "../collections/utils/misc";
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
 * The signed-in user's custom themes: a list session query, downloaded in the
 * blocking user-data step. Getters return only what's loaded, never fetch;
 * reactive inside components and effects, a plain read elsewhere.
 */
export type CustomTheme = DeepReadonly<CustomThemeSchema>;

const customThemesQuery = createSessionQuery<CustomThemeSchema[]>({
  name: "customThemes",
  fetch: fetchCustomThemes,
  id: (theme) => theme._id,
});

const customThemes = createRoot(() =>
  createMemo(() =>
    [...(customThemesQuery.get() ?? [])].sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
  ),
);

// --- Loading ---

async function fetchCustomThemes(): Promise<CustomThemeSchema[]> {
  const response = await Ape.users.getCustomThemes();
  if (response.status !== 200) {
    throw new UserDataLoadError(
      `Custom themes didn't load: ${response.body.message}`,
      response.status,
    );
  }
  return response.body.data;
}

/** Downloads the custom themes (the auth flow, beside `loadUserData`); throws on failure. */
export async function loadCustomThemes(): Promise<void> {
  await customThemesQuery.download();
}

// --- Reads ---

/** The user's custom themes, sorted by name; empty without a user. */
export function getCustomThemes(): readonly CustomTheme[] {
  return customThemes();
}

export function getCustomTheme(id: string): CustomTheme | undefined {
  return customThemes().find((theme) => theme._id === id);
}

// --- Optimistic actions: rolled back by theme id if the request fails ---

/** An optimistic mutation on the custom themes, rolled back by theme id. */
function customThemesMutation<V, R extends ApiResponse>(
  options: MutationOptions<CustomThemeSchema[], V, R>,
): OptimisticMutation<CustomThemeSchema[], V> {
  return optimisticMutation({ ...options, query: customThemesQuery });
}

type Insert = {
  tempId: string;
  name: string;
  colors: CustomThemeSchema["colors"];
  /** The server's id, once saved. */
  themeId?: string;
};

const addCustomThemeMutation = customThemesMutation({
  name: "addCustomTheme",
  // idempotent: the server's id replaces the temporary one
  applyFn: (list, { tempId, name, colors, themeId }: Insert) => {
    const temp = list.findIndex((it) => it._id === tempId);
    if (temp !== -1) list.splice(temp, 1);
    const _id = themeId ?? tempId;
    if (list.some((it) => it._id === _id)) return;
    list.push({ _id, name, colors });
  },
  mutationFn: async ({ name, colors }) =>
    Ape.users.addCustomTheme({ body: { name, colors } }),
  reconcileVars: (vars, { _id }) => ({ ...vars, themeId: _id }),
});

export async function addCustomTheme(params: {
  name: string;
  colors: CustomThemeSchema["colors"];
}): Promise<Result<void>> {
  return runMutation(addCustomThemeMutation, { ...params, tempId: tempId() });
}

type Edit = {
  themeId: string;
  name: string;
  colors: CustomThemeSchema["colors"];
};

const editCustomThemeMutation = customThemesMutation({
  name: "editCustomTheme",
  applyFn: (list, { themeId, name, colors }: Edit) => {
    const theme = list.find((it) => it._id === themeId);
    if (theme === undefined) return;
    theme.name = name;
    theme.colors = colors;
  },
  mutationFn: async ({ themeId, name, colors }) =>
    Ape.users.editCustomTheme({ body: { themeId, theme: { name, colors } } }),
});

export async function editCustomTheme(params: Edit): Promise<Result<void>> {
  return runMutation(editCustomThemeMutation, params);
}

const deleteCustomThemeMutation = customThemesMutation({
  name: "deleteCustomTheme",
  applyFn: (list, themeId: string) => {
    const index = list.findIndex((it) => it._id === themeId);
    if (index !== -1) list.splice(index, 1);
  },
  mutationFn: async (themeId) =>
    Ape.users.deleteCustomTheme({ body: { themeId } }),
});

export async function deleteCustomTheme({
  themeId,
}: {
  themeId: string;
}): Promise<Result<void>> {
  return runMutation(deleteCustomThemeMutation, themeId);
}
