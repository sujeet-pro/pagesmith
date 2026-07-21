import { availableParallelism } from "os";

/**
 * Default bounded-concurrency limit derived from the host's available
 * parallelism (never less than 1). Used as the cap for CPU- and IO-bound fan-out
 * so a large collection or asset set does not spawn an unbounded number of
 * in-flight promises at once.
 */
export function defaultConcurrency(): number {
  return Math.max(1, availableParallelism());
}

/**
 * Map over `items` with an async `mapper`, running at most `concurrency`
 * invocations in flight at any time. Results are returned in the same order as
 * `items` regardless of completion order.
 *
 * This is the single shared worker-pool primitive for `@pagesmith/core`; use it
 * anywhere an unbounded `Promise.all(items.map(...))` would otherwise spawn one
 * promise per item (content loading, image variant emission, …).
 *
 * The `mapper` is responsible for its own error handling if partial failures
 * should not reject the whole batch — a thrown error propagates and rejects the
 * returned promise, mirroring `Promise.all`.
 *
 * @param items - Items to process. An empty list resolves to an empty array.
 * @param mapper - Async transform invoked with each item and its index.
 * @param concurrency - Maximum in-flight invocations. Defaults to
 *   {@link defaultConcurrency}. Values below 1 are clamped to 1.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  mapper: (item: T, index: number) => Promise<R>,
  concurrency: number = defaultConcurrency(),
): Promise<R[]> {
  const total = items.length;
  const results: R[] = Array.from({ length: total });
  if (total === 0) return results;

  const limit = Math.max(1, Math.min(Math.floor(concurrency) || 1, total));
  let next = 0;

  async function worker(): Promise<void> {
    while (next < total) {
      const current = next++;
      results[current] = await mapper(items[current], current);
    }
  }

  await Promise.all(Array.from({ length: limit }, () => worker()));
  return results;
}
