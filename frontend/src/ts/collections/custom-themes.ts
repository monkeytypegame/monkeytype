import { CustomTheme } from "@monkeytype/schemas/users";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import {
  createCollection,
  createOptimisticAction,
  useLiveQuery,
} from "@tanstack/solid-db";
import { createRoot } from "solid-js";
import Ape from "../ape";
import { createEffectOn } from "../hooks/effects";
import { queryClient } from "../queries";
import { baseKey } from "../queries/utils/keys";
import { tempId, keepForever } from "./utils/misc";
import { isAuthenticated } from "../states/core";

export type CustomThemeItem = CustomTheme;

const queryKeys = {
  root: () => [...baseKey("customThemes", { isUserSpecific: true })],
};

const customThemesCollection = createCollection({
  ...queryCollectionOptions({
    ...keepForever,
    staleTime: Infinity,
    startSync: true,
    queryKey: queryKeys.root(),
    queryClient,
    enabled: isAuthenticated,
    getKey: (it) => it._id,
    queryFn: async () => {
      const response = await Ape.users.getCustomThemes();

      if (response.status !== 200) {
        throw new Error(
          `Error fetching custom themes: ${response.body.message}`,
        );
      }
      return response.body.data;
    },
  }),
  ...keepForever,
});

// Its query is created disabled: startSync runs at module load, before the
// auth state resolves, and the query never re-evaluates `enabled` on its own.
// Kick the download when the user signs in, like the other user collections.
createRoot(() =>
  createEffectOn(isAuthenticated, (hasUser) => {
    if (hasUser) {
      void customThemesCollection.utils.refetch();
    }
  }),
);

// The module-level mirror the getters read: a live query owned by a root that
// lives as long as the page. Read `.state` and `.status` only: calling
// `customThemesQuery()` suspends
const customThemesQuery = createRoot(() =>
  useLiveQuery((q) => {
    if (!isAuthenticated()) return undefined;
    return q.from({ customTheme: customThemesCollection });
  }),
);

type ActionType = {
  addCustomTheme: {
    name: string;
    colors: CustomTheme["colors"];
  };
  editCustomTheme: {
    themeId: string;
    name: string;
    colors: CustomTheme["colors"];
  };
  deleteCustomTheme: {
    themeId: string;
  };
};

const actions = {
  addCustomTheme: createOptimisticAction<ActionType["addCustomTheme"]>({
    onMutate: ({ name, colors }) => {
      customThemesCollection.insert({
        _id: tempId(),
        name,
        colors,
      });
    },
    mutationFn: async ({ name, colors }) => {
      const response = await Ape.users.addCustomTheme({
        body: { name, colors },
      });
      if (response.status !== 200) {
        throw new Error(`Failed to add custom theme: ${response.body.message}`);
      }

      if (response.body.data === null) {
        throw new Error("Failed to add custom theme: No data returned");
      }

      await customThemesCollection.utils.writeInsert({
        _id: response.body.data._id,
        name,
        colors,
      });
    },
  }),
  editCustomTheme: createOptimisticAction<ActionType["editCustomTheme"]>({
    onMutate: ({ themeId, name, colors }) => {
      customThemesCollection.update(themeId, (theme) => {
        theme.name = name;
        theme.colors = colors;
      });
    },
    mutationFn: async ({ themeId, name, colors }) => {
      const response = await Ape.users.editCustomTheme({
        body: { themeId, theme: { name, colors } },
      });
      if (response.status !== 200) {
        throw new Error(
          `Failed to edit custom theme: ${response.body.message}`,
        );
      }

      await customThemesCollection.utils.writeUpdate({
        _id: themeId,
        name,
        colors,
      });
    },
  }),
  deleteCustomTheme: createOptimisticAction<ActionType["deleteCustomTheme"]>({
    onMutate: ({ themeId }) => {
      customThemesCollection.delete(themeId);
    },
    mutationFn: async ({ themeId }) => {
      const response = await Ape.users.deleteCustomTheme({
        body: { themeId },
      });
      if (response.status !== 200) {
        throw new Error(
          `Failed to delete custom theme: ${response.body.message}`,
        );
      }
      await customThemesCollection.utils.writeDelete(themeId);
    },
  }),
};

// --- Public API ---

/**
 * The loaded custom themes, sorted by name. Reactive in components and
 * effects, a plain read elsewhere. Returns only what's loaded, never fetches.
 */
export function getCustomThemes(): CustomThemeItem[] {
  return [...customThemesQuery.state.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

/** A loaded custom theme by id. Reactive like `getCustomThemes`. */
export function getCustomTheme(id: string): CustomThemeItem | undefined {
  return customThemesQuery.state.get(id);
}

/**
 * Whether the custom themes have loaded (false while loading, failed or signed
 * out). Unlike tags and presets, sign in doesn't wait for them.
 */
export function areCustomThemesLoaded(): boolean {
  return customThemesQuery.status === "ready";
}

export async function addCustomTheme(
  params: ActionType["addCustomTheme"],
): Promise<void> {
  const transaction = actions.addCustomTheme(params);
  await transaction.when("settled");
}

export async function editCustomTheme(
  params: ActionType["editCustomTheme"],
): Promise<void> {
  const transaction = actions.editCustomTheme(params);
  await transaction.when("settled");
}

export async function deleteCustomTheme(
  params: ActionType["deleteCustomTheme"],
): Promise<void> {
  const transaction = actions.deleteCustomTheme(params);
  await transaction.when("settled");
}
