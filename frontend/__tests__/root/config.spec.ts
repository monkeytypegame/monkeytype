import * as Config from "../../src/ts/config";
import defaultConfig from "../../src/ts/constants/default-config";
import * as ConfigValidation from "../../src/ts/config-validation";

describe("Config", () => {
  const asyncValidationMock = vi.spyOn(
    ConfigValidation,
    "isConfigValueValidAsync"
  );
  beforeEach(() => {
    asyncValidationMock.mockResolvedValue(true);
  });
  afterEach(() => {
    asyncValidationMock.mockReset();
  });
  it("setMode", () => {
    expect(Config.setMode("zen")).toBe(true);
    expect(Config.setMode("invalid" as any)).toBe(false);
  });
  it("setPlaySoundOnError", () => {
    expect(Config.setPlaySoundOnError("off")).toBe(true);
    expect(Config.setPlaySoundOnError("1")).toBe(true);
    expect(Config.setPlaySoundOnError("invalid" as any)).toBe(false);
  });
  it("setPlaySoundOnClick", () => {
    expect(Config.setPlaySoundOnClick("off")).toBe(true);
    expect(Config.setPlaySoundOnClick("15")).toBe(true);
    expect(Config.setPlaySoundOnClick("invalid" as any)).toBe(false);
  });
  it("setSoundVolume", () => {
    expect(Config.setSoundVolume("0.1")).toBe(true);
    expect(Config.setSoundVolume("1.0")).toBe(true);
    expect(Config.setSoundVolume("invalid" as any)).toBe(false);
  });
  it("setDifficulty", () => {
    expect(Config.setDifficulty("expert")).toBe(true);
    expect(Config.setDifficulty("invalid" as any)).toBe(false);
  });
  it("setAccountChart", () => {
    expect(Config.setAccountChart(["on", "off", "off", "on"])).toBe(true);
    //arrays not having 4 values will get [on, on, on, on] as default
    expect(Config.setAccountChart(["on", "off"] as any)).toBe(true);
    expect(Config.setAccountChart(["on", "off", "on", "true"] as any)).toBe(
      false
    );
  });
  it("setAccountChartResults", () => {
    expect(Config.setAccountChartResults(true)).toBe(true);
    expect(Config.setAccountChartResults("on" as any)).toBe(false);
  });
  it("setStopOnError", () => {
    expect(Config.setStopOnError("off")).toBe(true);
    expect(Config.setStopOnError("word")).toBe(true);
    expect(Config.setStopOnError("invalid" as any)).toBe(false);
  });
  it("setTypingSpeedUnit", () => {
    expect(Config.setTypingSpeedUnit("wpm")).toBe(true);
    expect(Config.setTypingSpeedUnit("cpm")).toBe(true);
    expect(Config.setTypingSpeedUnit("invalid" as any)).toBe(false);
  });
  it("setPaceCaret", () => {
    expect(Config.setPaceCaret("average")).toBe(true);
    expect(Config.setPaceCaret("last")).toBe(true);
    expect(Config.setPaceCaret("invalid" as any)).toBe(false);
  });
  it("setMinWpm", () => {
    expect(Config.setMinWpm("custom")).toBe(true);
    expect(Config.setMinWpm("off")).toBe(true);
    expect(Config.setMinWpm("invalid" as any)).toBe(false);
  });
  it("setMinAcc", () => {
    expect(Config.setMinAcc("custom")).toBe(true);
    expect(Config.setMinAcc("off")).toBe(true);
    expect(Config.setMinAcc("invalid" as any)).toBe(false);
  });
  it("setMinBurst", () => {
    expect(Config.setMinBurst("fixed")).toBe(true);
    expect(Config.setMinBurst("off")).toBe(true);
    expect(Config.setMinBurst("invalid" as any)).toBe(false);
  });
  it("setSingleListCommandLine", () => {
    expect(Config.setSingleListCommandLine("on")).toBe(true);
    expect(Config.setSingleListCommandLine("manual")).toBe(true);
    expect(Config.setSingleListCommandLine("invalid" as any)).toBe(false);
  });
  it("setAds", () => {
    expect(Config.setAds("on")).toBe(true);
    expect(Config.setAds("sellout")).toBe(true);
    expect(Config.setAds("invalid" as any)).toBe(false);
  });
  it("setRepeatQuotes", () => {
    expect(Config.setRepeatQuotes("off")).toBe(true);
    expect(Config.setRepeatQuotes("typing")).toBe(true);
    expect(Config.setRepeatQuotes("invalid" as any)).toBe(false);
  });
  it("setOppositeShiftMode", () => {
    expect(Config.setOppositeShiftMode("on")).toBe(true);
    expect(Config.setOppositeShiftMode("keymap")).toBe(true);
    expect(Config.setOppositeShiftMode("invalid" as any)).toBe(false);
  });
  it("setCaretStyle", () => {
    expect(Config.setCaretStyle("banana")).toBe(true);
    expect(Config.setCaretStyle("block")).toBe(true);
    expect(Config.setCaretStyle("invalid" as any)).toBe(false);
  });
  it("setPaceCaretStyle", () => {
    expect(Config.setPaceCaretStyle("carrot")).toBe(true);
    expect(Config.setPaceCaretStyle("outline")).toBe(true);
    expect(Config.setPaceCaretStyle("invalid" as any)).toBe(false);
  });
  it("setShowAverage", () => {
    expect(Config.setShowAverage("acc")).toBe(true);
    expect(Config.setShowAverage("both")).toBe(true);
    expect(Config.setShowAverage("invalid" as any)).toBe(false);
  });
  it("setHighlightMode", () => {
    expect(Config.setHighlightMode("letter")).toBe(true);
    expect(Config.setHighlightMode("next_three_words")).toBe(true);
    expect(Config.setHighlightMode("invalid" as any)).toBe(false);
  });
  it("setTapeMode", () => {
    expect(Config.setTapeMode("letter")).toBe(true);
    expect(Config.setTapeMode("off")).toBe(true);
    expect(Config.setTapeMode("invalid" as any)).toBe(false);
  });
  it("setTimerStyle", () => {
    expect(Config.setTimerStyle("bar")).toBe(true);
    expect(Config.setTimerStyle("mini")).toBe(true);
    expect(Config.setTimerStyle("invalid" as any)).toBe(false);
  });
  it("setLiveSpeedStyle", () => {
    expect(Config.setLiveSpeedStyle("text")).toBe(true);
    expect(Config.setLiveSpeedStyle("mini")).toBe(true);
    expect(Config.setLiveSpeedStyle("invalid" as any)).toBe(false);
  });
  it("setLiveAccStyle", () => {
    expect(Config.setLiveAccStyle("text")).toBe(true);
    expect(Config.setLiveAccStyle("mini")).toBe(true);
    expect(Config.setLiveAccStyle("invalid" as any)).toBe(false);
  });
  it("setLiveBurstStyle", () => {
    expect(Config.setLiveBurstStyle("text")).toBe(true);
    expect(Config.setLiveBurstStyle("mini")).toBe(true);
    expect(Config.setLiveBurstStyle("invalid" as any)).toBe(false);
  });
  it("setTimerColor", () => {
    expect(Config.setTimerColor("text")).toBe(true);
    expect(Config.setTimerColor("sub")).toBe(true);
    expect(Config.setTimerColor("invalid" as any)).toBe(false);
  });
  it("setTimerOpacity", () => {
    expect(Config.setTimerOpacity("1")).toBe(true);
    expect(Config.setTimerOpacity("0.5")).toBe(true);
    expect(Config.setTimerOpacity("invalid" as any)).toBe(false);
  });
  it("setSmoothCaret", () => {
    expect(Config.setSmoothCaret("fast")).toBe(true);
    expect(Config.setSmoothCaret("medium")).toBe(true);
    expect(Config.setSmoothCaret("invalid" as any)).toBe(false);
  });
  it("setQuickRestartMode", () => {
    expect(Config.setQuickRestartMode("off")).toBe(true);
    expect(Config.setQuickRestartMode("tab")).toBe(true);
    expect(Config.setQuickRestartMode("invalid" as any)).toBe(false);
  });
  it("setConfidenceMode", () => {
    expect(Config.setConfidenceMode("max")).toBe(true);
    expect(Config.setConfidenceMode("on")).toBe(true);
    expect(Config.setConfidenceMode("invalid" as any)).toBe(false);
  });
  it("setIndicateTypos", () => {
    expect(Config.setIndicateTypos("below")).toBe(true);
    expect(Config.setIndicateTypos("off")).toBe(true);
    expect(Config.setIndicateTypos("invalid" as any)).toBe(false);
  });
  it("setRandomTheme", () => {
    expect(Config.setRandomTheme("fav")).toBe(true);
    expect(Config.setRandomTheme("off")).toBe(true);
    expect(Config.setRandomTheme("invalid" as any)).toBe(false);
  });
  it("setKeymapMode", () => {
    expect(Config.setKeymapMode("next")).toBe(true);
    expect(Config.setKeymapMode("react")).toBe(true);
    expect(Config.setKeymapMode("invalid" as any)).toBe(false);
  });
  it("setKeymapLegendStyle", () => {
    expect(Config.setKeymapLegendStyle("blank")).toBe(true);
    expect(Config.setKeymapLegendStyle("lowercase")).toBe(true);
    expect(Config.setKeymapLegendStyle("invalid" as any)).toBe(false);
  });
  it("setKeymapStyle", () => {
    expect(Config.setKeymapStyle("matrix")).toBe(true);
    expect(Config.setKeymapStyle("split")).toBe(true);
    expect(Config.setKeymapStyle("invalid" as any)).toBe(false);
  });
  it("setKeymapShowTopRow", () => {
    expect(Config.setKeymapShowTopRow("always")).toBe(true);
    expect(Config.setKeymapShowTopRow("never")).toBe(true);
    expect(Config.setKeymapShowTopRow("invalid" as any)).toBe(false);
  });
  it("setCustomBackgroundSize", () => {
    expect(Config.setCustomBackgroundSize("contain")).toBe(true);
    expect(Config.setCustomBackgroundSize("cover")).toBe(true);
    expect(Config.setCustomBackgroundSize("invalid" as any)).toBe(false);
  });
  it("setCustomBackgroundFilter", () => {
    expect(Config.setCustomBackgroundFilter([0, 1, 2, 3])).toBe(true);
    //gets converted
    expect(Config.setCustomBackgroundFilter([0, 1, 2, 3, 4] as any)).toBe(true);
    expect(Config.setCustomBackgroundFilter([] as any)).toBe(false);
    expect(Config.setCustomBackgroundFilter(["invalid"] as any)).toBe(false);
    expect(Config.setCustomBackgroundFilter([1, 2, 3, 4, 5, 6] as any)).toBe(
      false
    );
  });
  it("setMonkeyPowerLevel", () => {
    expect(Config.setMonkeyPowerLevel("2")).toBe(true);
    expect(Config.setMonkeyPowerLevel("off")).toBe(true);

    expect(Config.setMonkeyPowerLevel("invalid" as any)).toBe(false);
  });
});
