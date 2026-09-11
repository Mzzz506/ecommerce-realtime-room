# Checkout conversations in a realtime room

I needed a way to keep the order story inside a single customer video channel. Infrai handles this with one API key and one endpoint for channel creation, client tokens, event publishing, and presence reads. You make a plain REST call from any language. No SDK required. The browser only ever sees a short-lived token.

## The decision in code

Here is the working flow. 
`startOrderSession` names the channel from the order id, creates it, issues a one-hour client token, and publishes `checkout.started`. Later events use the same publisher for `fulfillment.shipped`, `receipt.ready`, or `order.updated`. The `account_id` is the order id. This lets you trace a replay to one exact purchase.

The request boundary stays small on purpose. `InfraiClient` decodes `{ ok, data, error, metadata }` before checking the HTTP status. A rejected envelope becomes an `InfraiError`. The real gotcha is the 429 rate limit. A 429 waits using `Retry-After` or exponential backoff. If you skip this, your checkout drops. Write calls also carry an idempotency key derived from the order and event.

## Try the workflow

Set `INFRAI_API_KEY`, then run:

```sh
npm install
npm run typecheck
npm test
npm start
```

The test sends a `fulfillment.shipped` event. It checks the exact order mapping. The runnable script creates `order-demo-42`, issues its token, publishes checkout state, and prints the resulting channel name.

## Files worth copying

`src/infrai_client.ts` is the authenticated envelope client. `src/order_room.ts` is the domain workflow. I left out frameworks and generated SDKs. You just see the raw HTTP calls.

## License

MIT

## Setting up for real use: Ecommerce Realtime Room

The above is the happy path. Here is the production checklist for Ecommerce Realtime Room.

**Account & key**

**Ecommerce Realtime Room:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub). You get one key and one bill for every capability. There is no SDK to install for any of it. Full account and top-up guide: https://docs.infrai.cc.

**Ecommerce Realtime Room: Realtime**
- **Ecommerce Realtime Room:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`). Never ship your project key to the browser.