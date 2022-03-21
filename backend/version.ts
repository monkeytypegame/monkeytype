function pad(
  numbers: number[],
  maxLength: number,
  fillString: string
): string[] {
  return numbers.map((number) =>
    number.toString().padStart(maxLength, fillString)
  );
}

function getDateVersion(): string {
  const date = new Date();

  const versionPrefix = pad(
    [date.getFullYear(), date.getMonth() + 1, date.getDate()],
    2,
    "0"
  ).join(".");
  const versionSuffix = pad([date.getHours(), date.getMinutes()], 2, "0").join(
    "."
  );

  return [versionPrefix, versionSuffix].join("_");
}

function getVersion(): string {
  if (process.env.MODE !== "dev") {
    return "DEVELOPMENT-VERSION";
  }

  return getDateVersion();
}

export const version = getVersion();
