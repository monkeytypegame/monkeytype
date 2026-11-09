import { describe, it, expect, beforeEach, vi } from "vitest";
import { Config as ConfigType } from "@monkeytype/schemas/configs";
import { Config, setConfigStore } from "../../src/ts/config/store";
import "../../src/ts/controllers/sound-controller";

const { volumeMock, howlMock } = vi.hoisted(() => ({
  volumeMock: vi.fn(),
  howlMock: vi.fn(),
}));
vi.mock("howler", () => ({
  Howler: { volume: volumeMock },
  Howl: class {
    constructor(options: unknown) {
      howlMock(options);
    }
    seek(): void {
      //
    }
  },
}));

function set<K extends keyof ConfigType>(key: K, value: ConfigType[K]): void {
  Config[key] = value;
  setConfigStore(key, value);
}

async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve));
}

describe("sound controller config effects", () => {
  beforeEach(() => {
    volumeMock.mockClear();
    howlMock.mockClear();
  });

  it("does nothing at boot", async () => {
    await flush();
    expect(volumeMock).not.toHaveBeenCalled();
    expect(howlMock).not.toHaveBeenCalled();
  });

  it("loads the click sounds when turned on", async () => {
    set("playSoundOnClick", "2");
    await flush();
    expect(howlMock).toHaveBeenCalled();
  });

  it("loads nothing when turned off", async () => {
    set("playSoundOnClick", "off");
    await flush();
    expect(howlMock).not.toHaveBeenCalled();
  });

  it("sets the volume", async () => {
    set("soundVolume", 0.3);
    await flush();
    expect(volumeMock).toHaveBeenCalledWith(0.3);
  });
});
