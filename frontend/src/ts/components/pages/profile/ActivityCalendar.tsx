import { TestActivity } from "@monkeytype/schemas/users";
import { createEffect, createSignal, JSXElement, Show } from "solid-js";

import { get as getSeverConfiguration } from "../../../ape/server-configuration";
import {
  clearActivityCalendar,
  initActivityCalendar,
  updateActivityCalendar,
} from "../../../elements/test-activity";
import { useRefWithUtils } from "../../../hooks/useRefWithUtils";
import { getUserData } from "../../../queries/user";
import {
  getCurrentYear,
  getLast12MonthsCalendar,
  getTestActivity,
  getYearCalendar,
  loadAllYearsTestActivity,
  TestActivityCalendar,
  toTestActivityDays,
} from "../../../states/test-activity";
import { getFirstDayOfTheWeek } from "../../../utils/date-and-time";
import { DeepReadonly } from "../../../utils/types";
import SlimSelect, { SlimSelectProps } from "../../common/SlimSelect";

const firstDayOfTheWeek = getFirstDayOfTheWeek();

async function getTestActivityCalendar(
  yearString: string,
): Promise<TestActivityCalendar | undefined> {
  const days = getTestActivity();
  if (days === undefined) return undefined;
  if (yearString === "current") {
    return getLast12MonthsCalendar(days, firstDayOfTheWeek);
  }

  const year = parseInt(yearString);
  if (year === getCurrentYear()) {
    return getYearCalendar(days, year, firstDayOfTheWeek);
  }
  if (!(await loadAllYearsTestActivity())) return undefined;
  // past years were merged into the activity
  return getYearCalendar(getTestActivity() ?? [], year, firstDayOfTheWeek);
}

export function ActivityCalendar(props: {
  isAccountPage?: true;
  testActivity?: DeepReadonly<TestActivity>;
}): JSXElement {
  // Refs are assigned by SolidJS via the ref attribute
  const [elementRef, element] = useRefWithUtils<HTMLElement>();

  // Stepping stone: replaced by a Solid activity calendar component in U2
  createEffect(() =>
    (() => {
      const days = props.isAccountPage
        ? getTestActivity()
        : props.testActivity !== undefined
          ? toTestActivityDays(props.testActivity)
          : undefined;
      if (days === undefined || element() === undefined) {
        clearActivityCalendar(element()?.native);
        return;
      }

      initActivityCalendar(
        // oxlint-disable-next-line typescript/no-non-null-assertion
        element()!.native,
        getLast12MonthsCalendar(days, firstDayOfTheWeek),
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
    const currentYear = getCurrentYear();
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
                    updateActivityCalendar(element()!.native, activity);
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
