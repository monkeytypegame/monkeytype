import {
  format as dateFormat,
  formatDistanceToNowStrict as dateFormatDistanceToNowStrict,
} from "date-fns";

export function format<DateType extends Date>(
  date: DateType | number,
  formatString: string
): string {
  return dateFormat(date, formatString);
}

export function formatDistanceToNowStrict<DateType extends Date>(
  date: DateType | number
): string {
  return dateFormatDistanceToNowStrict(date);
}
