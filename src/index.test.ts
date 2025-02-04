import { expect, mock, test } from "bun:test";

import { Batcher } from ".";

test("calls the function once per key", async () => {
	let fn = mock().mockImplementation(() => Promise.resolve());
	let batcher = new Batcher();

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
	let batcher = new Batcher();

	let times = Math.floor(Math.random() * 100) + 1;

	await Promise.all(
		Array.from({ length: times }).map((_, index) => {
			return batcher.call([index], fn);
		}),
	);

	expect(fn).toHaveBeenCalledTimes(times);
});

test("caches results and return the same value", async () => {
	let batcher = new Batcher();

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

test("real world scenario", async () => {
	let batcher = new Batcher();

	let result = { key: "value" as const };
	let fn = mock<() => Promise<typeof result>>().mockImplementation(() => {
		return new Promise((resolve) => setTimeout(resolve, 5, result));
	});

	async function loader1(batcher: Batcher) {
		await batcher.call(["key"], fn);
	}

	async function loader2(batcher: Batcher) {
		await batcher.call(["key"], fn);
		await batcher.call(["key"], fn);
	}

	async function loader3(batcher: Batcher) {
		await Promise.all([
			batcher.call(["key"], fn),
			batcher.call(["key"], fn),
			batcher.call(["key"], fn),
		]);
	}

	await Promise.all([loader1(batcher), loader2(batcher), loader3(batcher)]);

	expect(fn).toHaveBeenCalledTimes(1);
});
