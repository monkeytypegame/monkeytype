import { TestActivity } from "@monkeytype/schemas/users";
import { JSXElement, onMount, Show } from "solid-js";

import { getSnapshot } from "../../../db";
import {
  clear as clearTestActivity,
  init as initTestActivity,
  initYearSelector,
} from "../../../elements/test-activity";
import { TestActivityCalendar } from "../../../elements/test-activity-calendar";
import { useRefWithUtils } from "../../../hooks/useRefWithUtils";
import { getFirstDayOfTheWeek } from "../../../utils/date-and-time";

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
      getSnapshot()?.addedAt !== undefined
        ? new Date(getSnapshot()?.addedAt ?? 0)
        : undefined,
    );

    if (props.isAccountPage) {
      initYearSelector(
        // oxlint-disable-next-line typescript/no-non-null-assertion
        element()!.native,
        "current",
        getSnapshot()?.addedAt !== undefined
          ? // oxlint-disable-next-line typescript/no-non-null-assertion
            new Date(getSnapshot()!.addedAt).getFullYear()
          : 2020,
      );
    } else {
      // oxlint-disable-next-line typescript/no-non-null-assertion
      const title = element()!.qsr(".top .title");
      title.appendHtml("   months");
    }
  };

  onMount(() => sync());

  return (
    <div class="testActivity" ref={elementRef}>
      <div class="wrapper">
        <div class="top">
          <Show when={props.isAccountPage}>
            <div class="year">
              <select class="yearSelect"></select>
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
