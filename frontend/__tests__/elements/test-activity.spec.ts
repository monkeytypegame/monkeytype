import {
  ActivityCalendar,
  ActivityDay,
  ModifiableActicityCalendar,
} from "../../src/ts/elements/test-activity";
import * as Dates from "date-fns";
import { MatcherResult } from "../vitest";

describe("test-activity.ts", () => {
  describe("ActivityCalendar", () => {
    describe("getMonths", () => {
      it("for lastDay in april", () => {
        const calendar = new ActivityCalendar([], getDate("2024-04-10"));

        expect(calendar.getMonths()).toEqual([
          "May`23",
          "Jun`23",
          "Jul`23",
          "Aug`23",
          "Sep`23",
          "Oct`23",
          "Nov`23",
          "Dec`23",
          "Jan`24",
          "Feb`24",
          "Mar`24",
          "Apr`24",
        ]);
      });
      it("for lastDay in january", () => {
        const calendar = new ActivityCalendar([], getDate("2023-01-01"));

        expect(calendar.getMonths()).toEqual([
          "Feb`22",
          "Mar`22",
          "Apr`22",
          "May`22",
          "Jun`22",
          "Jul`22",
          "Aug`22",
          "Sep`22",
          "Oct`22",
          "Nov`22",
          "Dec`22",
          "Jan`23",
        ]);
      });
    });

    /*
    describe("getYearSelector", () => {
      beforeAll(() => {
        vi.useFakeTimers();
      });
      afterAll(() => {
        vi.useRealTimers();
      });
      it("for start of 2022", () => {
        vi.setSystemTime(getDate("2022-01-01"));
        const calendar = new ActivityCalendar([], getDate("2022-01-01"));
        const selector = calendar.getYearSelector();
        expect(selector).toEqual([
          { text: "2022", value: "current", selected: true },
          { text: "2021", value: "2021", selected: false },
          { text: "2020", value: "2020", selected: false },
        ]);
      });
      it("for end of 2022", () => {
        vi.setSystemTime(getDate("2022-12-31"));
        const calendar = new ActivityCalendar([], getDate("2022-01-01"));
        const selector = calendar.getYearSelector();
        expect(selector).toEqual([
          { text: "2022", value: "current", selected: true },
          { text: "2021", value: "2021", selected: false },
          { text: "2020", value: "2020", selected: false },
        ]);
      });
      it("for past year", () => {
        vi.setSystemTime(getDate("2023-12-31"));
        const calendar = new ActivityCalendar([], getDate("2021-04-23"));
        const selector = calendar.getYearSelector();
        expect(selector).toEqual([
          { text: "2023", value: "current", selected: false },
          { text: "2022", value: "2022", selected: false },
          { text: "2021", value: "2021", selected: true },
          { text: "2020", value: "2020", selected: false },
        ]);
      });
    });
    */
    describe("getDays", () => {
      it("for lastDay in april", () => {
        const data = getData("2023-04-10", "2024-04-10");
        const calendar = new ActivityCalendar(data, getDate("2024-04-10"));
        const days = calendar.getDays();

        expect(days).toHaveLength(1 + 366 + 4); //one filler on the start, 366 days in leap year, four fillers at the end

        //may 23 starts with a monday, so we skip one day
        expect(days[0]).toBeFiller();

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
          expect(days[day]).toBeFiller();
        }
      });

      it("for full leap year", () => {
        //GIVEN
        const data = getData("2024-01-01", "2024-12-31");
        const calendar = new ActivityCalendar(data, getDate("2024-12-31"));

        //WHEN
        const days = calendar.getDays();

        //THEN
        expect(days).toHaveLength(1 + 366 + 4); //one filler on the start, 366 days in leap year, four fillers at the end

        //2024 starts with a monday
        expect(days[0]).toBeFiller();

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
    });

    it("for full year", () => {
      //GIVEN
      const data = getData("2022-12-20", "2023-12-31");
      const calendar = new ActivityCalendar(data, new Date(2023, 11, 31));

      //WHEN
      const days = calendar.getDays();

      //THEN
      expect(days).toHaveLength(0 + 365 + 6); //no filler on the start, 365 days in leap year, six fillers at the end

      //2023 starts with a sunday
      expect(days[0]).toBeDate("2023-01-01").toHaveTests(1).toHaveLevel(1);

      expect(days[1]).toBeDate("2023-01-02").toHaveTests(2).toHaveLevel(1);
      expect(days[364]).toBeDate("2023-12-31").toHaveTests(365).toHaveLevel(4);

      //2023 ends with a sunday
      for (let day = 365; day < 365 + 6; day++) {
        expect(days[day]).toBeFiller();
      }
    });

    it("ignores data before calendar range", () => {
      //GIVEN
      const data = getData("2023-03-28", "2024-04-10"); //extra data in front of the calendar
      const calendar = new ActivityCalendar(data, getDate("2024-04-10"));

      //WHEN
      const days = calendar.getDays();

      //THEN
      expect(days).toHaveLength(1 + 366 + 4); //one filler on the start, 366 days in leap year, four fillers at the end

      //may 23 starts with a monday, so we skip one day
      expect(days[0]).toBeFiller();

      expect(days[1]).toBeDate("2023-05-01").toHaveTests(121).toHaveLevel(2);
      expect(days[346]).toBeDate("2024-04-10").toHaveTests(101).toHaveLevel(2);
    });

    it("handles missing data in calendar range", () => {
      //GIVEN
      const data = getData("2024-04-01", "2024-04-10");
      const calendar = new ActivityCalendar(data, getDate("2024-04-10"));

      //WHEN
      const days = calendar.getDays();

      //THEN
      expect(days).toHaveLength(1 + 366 + 4); //one filler on the start, 366 days in leap year, four fillers at the end

      for (let day = 0; day <= 336; day++) {
        expect(days[day]).toBeFiller();
      }

      expect(days[337]).toBeDate("2024-04-01").toHaveTests(92).toHaveLevel(2);
      expect(days[346]).toBeDate("2024-04-10").toHaveTests(101).toHaveLevel(3);

      for (let day = 347; day <= 370; day++) {
        expect(days[day]).toBeFiller();
      }
    });

    it("for lastDay in february", () => {
      //GIVEN
      const data = getData("2022-02-10", "2023-02-10");
      const calendar = new ActivityCalendar(data, getDate("2023-02-10"));

      //WHEN
      const days = calendar.getDays();

      //THEN
      expect(days).toHaveLength(2 + 365 + 4); //two filler on the start, 365 days in the  year, four fillers at the end

      //march 22 starts with a tuesday, so we skip two days
      expect(days[0]).toBeFiller();
      expect(days[1]).toBeFiller();

      expect(days[2]).toBeDate("2022-03-01").toHaveTests(60).toHaveLevel(1);
      expect(days[307]).toBeDate("2022-12-31").toHaveTests(365).toHaveLevel(4);
      expect(days[308]).toBeDate("2023-01-01").toHaveTests(1).toHaveLevel(1);
      expect(days[348]).toBeDate("2023-02-10").toHaveTests(41).toHaveLevel(1);

      //days from 11th till 28 Februar
      for (let day = 349; day <= 365; day++) {
        expect(days[day]).toBeFiller();
      }
      //februar 23 ends with tzesday, add four fillers
      for (let day = 367; day <= 370; day++) {
        expect(days[day]).toBeFiller();
      }
    });
  });
  describe("ModifiableActivityCalendar", () => {
    describe("increment", () => {
      it("increments on lastDay", () => {
        //GIVEN
        const lastDate = getDate("2024-04-10");
        const calendar = new ModifiableActicityCalendar([1, 2, 3], lastDate);

        //WHEN
        calendar.increment(lastDate);

        //THEN
        const days = calendar.getDays();

        expect(days[343]).toBeFiller();
        expect(days[344]).toBeDate("2024-04-08").toHaveTests(1);
        expect(days[345]).toBeDate("2024-04-09").toHaveTests(2);
        expect(days[346]).toBeDate("2024-04-10").toHaveTests(4);
        expect(days[347]).toBeFiller();
      });
      it("increments after lastDay", () => {
        //GIVEN
        const lastDate = getDate("2024-04-10");
        const calendar = new ModifiableActicityCalendar([1, 2, 3], lastDate);

        //WHEN
        calendar.increment(getDate("2024-04-12"));
        //calendar.increment(getDate("2024-04-12"));

        //THEN
        let days = calendar.getDays();

        expect(days[343]).toBeFiller();
        expect(days[344]).toBeDate("2024-04-08").toHaveTests(1);
        expect(days[345]).toBeDate("2024-04-09").toHaveTests(2);
        expect(days[346]).toBeDate("2024-04-10").toHaveTests(3);
        expect(days[347]).toBeFiller();
        expect(days[348]).toBeDate("2024-04-12").toHaveTests(1);

        //WHEN
        calendar.increment(getDate("2024-04-12"));
        //calendar.increment(getDate("2024-04-12"));

        //THEN
        days = calendar.getDays();

        expect(days[343]).toBeFiller();
        expect(days[344]).toBeDate("2024-04-08").toHaveTests(1);
        expect(days[345]).toBeDate("2024-04-09").toHaveTests(2);
        expect(days[346]).toBeDate("2024-04-10").toHaveTests(3);
        expect(days[347]).toBeFiller();
        expect(days[348]).toBeDate("2024-04-12").toHaveTests(2);
      });

      it("increments after two months", () => {
        //GIVEN
        const calendar = new ModifiableActicityCalendar(
          [1, 2, 3],
          getDate("2024-04-10")
        );

        //WHEN
        calendar.increment(getDate("2024-06-12"));

        //THEN
        const days = calendar.getDays();

        expect(days[287]).toBeFiller();
        expect(days[288].label).toEqual("1 test on Monday 08 Apr 2024");
        expect(days[289].label).toEqual("2 tests on Tuesday 09 Apr 2024");
        expect(days[290].label).toEqual("3 tests on Wednesday 10 Apr 2024");
        expect(days[291]).toBeFiller();

        expect(days[352]).toBeFiller();
        expect(days[353].label).toEqual("1 test on Wednesday 12 Jun 2024");
        expect(days[354]).toBeFiller();
      });
      it("fails increment in the past", () => {
        //GIVEN
        const calendar = new ModifiableActicityCalendar(
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
});

function getDate(date: string): Date {
  return Dates.parseISO(date + "T00:00:00Z");
}

function getData(from: string, to: string): number[] {
  const start = getDate(from);
  const end = getDate(to);

  return Dates.eachDayOfInterval({ start, end }).map((it) =>
    Dates.getDayOfYear(it)
  );
}

expect.extend({
  toBeDate(received: ActivityDay, expected: string): MatcherResult {
    const expectedDate = Dates.format(getDate(expected), "EEEE dd MMM yyyy");
    const actual = received.label?.substring(received.label.indexOf("on") + 3);

    return {
      pass: actual === expectedDate,
      message: () => `Date ${actual} is not ${expectedDate}`,
      actual: actual,
      expected: expectedDate,
    };
  },
  toHaveTests(received: ActivityDay, expected: number): MatcherResult {
    const expectedLabel = `${expected} ${expected == 1 ? "test" : "tests"}`;
    const actual = received.label?.substring(0, received.label.indexOf(" on"));

    return {
      pass: actual == expectedLabel,
      message: () => `Tests ${actual} is not ${expectedLabel}`,
      actual: actual,
      expected: expectedLabel,
    };
  },
  toHaveLevel(received: ActivityDay, expected: string | number): MatcherResult {
    return {
      pass: received.level === expected.toString(),
      message: () => `Level ${received.level} is not ${expected}`,
      actual: received.level,
      expected: expected,
    };
  },

  toBeFiller(received: ActivityDay): MatcherResult {
    return {
      pass: received.level === "filler",
      message: () => `Is not a filler.`,
      actual: received.level,
      expected: "filler",
    };
  },
});
