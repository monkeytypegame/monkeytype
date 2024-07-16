import {
  TestActivityCalendar,
  ModifiableTestActivityCalendar,
} from "../../src/ts/elements/test-activity-calendar";
import * as Dates from "date-fns";
import { MatcherResult } from "../vitest";
import { UTCDateMini } from "@date-fns/utc/date/mini";

describe("test-activity-calendar.ts", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  describe("TestActivityCalendar", () => {
    describe("getMonths", () => {
      it("for lastDay in april", () => {
        //set today
        vi.setSystemTime(getDate("2024-04-10"));
        const calendar = new TestActivityCalendar([], getDate("2024-04-10"));

        expect(calendar.getMonths()).toEqual([
          {
            text: "apr",
            weeks: 4,
          },
          {
            text: "may",
            weeks: 4,
          },
          {
            text: "jun",
            weeks: 4,
          },
          {
            text: "jul",
            weeks: 5,
          },
          {
            text: "aug",
            weeks: 4,
          },
          {
            text: "sep",
            weeks: 4,
          },
          {
            text: "oct",
            weeks: 5,
          },
          {
            text: "nov",
            weeks: 4,
          },
          {
            text: "dec",
            weeks: 5,
          },
          {
            text: "jan",
            weeks: 4,
          },
          {
            text: "feb",
            weeks: 4,
          },
          {
            text: "mar",
            weeks: 5,
          },
        ]);
      });

      it("for lastDay in april, not test for the current week", () => {
        //set today
        vi.setSystemTime(getDate("2024-04-24"));
        const calendar = new TestActivityCalendar([], getDate("2024-04-10"));

        expect(calendar.getMonths()).toEqual([
          {
            text: "",
            weeks: 2,
          },
          {
            text: "may",
            weeks: 4,
          },
          {
            text: "jun",
            weeks: 4,
          },
          {
            text: "jul",
            weeks: 5,
          },
          {
            text: "aug",
            weeks: 4,
          },
          {
            text: "sep",
            weeks: 4,
          },
          {
            text: "oct",
            weeks: 5,
          },
          {
            text: "nov",
            weeks: 4,
          },
          {
            text: "dec",
            weeks: 5,
          },
          {
            text: "jan",
            weeks: 4,
          },
          {
            text: "feb",
            weeks: 4,
          },
          {
            text: "mar",
            weeks: 5,
          },
          {
            text: "apr",
            weeks: 3,
          },
        ]);
      });
      it("for lastDay in january", () => {
        //set today
        vi.setSystemTime(getDate("2023-01-01"));
        const calendar = new TestActivityCalendar([], getDate("2023-01-01"));

        expect(calendar.getMonths()).toEqual([
          {
            text: "jan",
            weeks: 5,
          },
          {
            text: "feb",
            weeks: 4,
          },
          {
            text: "mar",
            weeks: 4,
          },
          {
            text: "apr",
            weeks: 4,
          },
          {
            text: "may",
            weeks: 5,
          },
          {
            text: "jun",
            weeks: 4,
          },
          {
            text: "jul",
            weeks: 5,
          },
          {
            text: "aug",
            weeks: 4,
          },
          {
            text: "sep",
            weeks: 4,
          },
          {
            text: "oct",
            weeks: 5,
          },
          {
            text: "nov",
            weeks: 4,
          },
          {
            text: "dec",
            weeks: 4,
          },
        ]);
      });
      it("for lastDay and full year starting with sunday", () => {
        const calendar = new TestActivityCalendar(
          [],
          getDate("2023-05-10"),
          true
        );

        expect(calendar.getMonths()).toEqual([
          {
            text: "jan",
            weeks: 5,
          },
          {
            text: "feb",
            weeks: 4,
          },
          {
            text: "mar",
            weeks: 4,
          },
          {
            text: "apr",
            weeks: 5,
          },
          {
            text: "may",
            weeks: 4,
          },
          {
            text: "jun",
            weeks: 4,
          },
          {
            text: "jul",
            weeks: 5,
          },
          {
            text: "aug",
            weeks: 4,
          },
          {
            text: "sep",
            weeks: 4,
          },
          {
            text: "oct",
            weeks: 5,
          },
          {
            text: "nov",
            weeks: 4,
          },
          {
            text: "dec",
            weeks: 5,
          },
        ]);
      });
      it("for lastDay and full year starting with monday", () => {
        const calendar = new TestActivityCalendar(
          [],
          getDate("2024-05-10"),
          true
        );

        expect(calendar.getMonths()).toEqual([
          {
            text: "jan",
            weeks: 5,
          },
          {
            text: "feb",
            weeks: 4,
          },
          {
            text: "mar",
            weeks: 5,
          },
          {
            text: "apr",
            weeks: 4,
          },
          {
            text: "may",
            weeks: 4,
          },
          {
            text: "jun",
            weeks: 5,
          },
          {
            text: "jul",
            weeks: 4,
          },
          {
            text: "aug",
            weeks: 4,
          },
          {
            text: "sep",
            weeks: 5,
          },
          {
            text: "oct",
            weeks: 4,
          },
          {
            text: "nov",
            weeks: 4,
          },
          {
            text: "dec",
            weeks: 5,
          },
        ]);
      });
      it("for first day in june", () => {
        //set today
        vi.setSystemTime(getDate("2024-06-01"));
        const calendar = new TestActivityCalendar([], getDate("2024-06-01"));

        expect(calendar.getMonths()).toEqual([
          {
            text: "jun",
            weeks: 4,
          },
          {
            text: "jul",
            weeks: 5,
          },
          {
            text: "aug",
            weeks: 4,
          },
          {
            text: "sep",
            weeks: 4,
          },
          {
            text: "oct",
            weeks: 5,
          },
          {
            text: "nov",
            weeks: 4,
          },
          {
            text: "dec",
            weeks: 5,
          },
          {
            text: "jan",
            weeks: 4,
          },
          {
            text: "feb",
            weeks: 4,
          },
          {
            text: "mar",
            weeks: 5,
          },
          {
            text: "apr",
            weeks: 4,
          },
          {
            text: "may",
            weeks: 4,
          },
        ]);
      });
      it("no double month for for 16th june", () => {
        //set today
        vi.setSystemTime(getDate("2024-06-16"));
        const calendar = new TestActivityCalendar([], getDate("2024-06-01"));

        expect(calendar.getMonths()).toEqual([
          {
            text: "",
            weeks: 2,
          },
          {
            text: "jul",
            weeks: 5,
          },
          {
            text: "aug",
            weeks: 4,
          },
          {
            text: "sep",
            weeks: 4,
          },
          {
            text: "oct",
            weeks: 5,
          },
          {
            text: "nov",
            weeks: 4,
          },
          {
            text: "dec",
            weeks: 5,
          },
          {
            text: "jan",
            weeks: 4,
          },
          {
            text: "feb",
            weeks: 4,
          },
          {
            text: "mar",
            weeks: 5,
          },
          {
            text: "apr",
            weeks: 4,
          },
          {
            text: "may",
            weeks: 4,
          },
          {
            text: "jun",
            weeks: 3,
          },
        ]);
      });
    });

    describe("getDays", () => {
      it("for lastDay in april", () => {
        const data = getData("2023-04-10", "2024-04-10");
        vi.setSystemTime(getDate("2024-04-30"));
        const calendar = new TestActivityCalendar(data, getDate("2024-04-10"));
        const days = calendar.getDays();

        expect(days).toHaveLength(1 + 366 + 4); //one filler on the start, 366 days in leap year, four fillers at the end

        //may 23 starts with a monday, we use sunday from last month
        expect(days[0]).toBeDate("2023-04-30").toHaveTests(120);

        expect(days[1]).toBeDate("2023-05-01").toHaveTests(121).toHaveLevel(2);

        expect(days[245])
          .toBeDate("2023-12-31")
          .toHaveTests(365)
          .toHaveLevel(4);

        expect(days[246]).toBeDate("2024-01-01").toHaveTests(1).toHaveLevel(1);

        expect(days[305]).toBeDate("2024-02-29").toHaveTests(60).toHaveLevel(1);

        expect(days[346])
          .toBeDate("2024-04-10")
          .toHaveTests(101)
          .toHaveLevel(2);

        //days from April 11th to April 30th
        for (let day = 347; day <= 366; day++) {
          expect(days[day]).toHaveLevel(0);
        }
      });

      it("for full leap year", () => {
        //GIVEN
        const data = getData("2024-01-01", "2024-12-31");
        vi.setSystemTime(getDate("2024-12-31"));
        const calendar = new TestActivityCalendar(data, getDate("2024-12-31"));

        //WHEN
        const days = calendar.getDays();

        //THEN
        expect(days).toHaveLength(1 + 366 + 4); //one filler on the start, 366 days in leap year, four fillers at the end

        //2024 starts with a monday
        expect(days[0]).toBeDate("2023-12-31");

        expect(days[1]).toBeDate("2024-01-01").toHaveTests(1).toHaveLevel(1);
        expect(days[60]).toBeDate("2024-02-29").toHaveTests(60).toHaveLevel(1);
        expect(days[366])
          .toBeDate("2024-12-31")
          .toHaveTests(366)
          .toHaveLevel(4);

        //2024 ends with a thuesday
        for (let day = 367; day < 1 + 366 + 4; day++) {
          expect(days[day]).toBeFiller();
        }
      });

      it("for full year", () => {
        //GIVEN
        const data = getData("2022-11-30", "2023-12-31");
        vi.setSystemTime(getDate("2023-12-31"));
        const calendar = new TestActivityCalendar(
          data,
          new Date("2023-12-31T23:59:59Z")
        ); //2023-12-31T23:59:59Z

        //WHEN
        const days = calendar.getDays();

        //THEN
        expect(days).toHaveLength(0 + 365 + 6); //no filler on the start, 365 days in leap year, six fillers at the end

        //2023 starts with a sunday
        expect(days[0]).toBeDate("2023-01-01").toHaveTests(1).toHaveLevel(1);

        expect(days[1]).toBeDate("2023-01-02").toHaveTests(2).toHaveLevel(1);
        expect(days[364])
          .toBeDate("2023-12-31")
          .toHaveTests(365)
          .toHaveLevel(4);

        //2023 ends with a sunday
        for (let day = 365; day < 365 + 6; day++) {
          expect(days[day]).toBeFiller();
        }

        //december 24 ends with a tuesday
        expect(days[367]).toBeFiller();
        expect(days[368]).toBeFiller();
        expect(days[369]).toBeFiller();
        expect(days[370]).toBeFiller();
      });

      it("ignores data before calendar range", () => {
        //GIVEN
        const data = getData("2023-03-28", "2024-04-10"); //extra data in front of the calendar
        vi.setSystemTime(getDate("2024-04-30"));
        const calendar = new TestActivityCalendar(data, getDate("2024-04-10"));

        //WHEN
        const days = calendar.getDays();

        //THEN
        expect(days).toHaveLength(1 + 366 + 4); //one filler on the start, 366 days in leap year, four fillers at the end

        //may 23 starts with a monday, so we skip one day
        expect(days[0]).toBeDate("2023-04-30").toHaveTests(120);

        expect(days[1]).toBeDate("2023-05-01").toHaveTests(121).toHaveLevel(2);
        expect(days[346])
          .toBeDate("2024-04-10")
          .toHaveTests(101)
          .toHaveLevel(2);
      });

      it("handles missing data in calendar range", () => {
        //GIVEN
        const data = getData("2024-04-01", "2024-04-10");
        vi.setSystemTime(getDate("2024-04-30"));
        const calendar = new TestActivityCalendar(data, getDate("2024-04-10"));

        //WHEN
        const days = calendar.getDays();

        //THEN
        expect(days).toHaveLength(1 + 366 + 4); //one filler on the start, 366 days in leap year, four fillers at the end

        expect(days[0]).toBeDate("2023-04-30");
        for (let day = 1; day <= 336; day++) {
          expect(days[day]).toHaveLevel(0);
        }

        expect(days[337]).toBeDate("2024-04-01").toHaveTests(92).toHaveLevel(2);
        expect(days[346])
          .toBeDate("2024-04-10")
          .toHaveTests(101)
          .toHaveLevel(3);

        for (let day = 347; day <= 366; day++) {
          expect(days[day]).toHaveLevel(0);
        }
      });

      it("for lastDay in february", () => {
        //GIVEN
        const data = getData("2022-02-10", "2023-02-10");
        vi.setSystemTime(getDate("2023-02-28"));
        const calendar = new TestActivityCalendar(data, getDate("2023-02-10"));

        //WHEN
        const days = calendar.getDays();

        //THEN
        expect(days).toHaveLength(2 + 365 + 4); //two filler on the start, 365 days in the  year, four fillers at the end

        //march 22 starts with a tuesday, two days from february
        expect(days[0]).toBeDate("2022-02-27").toHaveTests(58);
        expect(days[1]).toBeDate("2022-02-28").toHaveTests(59);

        expect(days[2]).toBeDate("2022-03-01").toHaveTests(60).toHaveLevel(1);
        expect(days[307])
          .toBeDate("2022-12-31")
          .toHaveTests(365)
          .toHaveLevel(4);
        expect(days[308]).toBeDate("2023-01-01").toHaveTests(1).toHaveLevel(1);
        expect(days[348]).toBeDate("2023-02-10").toHaveTests(41).toHaveLevel(1);

        //days from 11th till 28 Februar
        for (let day = 349; day <= 365; day++) {
          expect(days[day]).toHaveLevel(0);
        }
        //februar 23 ends with tuesday, add four fillers
        for (let day = 367; day <= 370; day++) {
          expect(days[day]).toBeFiller();
        }
      });

      it("current day mid of month", () => {
        //GIVEN
        const data = getData("2022-02-10", "2023-02-10");
        vi.setSystemTime(getDate("2023-02-12"));
        const calendar = new TestActivityCalendar(data, getDate("2023-02-10"));

        //WHEN
        const days = calendar.getDays();

        //THEN
        expect(days).toHaveLength(2 + 365 + 4); //two filler on the start, 365 days in the  year, four fillers at the end

        expect(days[0]).toBeDate("2022-02-13").toHaveTests(44);
        expect(days[1]).toBeDate("2022-02-14").toHaveTests(45);

        expect(days[16]).toBeDate("2022-03-01").toHaveTests(60).toHaveLevel(1);
        expect(days[321])
          .toBeDate("2022-12-31")
          .toHaveTests(365)
          .toHaveLevel(4);
        expect(days[322]).toBeDate("2023-01-01").toHaveTests(1).toHaveLevel(1);
        expect(days[364]).toBeDate("2023-02-12").toHaveLevel("0");

        //fillers
        for (let day = 365; day <= 370; day++) {
          expect(days[day]).toBeFiller();
        }
      });

      it("for lastDay in february full year", () => {
        //GIVEN
        const data = getData("2023-02-10", "2024-02-10");
        const calendar = new TestActivityCalendar(
          data,
          getDate("2024-02-10"),
          true
        );

        //WHEN
        const days = calendar.getDays();

        //THEN
        //january 24 starts with a monday, skip one day
        expect(days[0]).toBeFiller();

        expect(days[1]).toBeDate("2024-01-01").toHaveTests(1).toHaveLevel(1);
        expect(days[41]).toBeDate("2024-02-10").toHaveTests(41).toHaveLevel(4);

        //days from 11th february to 31th december
        for (let day = 42; day <= 366; day++) {
          expect(days[day]).toHaveLevel(0);
        }
        //december 24 ends with a tuesday
        expect(days[367]).toBeFiller();
        expect(days[368]).toBeFiller();
        expect(days[369]).toBeFiller();
        expect(days[370]).toBeFiller();
      });
    });
  });
  describe("ModifiableTestActivityCalendar", () => {
    describe("increment", () => {
      it("increments on lastDay", () => {
        //GIVEN
        const lastDate = getDate("2024-04-10");
        vi.setSystemTime(getDate("2024-04-30"));
        const calendar = new ModifiableTestActivityCalendar(
          [1, 2, 3],
          lastDate
        );

        //WHEN
        calendar.increment(lastDate);

        //THEN
        const days = calendar.getDays();

        expect(days[343]).toHaveLevel(0);
        expect(days[344]).toBeDate("2024-04-08").toHaveTests(1);
        expect(days[345]).toBeDate("2024-04-09").toHaveTests(2);
        expect(days[346]).toBeDate("2024-04-10").toHaveTests(4);
        expect(days[347]).toHaveLevel(0);
      });
      it("increments after lastDay", () => {
        //GIVEN
        const lastDate = getDate("2024-04-10");
        vi.setSystemTime(getDate("2024-04-10"));
        const calendar = new ModifiableTestActivityCalendar(
          [1, 2, 3],
          lastDate
        );

        //WHEN
        vi.setSystemTime(getDate("2024-04-12"));
        calendar.increment(getDate("2024-04-12"));

        //THEN
        let days = calendar.getDays();
        expect(days[364]).toHaveLevel(0);
        expect(days[365]).toBeDate("2024-04-08").toHaveTests(1);
        expect(days[366]).toBeDate("2024-04-09").toHaveTests(2);
        expect(days[367]).toBeDate("2024-04-10").toHaveTests(3);
        expect(days[368]).toHaveLevel(0);
        expect(days[369]).toBeDate("2024-04-12").toHaveTests(1);
        expect(days[370]).toBeFiller();

        //WHEN
        calendar.increment(getDate("2024-04-12"));

        //THEN
        days = calendar.getDays();

        expect(days[364]).toHaveLevel(0);
        expect(days[365]).toBeDate("2024-04-08").toHaveTests(1);
        expect(days[366]).toBeDate("2024-04-09").toHaveTests(2);
        expect(days[367]).toBeDate("2024-04-10").toHaveTests(3);
        expect(days[368]).toHaveLevel(0);
        expect(days[369]).toBeDate("2024-04-12").toHaveTests(2);
        expect(days[370]).toBeFiller();
      });

      it("increments after two months", () => {
        //GIVEN
        vi.setSystemTime(getDate("2024-04-10"));
        const calendar = new ModifiableTestActivityCalendar(
          [1, 2, 3],
          getDate("2024-04-10")
        );

        //WHEN
        vi.setSystemTime(getDate("2024-06-12"));
        calendar.increment(getDate("2024-06-12"));

        //THEN
        const days = calendar.getDays();
        expect(days[301]).toHaveLevel(0);
        expect(days[302]).toBeDate("2024-04-08").toHaveTests(1);
        expect(days[303]).toBeDate("2024-04-09").toHaveTests(2);
        expect(days[304]).toBeDate("2024-04-10").toHaveTests(3);
        expect(days[305]).toHaveLevel(0);

        expect(days[366]).toHaveLevel(0);
        expect(days[367]).toBeDate("2024-06-12").toHaveTests(1);
        expect(days[368]).toBeFiller;
      });
      it("increments in new year", () => {
        //GIVEN
        vi.setSystemTime(getDate("2024-12-24"));
        const calendar = new ModifiableTestActivityCalendar(
          getData("2023-12-20", "2024-12-24"),
          getDate("2024-12-24")
        );

        //WHEN
        vi.setSystemTime(getDate("2025-01-02"));
        calendar.increment(getDate("2025-01-02"));

        //THEN
        const days = calendar.getDays();
        expect(days[359]).toBeDate("2024-12-24").toHaveTests(359);
        for (let day = 360; day <= 367; day++) {
          expect(days[day]).toHaveLevel(0);
        }
        expect(days[368]).toBeDate("2025-01-02").toHaveTests(1);
        expect(days[369]).toBeFiller();
      });
      it("fails increment in the past", () => {
        //GIVEN
        const calendar = new ModifiableTestActivityCalendar(
          [1, 2, 3],
          getDate("2024-04-10")
        );

        //WHEN
        expect(() => calendar.increment(getDate("2024-04-09"))).toThrowError(
          new Error("cannot alter data in the past.")
        );
      });
    });
  });
  describe("getFullYearCalendar", () => {
    it("gets calendar", () => {
      //GIVEN
      const lastDate = getDate("2024-01-02");
      const calendar = new ModifiableTestActivityCalendar(
        [1, 2, 3, 4],
        lastDate
      );

      //WHEN
      const fullYear = calendar.getFullYearCalendar();

      //THEN
      const days = fullYear.getDays();

      //2024 starts with a monday
      expect(days).toHaveLength(1 + 366 + 4);
      expect(days[0]).toBeFiller();
      expect(days[1]).toBeDate("2024-01-01").toHaveTests(3);
      expect(days[2]).toBeDate("2024-01-02").toHaveTests(4);

      for (let day = 3; day <= 366; day++) {
        expect(days[day]).toHaveLevel(0);
      }
      expect(days[367]).toBeFiller();
      expect(days[368]).toBeFiller();
      expect(days[369]).toBeFiller();
      expect(days[370]).toBeFiller();
    });
  });
  describe("getTotalTests", () => {
    it("gets amount of tests", () => {
      //GIVEN
      const lastDate = getDate("2024-01-02");
      const calendar = new ModifiableTestActivityCalendar(
        [1, 2, 3, 4],
        lastDate
      );

      //THEN
      expect(calendar.getTotalTests()).toEqual(1 + 2 + 3 + 4);

      //WHEN
      const fullYear = calendar.getFullYearCalendar();
      expect(fullYear.getTotalTests()).toEqual(3 + 4);
    });
  });
});

