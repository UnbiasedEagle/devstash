import { describe, expect, it } from "vitest";
import { includeCollection } from "@/lib/collection-options";

const options = [
  { id: "col-1", name: "Big" },
  { id: "col-2", name: "Small" },
];

describe("includeCollection", () => {
  it("adds the item's collection when the list does not have it", () => {
    const current = { id: "col-3", name: "Renamed" };

    expect(includeCollection(options, current)).toEqual([...options, current]);
  });

  it("returns the list unchanged when the collection is already in it", () => {
    expect(includeCollection(options, options[1])).toBe(options);
  });

  it("returns the list unchanged for an uncollected item", () => {
    expect(includeCollection(options, null)).toBe(options);
  });

  it("gives an empty list the item's collection so the field still shows", () => {
    const current = { id: "col-1", name: "Big" };

    expect(includeCollection([], current)).toEqual([current]);
  });
});
