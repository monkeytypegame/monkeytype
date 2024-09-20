import * as DateAndTime from "../src/date-and-time";

describe("date-and-time", () => {
  afterAll(() => {
    vi.useRealTimers();
  });
  it("getCurrentDayTimestamp", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1652743381);

    const currentDay = DateAndTime.getCurrentDayTimestamp();
    expect(currentDay).toBe(1641600000);
  });
  it("getStartOfWeekTimestamp", () => {
    const testCases = [
      {
        input: 1662400184017, // Mon Sep 05 2022 17:49:44 GMT+0000
        expected: 1662336000000, // Mon Sep 05 2022 00:00:00 GMT+0000
      },
      {
        input: 1559771456000, // Wed Jun 05 2019 21:50:56 GMT+0000
        expected: 1559520000000, // Mon Jun 03 2019 00:00:00 GMT+0000
      },
      {
        input: 1465163456000, // Sun Jun 05 2016 21:50:56 GMT+0000
        expected: 1464566400000, // Mon May 30 2016 00:00:00 GMT+0000
      },
      {
        input: 1491515456000, // Thu Apr 06 2017 21:50:56 GMT+0000
        expected: 1491177600000, // Mon Apr 03 2017 00:00:00 GMT+0000
      },
      {
        input: 1462507200000, // Fri May 06 2016 04:00:00 GMT+0000
        expected: 1462147200000, // Mon May 02 2016 00:00:00 GMT+0000
      },
      {
        input: 1231218000000, // Tue Jan 06 2009 05:00:00 GMT+0000,
        expected: 1231113600000, // Mon Jan 05 2009 00:00:00 GMT+0000
      },
      {
        input: 1709420681000, // Sat Mar 02 2024 23:04:41 GMT+0000
        expected: 1708905600000, // Mon Feb 26 2024 00:00:00 GMT+0000
      },
    ];

    testCases.forEach(({ input, expected }) => {
      expect(DateAndTime.getStartOfWeekTimestamp(input)).toEqual(expected);
    });
  });
  it("getCurrentWeekTimestamp", () => {
    Date.now = vi.fn(() => 825289481000); // Sun Feb 25 1996 23:04:41 GMT+0000

    const currentWeek = DateAndTime.getCurrentWeekTimestamp();
    expect(currentWeek).toBe(824688000000); // Mon Feb 19 1996 00:00:00 GMT+0000
  });
  it("getStartOfDayTimestamp", () => {
    const testCases = [
      {
        input: new Date("2023/06/16 15:00 UTC").getTime(),
        offset: 0,
        expected: new Date("2023/06/16 00:00 UTC").getTime(), // Mon Sep 05 2022 00:00:00 GMT+0000
      },
      {
        input: new Date("2023/06/16 15:00 UTC").getTime(),
        offset: 1,
        expected: new Date("2023/06/16 01:00 UTC").getTime(), // Mon Sep 05 2022 00:00:00 GMT+0000
      },
      {
        input: new Date("2023/06/16 15:00 UTC").getTime(),
        offset: -1,
        expected: new Date("2023/06/15 23:00 UTC").getTime(), // Mon Sep 05 2022 00:00:00 GMT+0000
      },
      {
        input: new Date("2023/06/16 15:00 UTC").getTime(),
        offset: -4,
        expected: new Date("2023/06/15 20:00 UTC").getTime(), // Mon Sep 05 2022 00:00:00 GMT+0000
      },
      {
        input: new Date("2023/06/16 15:00 UTC").getTime(),
        offset: 4,
        expected: new Date("2023/06/16 04:00 UTC").getTime(), // Mon Sep 05 2022 00:00:00 GMT+0000
      },
      {
        input: new Date("2023/06/17 03:00 UTC").getTime(),
        offset: 4,
        expected: new Date("2023/06/16 04:00 UTC").getTime(), // Mon Sep 05 2022 00:00:00 GMT+0000
      },
      {
        input: new Date("2023/06/16 15:00 UTC").getTime(),
        offset: 3,
        expected: new Date("2023/06/16 03:00 UTC").getTime(), // Mon Sep 05 2022 00:00:00 GMT+0000
      },
      {
        input: new Date("2023/06/17 01:00 UTC").getTime(),
        offset: 3,
        expected: new Date("2023/06/16 03:00 UTC").getTime(), // Mon Sep 05 2022 00:00:00 GMT+0000
      },
    ];

    testCases.forEach(({ input, offset, expected }) => {
      expect(
        DateAndTime.getStartOfDayTimestamp(input, offset * 3600000)
      ).toEqual(expected);
    });
  });

  it("isToday", () => {
    const testCases = [
      {
        now: new Date("2023/06/16 15:00 UTC").getTime(),
        input: new Date("2023/06/16 15:00 UTC").getTime(),
        offset: 0,
        expected: true,
      },
      {
        now: new Date("2023/06/16 15:00 UTC").getTime(),
        input: new Date("2023/06/17 1:00 UTC").getTime(),
        offset: 0,
        expected: false,
      },
      {
        now: new Date("2023/06/16 15:00 UTC").getTime(),
        input: new Date("2023/06/16 01:00 UTC").getTime(),
        offset: 1,
        expected: true,
      },
      {
        now: new Date("2023/06/16 15:00 UTC").getTime(),
        input: new Date("2023/06/17 01:00 UTC").getTime(),
        offset: 2,
        expected: true,
      },
      {
        now: new Date("2023/06/16 15:00 UTC").getTime(),
        input: new Date("2023/06/16 01:00 UTC").getTime(),
        offset: 2,
        expected: false,
      },
      {
        now: new Date("2023/06/17 01:00 UTC").getTime(),
        input: new Date("2023/06/16 15:00 UTC").getTime(),
        offset: 2,
        expected: true,
      },
      {
        now: new Date("2023/06/17 01:00 UTC").getTime(),
        input: new Date("2023/06/17 02:00 UTC").getTime(),
        offset: 2,
        expected: false,
      },
    ];

    testCases.forEach(({ now, input, offset, expected }) => {
      Date.now = vi.fn(() => now);
      expect(DateAndTime.isToday(input, offset)).toEqual(expected);
    });
  });

  it("isYesterday", () => {
    const testCases = [
      {
        now: new Date("2023/06/15 15:00 UTC").getTime(),
        input: new Date("2023/06/14 15:00 UTC").getTime(),
        offset: 0,
        expected: true,
      },
      {
        now: new Date("2023/06/15 15:00 UTC").getTime(),
        input: new Date("2023/06/15 15:00 UTC").getTime(),
        offset: 0,
        expected: false,
      },
      {
        now: new Date("2023/06/15 15:00 UTC").getTime(),
        input: new Date("2023/06/16 15:00 UTC").getTime(),
        offset: 0,
        expected: false,
      },
      {
        now: new Date("2023/06/15 15:00 UTC").getTime(),
        input: new Date("2023/06/13 15:00 UTC").getTime(),
        offset: 0,
        expected: false,
      },
      {
        now: new Date("2023/06/16 02:00 UTC").getTime(),
        input: new Date("2023/06/15 02:00 UTC").getTime(),
        offset: 4,
        expected: true,
      },
      {
        now: new Date("2023/06/16 02:00 UTC").getTime(),
        input: new Date("2023/06/16 01:00 UTC").getTime(),
        offset: 4,
        expected: false,
      },
      {
        now: new Date("2023/06/16 02:00 UTC").getTime(),
        input: new Date("2023/06/15 22:00 UTC").getTime(),
        offset: 4,
        expected: false,
      },
      {
        now: new Date("2023/06/16 04:00 UTC").getTime(),
        input: new Date("2023/06/16 03:00 UTC").getTime(),
        offset: 4,
        expected: true,
      },
      {
        now: new Date("2023/06/16 14:00 UTC").getTime(),
        input: new Date("2023/06/16 12:00 UTC").getTime(),
        offset: -11,
        expected: true,
      },
    ];

    testCases.forEach(({ now, input, offset, expected }) => {
      Date.now = vi.fn(() => now);
      expect(DateAndTime.isYesterday(input, offset)).toEqual(expected);
    });
  });
});
