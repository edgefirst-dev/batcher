import { expect, mock, test } from "bun:test";
import { setImmediate } from "node:timers/promises";

import { Batcher } from ".";

test("calls the function once per key", async () => {
	let fn = mock().mockImplementation(() => Promise.resolve());
	let batcher = new Batcher(10);

	let times = Math.floor(Math.random() * 100) + 1;

	await Promise.all(
		Array.from({ length: times }).map(() => {
			return batcher.call(["key"], fn);
		}),
	);

	expect(fn).toHaveBeenCalledTimes(1);
});

test("calls the function once per key with different keys", async () => {
	let fn = mock().mockImplementation(() => Promise.resolve());
	let batcher = new Batcher(10);

	let times = Math.floor(Math.random() * 100) + 1;

	await Promise.all(
		Array.from({ length: times }).map((_, index) => {
			return batcher.call([index], fn);
		}),
	);

	expect(fn).toHaveBeenCalledTimes(times);
});

test("caches results and return the same value", async () => {
	let batcher = new Batcher(10);

	let [value1, value2] = await Promise.all([
		batcher.call(["key"], async () => {
			await new Promise((resolve) => setTimeout(resolve, 5));
			return { key: "value" };
		}),
		batcher.call(["key"], async () => {
			await new Promise((resolve) => setTimeout(resolve, 5));
			return { key: "value" };
		}),
	]);

	expect(value1).toBe(value2);
});

test("calls the function again after the cache expires", async () => {
	let fn = mock().mockImplementation(() => Promise.resolve());
	let batcher = new Batcher(0);

	await batcher.call(["key"], fn);

	await setImmediate();

	await batcher.call(["key"], fn);

	expect(fn).toHaveBeenCalledTimes(2);
});

test("calls the function again after the cache expires with a different key", async () => {
	let fn = mock().mockImplementation(() => Promise.resolve());
	let batcher = new Batcher(0);

	await batcher.call(["key1"], fn);

	await setImmediate();

	await batcher.call(["key2"], fn);

	expect(fn).toHaveBeenCalledTimes(2);
});
