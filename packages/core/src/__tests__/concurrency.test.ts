import { describe, expect, it } from "vite-plus/test";
import { defaultConcurrency, mapWithConcurrency } from "../utils/concurrency";

/** Resolve after a microtask-ish delay so overlapping work is observable. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("mapWithConcurrency", () => {
  it("preserves input order in the results regardless of completion order", async () => {
    const items = [30, 10, 20, 5];
    const results = await mapWithConcurrency(
      items,
      async (value) => {
        await delay(value);
        return value * 2;
      },
      2,
    );
    expect(results).toEqual([60, 20, 40, 10]);
  });

  it("passes the index to the mapper", async () => {
    const seen: number[] = [];
    await mapWithConcurrency(
      ["a", "b", "c"],
      async (_item, index) => {
        seen.push(index);
      },
      1,
    );
    expect(seen).toEqual([0, 1, 2]);
  });

  it("never exceeds the requested concurrency", async () => {
    let inFlight = 0;
    let peak = 0;
    const items = Array.from({ length: 12 }, (_v, i) => i);

    await mapWithConcurrency(
      items,
      async (value) => {
        inFlight += 1;
        peak = Math.max(peak, inFlight);
        await delay(5);
        inFlight -= 1;
        return value;
      },
      3,
    );

    expect(peak).toBeLessThanOrEqual(3);
    expect(peak).toBeGreaterThan(1);
  });

  it("clamps a concurrency below 1 up to a single worker", async () => {
    let inFlight = 0;
    let peak = 0;
    await mapWithConcurrency(
      [1, 2, 3],
      async (value) => {
        inFlight += 1;
        peak = Math.max(peak, inFlight);
        await delay(2);
        inFlight -= 1;
        return value;
      },
      0,
    );
    expect(peak).toBe(1);
  });

  it("resolves to an empty array for an empty input without invoking the mapper", async () => {
    let calls = 0;
    const results = await mapWithConcurrency([], async () => {
      calls += 1;
      return 1;
    });
    expect(results).toEqual([]);
    expect(calls).toBe(0);
  });

  it("caps workers at the item count when concurrency exceeds it", async () => {
    let inFlight = 0;
    let peak = 0;
    await mapWithConcurrency(
      [1, 2],
      async (value) => {
        inFlight += 1;
        peak = Math.max(peak, inFlight);
        await delay(2);
        inFlight -= 1;
        return value;
      },
      100,
    );
    expect(peak).toBeLessThanOrEqual(2);
  });

  it("rejects when the mapper throws, mirroring Promise.all", async () => {
    await expect(
      mapWithConcurrency([1, 2, 3], async (value) => {
        if (value === 2) throw new Error("boom");
        return value;
      }),
    ).rejects.toThrow("boom");
  });
});

describe("defaultConcurrency", () => {
  it("returns a positive integer derived from available parallelism", () => {
    const value = defaultConcurrency();
    expect(Number.isInteger(value)).toBe(true);
    expect(value).toBeGreaterThanOrEqual(1);
  });
});
