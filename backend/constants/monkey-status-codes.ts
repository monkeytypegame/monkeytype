type Status = {
  code: number;
  message: string;
};

type Statuses = {
  RESULT_TOO_SHORT: Status;
  GIT_GUD: Status;
};

export function getCodesRangeStart(): number {
  return 460;
}

const statuses: Statuses = {
  RESULT_TOO_SHORT: {
    code: 461,
    message: "Test too short",
  },
  GIT_GUD: {
    code: 469,
    message: "Git gud scrub",
  },
};

export default statuses;