function getDate(date: string): Date {
  return new UTCDateMini(Dates.parseISO(date + "T00:00:00Z"));
}

function getData(from: string, to: string): number[] {
  const start = getDate(from);
  const end = getDate(to);

  return Dates.eachDayOfInterval({ start, end }).map((it) =>
    Dates.getDayOfYear(it)
  );
}

expect.extend({
  toBeDate(
    received: MonkeyTypes.TestActivityDay,
    expected: string
  ): MatcherResult {
    const expectedDate = Dates.format(getDate(expected), "EEEE dd MMM yyyy");
    const actual = received.label?.substring(received.label.indexOf("on") + 3);

    return {
      pass: actual === expectedDate,
      message: () => `Date ${actual} is not ${expectedDate}`,
      actual: actual,
      expected: expectedDate,
    };
  },
  toHaveTests(
    received: MonkeyTypes.TestActivityDay,
    expected: number
  ): MatcherResult {
    const expectedLabel = `${expected} ${expected == 1 ? "test" : "tests"}`;
    const actual = received.label?.substring(0, received.label.indexOf(" on"));

    return {
      pass: actual == expectedLabel,
      message: () => `Tests ${actual} is not ${expectedLabel}`,
      actual: actual,
      expected: expectedLabel,
    };
  },
  toHaveLevel(
    received: MonkeyTypes.TestActivityDay,
    expected: string | number
  ): MatcherResult {
    return {
      pass: received.level === expected.toString(),
      message: () => `Level ${received.level} is not ${expected}`,
      actual: received.level,
      expected: expected,
    };
  },

  toBeFiller(received: MonkeyTypes.TestActivityDay): MatcherResult {
    return {
      pass: received.level === "filler",
      message: () => `Is not a filler.`,
      actual: received.level,
      expected: "filler",
    };
  },
});
