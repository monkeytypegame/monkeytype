/**
 * A query collection a page waits for behind the loading bar (results,
 * friends). A failed query still marks the collection ready (with
 * `utils.isError`), so readiness alone doesn't tell a download succeeded.
 */
type BlockingDownload = {
  isReady: () => boolean;
  stateWhenReady: () => Promise<unknown>;
  utils: {
    isError: boolean;
    lastError: unknown;
    refetch: (options?: { throwOnError?: boolean }) => Promise<unknown>;
  };
};

/**
 * Query options of a blocking download: one quick retry, so a failing server
 * shows the error page (with Retry) soon instead of holding the loading bar
 * through the default 3 retries with backoff.
 */
export const blockingDownloadOptions = { retry: 1 } as const;

/** Whether the collection downloaded (its last fetch didn't fail). */
export function isDownloaded(collection: BlockingDownload): boolean {
  return collection.isReady() && !collection.utils.isError;
}

/**
 * Waits for the collection's download, throws if it failed. A collection whose
 * last download failed downloads again.
 */
export async function waitForDownload(
  collection: BlockingDownload,
): Promise<void> {
  if (collection.utils.isError) {
    await collection.utils.refetch({ throwOnError: true });
    return;
  }
  await collection.stateWhenReady();
  if (collection.utils.isError) {
    const error = collection.utils.lastError;
    throw error instanceof Error ? error : new Error(String(error));
  }
}
