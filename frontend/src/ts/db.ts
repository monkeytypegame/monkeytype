import Ape from "./ape";
import { showErrorNotification } from "./states/notifications";
import { isAuthenticated } from "./states/core";
import * as Dates from "date-fns";
import {
  TestActivityCalendar,
  ModifiableTestActivityCalendar,
} from "./elements/test-activity-calendar";
import { showLoaderBar, hideLoaderBar } from "./states/loader-bar";
import { Difficulty } from "@monkeytype/schemas/configs";
import { Mode, Mode2, PersonalBest } from "@monkeytype/schemas/shared";
import { SnapshotResult } from "./constants/default-snapshot";
import { getFirstDayOfTheWeek } from "./utils/date-and-time";
import { insertLocalResult } from "./collections/results";
import { addXp, getUser, recordResult, setStreak } from "./collections/user";
import { setLastResult } from "./states/last-result";
import { XpBreakdown } from "@monkeytype/schemas/results";
import { FunboxMetadata } from "@monkeytype/funbox";

const firstDayOfTheWeek = getFirstDayOfTheWeek();
let testActivityByYear: Record<string, TestActivityCalendar> | undefined;

/** Read-only shim over the user collection, until readers use `getUser()`. */
export const getSnapshot = getUser;

export function getLocalPB<M extends Mode>(
  mode: M,
  mode2: Mode2<M>,
  punctuation: boolean,
  numbers: boolean,
  language: string,
  difficulty: Difficulty,
  lazyMode: boolean,
  funboxes: FunboxMetadata[],
): PersonalBest | undefined {
  if (!funboxes.every((f) => f.canGetPb)) {
    return undefined;
  }

  const byMode2: Readonly<Record<string, readonly PersonalBest[]>> | undefined =
    getUser()?.personalBests?.[mode];
  const pbs = byMode2?.[mode2];

  return pbs?.find(
    (pb) =>
      (pb.punctuation ?? false) === punctuation &&
      (pb.numbers ?? false) === numbers &&
      pb.difficulty === difficulty &&
      pb.language === language &&
      (pb.lazyMode ?? false) === lazyMode,
  );
}

export type SaveLocalResultData = {
  xp?: number;
  xpBreakdown?: XpBreakdown;
  streak?: number;
  result?: SnapshotResult<Mode>;
  isPb?: boolean;
};

export function saveLocalResult(data: SaveLocalResultData): void {
  if (getUser() === undefined) return;

  if (data.result !== undefined) {
    void insertLocalResult({ result: data.result });
    setLastResult(data.result);
    recordResult(data.result, { isPb: data.isPb ?? false });
  }

  if (data.streak !== undefined) setStreak(data.streak);
  if (data.xp !== undefined) addXp(data.xp, data.xpBreakdown);
}

export async function getTestActivityCalendar(
  yearString: string,
): Promise<TestActivityCalendar | undefined> {
  const user = getUser();
  if (!isAuthenticated() || user === undefined) return undefined;

  const currentYear = new Date().getFullYear().toString();
  if (yearString === "current" || yearString === currentYear) {
    if (user.testActivity === undefined) return undefined;
    const calendar = new ModifiableTestActivityCalendar(
      [...user.testActivity.testsByDays],
      new Date(user.testActivity.lastDay),
      firstDayOfTheWeek,
    );
    return yearString === "current" ? calendar : calendar.getFullYearCalendar();
  }

  if (testActivityByYear === undefined) {
    showLoaderBar();
    const response = await Ape.users.getTestActivity();
    if (response.status !== 200) {
      showErrorNotification("Error getting test activities", { response });
      hideLoaderBar();
      return undefined;
    }

    testActivityByYear = {};
    for (const year in response.body.data) {
      if (year === currentYear) continue;
      const testsByDays = response.body.data[year] ?? [];
      const lastDay = Dates.addDays(
        new Date(parseInt(year), 0, 1),
        testsByDays.length,
      );

      testActivityByYear[year] = new TestActivityCalendar(
        testsByDays,
        lastDay,
        firstDayOfTheWeek,
        true,
      );
    }
    hideLoaderBar();
  }

  return testActivityByYear[yearString];
}
