const UNITS: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
  { unit: "year", seconds: 60 * 60 * 24 * 365 },
  { unit: "month", seconds: 60 * 60 * 24 * 30 },
  { unit: "week", seconds: 60 * 60 * 24 * 7 },
  { unit: "day", seconds: 60 * 60 * 24 },
  { unit: "hour", seconds: 60 * 60 },
  { unit: "minute", seconds: 60 },
];

const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

// React's purity rule forbids reading the clock in a component body, so pages call this once per request
export function getRequestTime(): number {
  return Date.now();
}

// Takes `now` as an argument so the caller reads the clock once, after the request is known
export function formatRelativeTime(date: Date, now: number): string {
  // Clock skew can put an update slightly in the future, which should read as "just now"
  const seconds = Math.min(0, Math.round((date.getTime() - now) / 1000));
  const match = UNITS.find(({ seconds: size }) => Math.abs(seconds) >= size);
  if (!match) return "just now";
  return formatter.format(Math.round(seconds / match.seconds), match.unit);
}
