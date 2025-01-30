import type { Jsonifiable } from "type-fest";

/**
 * This is our batcher implementation. It is a class that allows us to batch
 * function calls that are identical within a certain time window. This is
 * useful for reducing API calls to external services, for example.
 *
 * The Batcher class has a cache property that stores the results of the
 * function calls. It also has a timeouts property that stores the timeouts
 * for each function call. The batchWindow property is the time window in
 * milliseconds that we use to batch the function calls.
 *
 * The call method takes an array of values as key and an async function fn.
 * It converts the key to a string and stores it in the cache. If the cache
 * already has the key, it returns the cached value. Otherwise, it creates a
 * new promise and sets a timeout for the function call. When the timeout
 * expires, the function is called and the result is resolved. If an error
 * occurs, the promise is rejected. Finally, the timeout is removed from the
 * timeouts property.
 *
 * @example
 * let batcher = new Batcher(10);
 * let [value1, value2] = await Promise.all([
 *   batcher.call(["key"], async () => {
 *     await new Promise((resolve) => setTimeout(resolve, 5));
 *     return { key: "value" }
 *   }),
 *   batcher.call(["key"], async () => {
 *    await new Promise((resolve) => setTimeout(resolve, 5));
 *    return { key: "value" }
 *   }),
 * ])
 * console.log(value1 === value2); // true
 */
export class Batcher {
	protected readonly cache = new Map<string, Promise<unknown>>();
	protected readonly timeouts = new Map<string, Timer>();

	/**
	 * Creates a new instance of the Batcher.
	 * @param batchWindow The time window (in milliseconds) to batch function calls.
	 */
	constructor(protected batchWindow?: number) {}

	/**
	 * Calls a function with batching, ensuring multiple identical calls within a time window execute only once.
	 * @template TArgs The argument types.
	 * @template TResult The return type.
	 * @param fn The async function to batch.
	 * @param key An array of values used for deduplication.
	 * @returns A promise that resolves with the function result.
	 */
	call<TResult, Key extends Jsonifiable>(
		key: Key[],
		fn: () => Promise<TResult>,
	): Promise<TResult> {
		let cacheKey = JSON.stringify(key);

		if (this.cache.has(cacheKey)) {
			return this.cache.get(cacheKey) as Promise<TResult>;
		}

		let promise = new Promise<TResult>((resolve, reject) => {
			let timeout = setTimeout(async () => {
				try {
					let result = await fn();
					resolve(result);
				} catch (error) {
					reject(error);
				} finally {
					this.timeouts.delete(cacheKey);
				}
			}, this.batchWindow);

			this.timeouts.set(cacheKey, timeout);
		});

		this.cache.set(cacheKey, promise);

		return promise;
	}
}
