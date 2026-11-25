import { getConfig } from "../../../../config/store";
import { formatTypingSpeed } from "../../../../utils/format";

export function speedBalloon(wpm: number): string | undefined {
  const unit = getConfig.typingSpeedUnit;
  if (getConfig.alwaysShowDecimalPlaces) {
    return unit !== "wpm" ? `${wpm.toFixed(2)} wpm` : undefined;
  }
  let text = formatTypingSpeed(wpm, {
    showDecimalPlaces: true,
    suffix: ` ${unit}`,
  });
  if (unit !== "wpm") text += ` (${wpm.toFixed(2)} wpm)`;
  return text;
}
