import { CustomTheme } from "@monkeytype/schemas/users";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import {
  createCollection,
  createOptimisticAction,
  useLiveQuery,
} from "@tanstack/solid-db";
import Ape from "../ape";
import { queryClient } from "../queries";
import { baseKey } from "../queries/utils/keys";
import { applyIdWorkaround, tempId } from "./utils/misc";
import { isAuthenticated } from "../states/core";

export type CustomThemeItem = CustomTheme;

const queryKeys = {
  root: () => [...baseKey("customThemes", { isUserSpecific: true })],
};

// oxlint-disable-next-line typescript/explicit-function-return-type
export function useCustomThemesLiveQuery() {
  return useLiveQuery((q) => {
    return q
      .from({ customTheme: customThemesCollection })
      .orderBy(({ customTheme }) => customTheme.name, "asc");
  });
}

const customThemesCollection = createCollection(
  queryCollectionOptions({
    staleTime: Infinity,
    startSync: true,
    queryKey: queryKeys.root(),

    queryClient,
    getKey: (it) => it._id,
    queryFn: async () => {
      if (!isAuthenticated()) return [] as CustomThemeItem[];
      const response = await Ape.users.getCustomThemes();

      if (response.status !== 200) {
        throw new Error(
          `Error fetching custom themes: ${response.body.message}`,
        );
      }

      if (_keepAlive === null) {
        _keepAlive = useCustomThemesLiveQuery();
      }

      return response.body.data.map(applyIdWorkaround);
    },
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

      customThemesCollection.utils.writeInsert({
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

      customThemesCollection.utils.writeUpdate({
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
      customThemesCollection.utils.writeDelete(themeId);
    },
  }),
};

// --- Public API ---

function getCustomThemes(): CustomThemeItem[] {
  return [...customThemesCollection.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

function getCustomTheme(id: string): CustomThemeItem | undefined {
  return customThemesCollection.get(id);
}

export async function addCustomTheme(
  params: ActionType["addCustomTheme"],
): Promise<void> {
  const transaction = actions.addCustomTheme(params);
  await transaction.isPersisted.promise;
}

export async function editCustomTheme(
  params: ActionType["editCustomTheme"],
): Promise<void> {
  const transaction = actions.editCustomTheme(params);
  await transaction.isPersisted.promise;
}

export async function deleteCustomTheme(
  params: ActionType["deleteCustomTheme"],
): Promise<void> {
  const transaction = actions.deleteCustomTheme(params);
  await transaction.isPersisted.promise;
}

/**
 * Used for non reactive access. Do not use in Solid components.
 */
export const __nonReactive = {
  getCustomThemes,
  getCustomTheme,
};

/**
 * The collection gets cleaned up after a while.
 * Keeping a query active fixes that. Remove when removing __nonReactive
 */
// oxlint-disable-next-line typescript/no-explicit-any
let _keepAlive: any = null;
