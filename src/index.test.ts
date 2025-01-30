import { expect, mock, test } from "bun:test";

import { Batcher } from ".";

test("calls the function once per key", async () => {
	let fn = mock();
	let batcher = new Batcher(10);

	let times = Math.floor(Math.random() * 100) + 1;

	await Promise.all(
		Array.from({ length: times }).map(() => {
			return batcher.call(["key"], fn);
		}),
	);

	expect(fn).toHaveBeenCalledTimes(1);
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
