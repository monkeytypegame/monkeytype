import { ActivityCalendar } from "../../src/ts/elements/test-activity";
import * as Dates from "date-fns";

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
    describe("getDays", () => {
      it("for lastDay in april", () => {
        const data = getData("2023-04-10", "2024-04-10");
        const calendar = new ActivityCalendar(data, getDate("2024-04-10"));
        const days = calendar.getDays();

        expect(days).toHaveLength(1 + 366 + 4); //one filler on the start, 366 days in leap year, four fillers at the end

        //may 23 starts with a monday, so we skip one day
        expect(days[0]).toEqual({
          level: "filler",
        });

        expect(days[1]).toEqual({
          level: "2",
          label: "121 tests on Monday 01 May 2023", //may 1st is the 121 day of 2023
        });

        expect(days[245]).toEqual({
          level: "4",
          label: "365 tests on Sunday 31 Dec 2023",
        });

        expect(days[246]).toEqual({
          level: "1",
          label: "1 test on Monday 01 Jan 2024",
        });

        expect(days[305]).toEqual({
          level: "1",
          label: "60 tests on Thursday 29 Feb 2024",
        });

        expect(days[346]).toEqual({
          level: "2",
          label: "101 tests on Wednesday 10 Apr 2024",
        });

        //days from April 11th to April 30th
        for (let day = 347; day <= 366; day++) {
          expect(days[day]).toEqual({
            level: "filler",
          });
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
        expect(days[0]).toEqual({
          level: "filler",
        });

        expect(days[1]).toEqual({
          level: "1",
          label: "1 test on Monday 01 Jan 2024",
        });

        expect(days[60]).toEqual({
          level: "1",
          label: "60 tests on Thursday 29 Feb 2024",
        });

        expect(days[366]).toEqual({
          level: "4",
          label: "366 tests on Tuesday 31 Dec 2024",
        });

        //2024 ends with a thuesday
        for (let day = 367; day < 1 + 366 + 4; day++) {
          expect(days[day]).toEqual({
            level: "filler",
          });
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

      expect(days[0]).toEqual({
        level: "1",
        label: "1 test on Sunday 01 Jan 2023",
      });

      expect(days[1]).toEqual({
        level: "1",
        label: "2 tests on Monday 02 Jan 2023",
      });

      expect(days[364]).toEqual({
        level: "4",
        label: "365 tests on Sunday 31 Dec 2023",
      });

      //2023 ends with a sunday
      for (let day = 365; day < 365 + 6; day++) {
        expect(days[day]).toEqual({
          level: "filler",
        });
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
      expect(days[0]).toEqual({
        level: "filler",
      });

      expect(days[1]).toEqual({
        level: "2",
        label: "121 tests on Monday 01 May 2023", //may 1st is the 121 day of 2023
      });

      expect(days[346]).toEqual({
        level: "2",
        label: "101 tests on Wednesday 10 Apr 2024",
      });
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
        expect(days[day]).toEqual({
          level: "filler",
        });
      }

      expect(days[337]).toEqual({
        level: "2",
        label: "92 tests on Monday 01 Apr 2024",
      });

      expect(days[346]).toEqual({
        level: "3",
        label: "101 tests on Wednesday 10 Apr 2024",
      });

      for (let day = 347; day <= 370; day++) {
        expect(days[day]).toEqual({
          level: "filler",
        });
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
      expect(days[0]).toEqual({
        level: "filler",
      });
      expect(days[1]).toEqual({
        level: "filler",
      });

      expect(days[2]).toEqual({
        level: "1",
        label: "60 tests on Tuesday 01 Mar 2022", //march 1st is the 60s day of 2022
      });

      expect(days[307]).toEqual({
        level: "4",
        label: "365 tests on Saturday 31 Dec 2022",
      });

      expect(days[308]).toEqual({
        level: "1",
        label: "1 test on Sunday 01 Jan 2023",
      });

      expect(days[348]).toEqual({
        level: "1",
        label: "41 tests on Friday 10 Feb 2023",
      });

      //days from 11th till 28 Februar
      for (let day = 349; day <= 365; day++) {
        expect(days[day]).toEqual({
          level: "filler",
        });
      }
      //februar 23 ends with tzesday, add four fillers
      for (let day = 367; day <= 370; day++) {
        expect(days[day]).toEqual({
          level: "filler",
        });
      }
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
