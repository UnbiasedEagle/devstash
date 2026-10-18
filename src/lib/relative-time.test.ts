import { describe, expect, it } from "vitest";
import { formatRelativeTime } from "@/lib/relative-time";

const NOW = Date.parse("2026-10-18T12:00:00Z");
const ago = (seconds: number) => new Date(NOW - seconds * 1000);

describe("formatRelativeTime", () => {
  it("says just now for under a minute", () => {
    expect(formatRelativeTime(ago(0), NOW)).toBe("just now");
    expect(formatRelativeTime(ago(45), NOW)).toBe("just now");
  });

  it("formats minutes, hours and days", () => {
    expect(formatRelativeTime(ago(5 * 60), NOW)).toBe("5 minutes ago");
    expect(formatRelativeTime(ago(60 * 60), NOW)).toBe("1 hour ago");
    expect(formatRelativeTime(ago(3 * 60 * 60), NOW)).toBe("3 hours ago");
    expect(formatRelativeTime(ago(24 * 60 * 60), NOW)).toBe("yesterday");
    expect(formatRelativeTime(ago(3 * 24 * 60 * 60), NOW)).toBe("3 days ago");
  });

  it("formats weeks, months and years", () => {
    expect(formatRelativeTime(ago(14 * 24 * 60 * 60), NOW)).toBe("2 weeks ago");
    expect(formatRelativeTime(ago(60 * 24 * 60 * 60), NOW)).toBe(
      "2 months ago",
    );
    expect(formatRelativeTime(ago(400 * 24 * 60 * 60), NOW)).toBe("last year");
  });

  it("treats a timestamp slightly in the future as just now", () => {
    expect(formatRelativeTime(new Date(NOW + 30_000), NOW)).toBe("just now");
    expect(formatRelativeTime(new Date(NOW + 3 * 60 * 60 * 1000), NOW)).toBe(
      "just now",
    );
  });
});
