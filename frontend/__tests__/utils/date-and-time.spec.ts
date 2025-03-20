import * as DateAndTime from "../../src/ts/utils/date-and-time";

describe("date-and-time", () => {
  const testCases = [
    { locale: "en-US", firstDayOfWeek: 0 },
    { locale: "en", firstDayOfWeek: 0 },
    { locale: "de-DE", firstDayOfWeek: 1 },
    { locale: "en-DE", firstDayOfWeek: 1, firefoxFirstDayOfWeek: 0 },
    { locale: "de-AT", firstDayOfWeek: 1 },
    { locale: "ps-AF", firstDayOfWeek: 6, firefoxFirstDayOfWeek: 0 },
    { locale: "de-unknown", firstDayOfWeek: 1 },
    { locale: "xx-yy", firstDayOfWeek: 1, firefoxFirstDayOfWeek: 0 },
  ];

  describe("getFirstDayOfTheWeek", () => {
    const languageMock = vi.spyOn(window.navigator, "language", "get");
    const localeMock = vi.spyOn(Intl, "Locale");

    beforeEach(() => {
      languageMock.mockReset();
      localeMock.mockReset();
    });

    it("fallback to sunday for missing language", () => {
      //GIVEN
      languageMock.mockReturnValue(null as any);

      //WHEN / THEN
      expect(DateAndTime.getFirstDayOfTheWeek()).toEqual(0);
    });

    describe("with weekInfo", () => {
      it.for(testCases)(`$locale`, ({ locale, firstDayOfWeek }) => {
        //GIVEN
        languageMock.mockReturnValue(locale);
        localeMock.mockImplementationOnce(
          () => ({ weekInfo: { firstDay: firstDayOfWeek } } as any)
        );

        //WHEN/THEN
        expect(DateAndTime.getFirstDayOfTheWeek()).toEqual(firstDayOfWeek);
      });
    });

    describe("with getWeekInfo", () => {
      it("with getWeekInfo on monday", () => {
        languageMock.mockReturnValue("en-US");
        localeMock.mockImplementationOnce(
          () => ({ getWeekInfo: () => ({ firstDay: 1 }) } as any)
        );

        //WHEN/THEN
        expect(DateAndTime.getFirstDayOfTheWeek()).toEqual(1);
      });
      it("with getWeekInfo on sunday", () => {
        languageMock.mockReturnValue("en-US");
        localeMock.mockImplementationOnce(
          () => ({ getWeekInfo: () => ({ firstDay: 7 }) } as any)
        );

        //WHEN/THEN
        expect(DateAndTime.getFirstDayOfTheWeek()).toEqual(0);
      });
    });

    describe("without weekInfo (firefox)", () => {
      beforeEach(() => {
        localeMock.mockImplementationOnce(() => ({} as any));
      });

      it.for(testCases)(
        `$locale`,
        ({ locale, firstDayOfWeek, firefoxFirstDayOfWeek }) => {
          //GIVEN
          languageMock.mockReturnValue(locale);

          //WHEN/THEN
          expect(DateAndTime.getFirstDayOfTheWeek()).toEqual(
            firefoxFirstDayOfWeek !== undefined
              ? firefoxFirstDayOfWeek
              : firstDayOfWeek
          );
        }
      );
    });
  });
});
