import { TestActivity } from "@monkeytype/schemas/users";
import { createSignal, JSXElement, onMount, Show } from "solid-js";

import { get as getSeverConfiguration } from "../../../ape/server-configuration";
import { getSnapshot, getTestActivityCalendar } from "../../../db";
import {
  clear as clearTestActivity,
  init as initTestActivity,
  update,
} from "../../../elements/test-activity";
import { TestActivityCalendar } from "../../../elements/test-activity-calendar";
import { useRefWithUtils } from "../../../hooks/useRefWithUtils";
import { getFirstDayOfTheWeek } from "../../../utils/date-and-time";
import SlimSelect, { SlimSelectProps } from "../../ui/SlimSelect";

const firstDayOfTheWeek = getFirstDayOfTheWeek();

export function ActivityCalendar(props: {
  isAccountPage?: true;
  testActivity?: TestActivity;
}): JSXElement {
  // Refs are assigned by SolidJS via the ref attribute
  const [elementRef, element] = useRefWithUtils<HTMLElement>();

  let calendar: TestActivityCalendar | undefined;

  const sync = () => {
    if (props.testActivity === undefined || element() === undefined) {
      calendar = undefined;
      clearTestActivity(element()?.native);
      return;
    }

    if (props.isAccountPage) {
      //signals cannot store classes, use the testActivity from the snapshot for now
      calendar = getSnapshot()?.testActivity;
    } else {
      calendar = new TestActivityCalendar(
        props.testActivity.testsByDays,
        new Date(props.testActivity.lastDay),
        firstDayOfTheWeek,
      );
    }

    initTestActivity(
      // oxlint-disable-next-line typescript/no-non-null-assertion
      element()!.native,
      calendar,
    );

    if (!props.isAccountPage) {
      // oxlint-disable-next-line typescript/no-non-null-assertion
      const title = element()!.qsr(".top .title");
      title.appendHtml("   months");
    }
  };

  onMount(() => sync());

  const yearOptions = () => {
    const startYear =
      getSnapshot()?.addedAt !== undefined
        ? new Date(getSnapshot()?.addedAt ?? 0).getFullYear()
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
          getSnapshot()?.isPremium)
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
