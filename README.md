# batcher

A simpler batcher for any async function

## Installation

```bash
npm install @edgefirst-dev/batcher
```

## Usage

```typescript
import { Batcher } from "@edgefirst-dev/batcher";

// Configure the time window for the batcher
// The batcher will call the async function only once for the same key in this time window
let batcher = new Batcher<number, string>();

async function asyncFunction(): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return { value: "ok" };
}

let [result1, result2] = await Promise.all([
  batcher.call(["my", "custom", "key"], asyncFunction),
  batcher.call(["my", "custom", "key"], asyncFunction),
]);

console.log(result1 === result2); // true
```

The batcher will call the async function only once for the same key, and return the same promise for all calls with the same key. This way, if the function returns an object all calls will resolve with the same object that can be compared by reference.

> [!TIP]
> Use this batcher in Remix or React Router applications to batch async function calls in your loaders so you can avoid multiple queries or fetches for the same data.
