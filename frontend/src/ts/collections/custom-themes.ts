import { CustomTheme } from "@monkeytype/schemas/users";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import {
  createCollection,
  createOptimisticAction,
  useLiveQuery,
} from "@tanstack/solid-db";
import { createRoot } from "solid-js";
import Ape from "../ape";
import { queryClient } from "../queries";
import { baseKey } from "../queries/utils/keys";
import { tempId, keepForever } from "./utils/misc";
import {
  createSessionDownload,
  type SessionDownloadStatus,
} from "./utils/session-download";
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

// a fresh download per sign in: the rows outlive a sign out, so until it
// lands they may be the previous session's
const download = createSessionDownload(queryKeys.root(), async () =>
  customThemesCollection.utils.refetch(),
);

// The module-level mirror the getters read: a live query owned by a root that
// lives as long as the page. Read `.state` and `.status` only: calling
// `customThemesQuery()` suspends
const customThemesQuery = createRoot(() =>
  useLiveQuery((q) => {
    if (download.status() !== "loaded") return undefined;
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
 * Whether the custom themes have loaded in this session: `loading` (also while signed
 * out), `loaded` once the getters return them, or `failed`.
 * Unlike tags and presets, sign in doesn't wait for them. Reactive.
 */
export function getCustomThemesStatus(): SessionDownloadStatus {
  const status = download.status();
  // the getters' live query catches up a tick after the download
  if (status === "loaded" && customThemesQuery.status !== "ready") {
    return "loading";
  }
  return status;
}

/** Downloads the custom themes again, eg. after a failure. */
export function reloadCustomThemes(): void {
  download.reload();
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
