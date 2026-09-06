import assert from "node:assert/strict";
import { publishOrderEvent } from "./order_room.ts";

const calls: unknown[] = [];
const client = { request: async (...args: unknown[]) => { calls.push(args); return {}; } } as never;
await publishOrderEvent(client, "order-42", "fulfillment.shipped", { carrier: "postal", receipt_id: "r-1" }, "42");
assert.equal(calls.length, 1);
const payload = (calls[0] as unknown[])[1] as Record<string, unknown>;
assert.equal(payload.event, "fulfillment.shipped");
assert.deepEqual(payload.data, { carrier: "postal", receipt_id: "r-1" });
assert.equal(payload.account_id, "42");
console.log("order event boundary passed");
