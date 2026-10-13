/** The user data download of the last sign in, as routes wait for it. */
export type UserDataDownload = {
  /** A sign in started `download`; `redownload` starts a new one. */
  start: (download: Promise<void>, redownload: () => Promise<void>) => void;
  /** Signed out: nothing to wait for. */
  clear: () => void;
  /**
   * The download, until it succeeded. After a failure it starts a new one,
   * so a Retry re-runs it. undefined when there's nothing to wait for.
   */
  get: () => Promise<void> | undefined;
};

export function createUserDataDownload(): UserDataDownload {
  let current:
    | { promise: Promise<void> | undefined; redownload: () => Promise<void> }
    | undefined;

  type Entry = NonNullable<typeof current>;

  async function track(entry: Entry, download: Promise<void>): Promise<void> {
    try {
      await download;
      if (current === entry) current = undefined;
    } catch (error) {
      if (current === entry) entry.promise = undefined;
      throw error;
    }
  }

  // a failure is reported to whoever waits for it, if anyone
  function startTracking(entry: Entry, download: Promise<void>): void {
    entry.promise = track(entry, download);
    entry.promise.catch(() => undefined);
  }

  return {
    start: (download, redownload) => {
      current = { promise: undefined, redownload };
      startTracking(current, download);
    },
    clear: () => {
      current = undefined;
    },
    get: (): Promise<void> | undefined => {
      if (current === undefined) return undefined;
      if (current.promise === undefined) {
        startTracking(current, current.redownload());
      }
      return current.promise;
    },
  };
}
