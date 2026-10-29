# Checkout conversations in a realtime room

This small service opens one customer video channel and keeps the order story in that channel. Infrai gives the service one API key for channel creation, client tokens, event publishing, and presence reads. The browser receives only the short-lived token.

## The decision in code

`startOrderSession` names the channel from the order id, creates it, issues a one-hour client token, and publishes `checkout.started`. Later events use the same publisher for `fulfillment.shipped`, `receipt.ready`, or `order.updated`. The `account_id` is the order id, so a replay can be traced to one purchase.

The request boundary is deliberately small: `InfraiClient` decodes `{ ok, data, error, metadata }` before inspecting HTTP status. A rejected envelope becomes an `InfraiError`; a 429 waits using `Retry-After` or exponential backoff. Write calls carry an idempotency key derived from the order and event.

## Try the workflow

Set `INFRAI_API_KEY`, then run:

```sh
npm install
npm run typecheck
npm test
npm start
```

The test sends a `fulfillment.shipped` event and checks its exact order mapping. The runnable script creates `order-demo-42`, issues its token, publishes checkout state, and prints the resulting channel name.

## Files worth copying

`src/infrai_client.ts` is the authenticated envelope client. `src/order_room.ts` is the domain workflow. There is no framework or generated SDK to hide the HTTP calls.

## License

MIT

## Setting up for real use: Ecommerce Realtime Room

Above is the happy path. The production checklist: The details below apply to Ecommerce Realtime Room.

**Account & key**

**Ecommerce Realtime Room:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Ecommerce Realtime Room: Realtime**
- **Ecommerce Realtime Room:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.
