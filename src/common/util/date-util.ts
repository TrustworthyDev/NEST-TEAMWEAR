export function dateToYYYYMMDD(date: Date): string {
  const d = date.toISOString();
  return ISODatestringToYYYYMMDD(d.slice(0, 10));
}

/**
 *
 * @param datestring Date string in ISO 8601 date format (YYYY-MM-DD)
 */
export function ISODatestringToYYYYMMDD(datestring: string): string {
  return datestring.replace(/-/g, '');
}

export function dateToISODatestring(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Returns the offset from GMT for the specified minute offset, in the format GMT+02:00.
 */
export function getGMTOffset(minuteOffset: number): string {
  const sign = minuteOffset > 0 ? '-' : '+';
  const hours = String(Math.floor(Math.abs(minuteOffset / 60))).padStart(
    2,
    '0',
  );
  const minutes = String(Math.abs(minuteOffset % 60)).padStart(2, '0');
  return `GMT${sign}${hours}:${minutes}`;
}
