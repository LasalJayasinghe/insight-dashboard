import { describe, it, expect } from "vitest";
import { squarify } from "./treemap";
describe("squarify", () => {
  it("areas are proportional to value and fill the box", () => {
    const r = squarify([{ id: "a", value: 6 }, { id: "b", value: 3 }, { id: "c", value: 1 }], 100, 100);
    const area = (id: string) => { const t = r.find((x) => x.id === id)!; return t.w * t.h; };
    expect(area("a")).toBeCloseTo(6000);
    expect(area("c")).toBeCloseTo(1000);
  });
  it("drops zero values", () => {
    expect(squarify([{ id: "a", value: 0 }], 10, 10)).toEqual([]);
  });
});
