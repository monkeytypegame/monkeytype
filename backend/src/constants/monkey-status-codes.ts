type Status = {
  code: number;
  message: string;
};

type Statuses = {
  [key: string]: Status;
};

const statuses: Statuses = {
  TEST_TOO_SHORT: { code: 460, message: "Test too short" },
  RESULT_HASH_INVALID: { code: 461, message: "Result hash invalid" },
  RESULT_SPACING_INVALID: { code: 462, message: "Result spacing invalid" },
  RESULT_DATA_INVALID: { code: 463, message: "Result data invalid" },
  MISSING_KEY_DATA: { code: 464, message: "Missing key data" },
  BOT_DETECTED: { code: 465, message: "Bot detected" },
  DUPLICATE_RESULT: { code: 466, message: "Duplicate result" },
  GIT_GUD: { code: 469, message: "Git gud scrub" },
  APE_KEY_INVALID: { code: 470, message: "Invalid ApeKey" },
  APE_KEY_INACTIVE: { code: 471, message: "ApeKey is inactive" },
  APE_KEY_MALFORMED: { code: 472, message: "ApeKey is malformed" },
  APE_KEY_RATE_LIMIT_EXCEEDED: { code: 479, message: "ApeKey rate limit exceeded" },
};

const CUSTOM_STATUS_CODES = new Set(
  Object.values(statuses).map((status: Status) => status.code)
);

export function isCustomCode(code: number): boolean {
  return CUSTOM_STATUS_CODES.has(code);
}

export default statuses;
