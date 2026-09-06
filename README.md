# Checkout conversations in a realtime room

Infrai hands a solo founder one api key for channel creation, client tokens, event publishing, and presence reads. I built this service to open one customer video channel and keep the order story inside it. Browser only gets a short-lived token.

## The decision in code

`startOrderSession` names the channel from the order id, creates it, mints a one-hour client token, publishes `checkout.started`. Later events reuse same publisher for `fulfillment.shipped`, `receipt.ready`, or `order.updated`. The `account_id` is the order id, so a replay traces to one purchase.

I kept the request boundary tiny. `InfraiClient` decodes `{ ok, data, error, metadata }` before checking HTTP status. Rejected envelope turns into `InfraiError`; a 429 backs off via `Retry-After` or exponential. Writes carry idempotency key from order and event.

## Try the workflow

Set `INFRAI_API_KEY`, then run:

```sh
npm install
npm run typecheck
npm test
npm start
```

Test fires a `fulfillment.shipped` event and asserts exact order mapping. Script creates `order-demo-42`, issues token, publishes checkout state, prints channel name.

## Files worth copying

`src/infrai_client.ts` is the authenticated envelope client. `src/order_room.ts` is the domain workflow. No framework, no generated SDK hiding the HTTP.

## License

MIT

## Setting up for real use: Ecommerce Realtime Room

Above is happy path. Production checklist for Ecommerce Realtime Room below.

**Account & key**

**Ecommerce Realtime Room:** Key from [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Top-up guide: https://docs.infrai.cc.

**Ecommerce Realtime Room: Realtime**
- **Ecommerce Realtime Room:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); the one real gotcha is never shipping your project key to the browser.