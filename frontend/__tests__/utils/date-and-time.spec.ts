import "../../src/ts/utils/date-and-time";
import * as TZ from "timezone-mock";
import { localFromUtc } from "../../src/ts/utils/date-and-time";
import * as Dates from "date-fns";

describe("date-and-time.ts", () => {
  describe("localFromUtc", () => {
    it("converts utc to local", () => {
      const utc = new Date(1712102400000);
      const converted = localFromUtc(utc);

      expect(Dates.format(converted, "yyyy-MM-dd HH:mm:SS")).toEqual(
        "2024-04-03 00:00:00"
      );
    });
  });
});
