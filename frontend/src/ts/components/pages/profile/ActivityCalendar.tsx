import { TestActivity } from "@monkeytype/schemas/users";
import * as Dates from "date-fns";
import {
  createEffect,
  createMemo,
  createSignal,
  JSXElement,
  Show,
} from "solid-js";

import Ape from "../../../ape";
import { get as getSeverConfiguration } from "../../../ape/server-configuration";
import {
  clear as clearTestActivity,
  init as initTestActivity,
  update,
} from "../../../elements/test-activity";
import {
  ModifiableTestActivityCalendar,
  TestActivityCalendar,
} from "../../../elements/test-activity-calendar";
import { useRefWithUtils } from "../../../hooks/useRefWithUtils";
import { getUserData } from "../../../queries/user";
import { isAuthenticated } from "../../../states/core";
import { hideLoaderBar, showLoaderBar } from "../../../states/loader-bar";
import { showErrorNotification } from "../../../states/notifications";
import { getFirstDayOfTheWeek } from "../../../utils/date-and-time";
import { DeepReadonly } from "../../../utils/types";
import SlimSelect, { SlimSelectProps } from "../../ui/SlimSelect";

const firstDayOfTheWeek = getFirstDayOfTheWeek();

// per-year calendars for past years, downloaded once
let testActivityByYear: Record<string, TestActivityCalendar> | undefined;

async function getTestActivityCalendar(
  yearString: string,
): Promise<TestActivityCalendar | undefined> {
  const userData = getUserData();
  if (!isAuthenticated() || userData === undefined) return undefined;

  const currentYear = new Date().getFullYear().toString();
  if (yearString === "current" || yearString === currentYear) {
    if (userData.testActivity === undefined) return undefined;
    const calendar = new ModifiableTestActivityCalendar(
      [...userData.testActivity.testsByDays],
      new Date(userData.testActivity.lastDay),
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

export function ActivityCalendar(props: {
  isAccountPage?: true;
  testActivity?: DeepReadonly<TestActivity>;
}): JSXElement {
  // Refs are assigned by SolidJS via the ref attribute
  const [elementRef, element] = useRefWithUtils<HTMLElement>();

  let calendar: TestActivityCalendar | undefined;

  // a memo: the effect re-runs when the activity changes, not on any user write
  const accountActivity = createMemo(() => getUserData()?.testActivity);

  createEffect(() =>
    (() => {
      const testActivity = props.isAccountPage
        ? accountActivity()
        : props.testActivity;
      if (testActivity === undefined || element() === undefined) {
        calendar = undefined;
        clearTestActivity(element()?.native);
        return;
      }

      calendar = new TestActivityCalendar(
        [...testActivity.testsByDays],
        new Date(testActivity.lastDay),
        firstDayOfTheWeek,
      );

      initTestActivity(
        // oxlint-disable-next-line typescript/no-non-null-assertion
        element()!.native,
        calendar,
      );

      if (!props.isAccountPage) {
        // oxlint-disable-next-line typescript/no-non-null-assertion
        const title = element()!.qsr(".top .title");
        title.appendHtml(" last 12 months");
      }
    })(),
  );

  const yearOptions = () => {
    const startYear =
      getUserData()?.addedAt !== undefined
        ? new Date(getUserData()?.addedAt ?? 0).getFullYear()
        : 2020;
    const currentYear = new Date().getFullYear();
    const years: SlimSelectProps["options"] = [
      {
        text: "last 12 months",
        value: "current",
      },
    ];
    for (let year = currentYear; year >= startYear; year--) {
      if (
        years.length < 2 ||
        (getSeverConfiguration()?.users.premium.enabled &&
          getUserData()?.isPremium)
      ) {
        years.push({
          text: year.toString(),
          value: year.toString(),
        });
      }
    }
    return years;
  };

  const [selectedYear, setSelectedYear] = createSignal("current");

  return (
    <div class="testActivity" ref={elementRef}>
      <div class="wrapper">
        <div class="top">
          <Show when={props.isAccountPage}>
            <div class="year">
              <SlimSelect
                options={yearOptions()}
                selected={selectedYear()}
                settings={{ showSearch: false }}
                onChange={setSelectedYear}
                events={{
                  afterChange: async (newVal) => {
                    const activity = await getTestActivityCalendar(
                      newVal[0]?.value as string,
                    );
                    // oxlint-disable-next-line typescript/no-non-null-assertion
                    update(element()!.native, activity);
                  },
                }}
              />
            </div>
          </Show>
          <div class="title"></div>
          <div class="legend">
            <span>less</span>
            <div data-level="0"></div>
            <div data-level="1"></div>
            <div data-level="2"></div>
            <div data-level="3"></div>
            <div data-level="4"></div>
            <span>more</span>
          </div>
        </div>
        <div class="activity"></div>
        <div class="months"></div>
        <div class="daysFull"></div>
        <div class="days"></div>
        <div class="nodata hidden">No data found.</div>
        <div class="note">Note: All activity data is using UTC time.</div>
      </div>
    </div>
  );
}
