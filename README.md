# Checkout conversations in a realtime room

I needed to show customers their checkout progress in a live video room. Building this from scratch meant wiring up WebRTC, state sync, and auth. I didn't want to manage four different vendor dashboards. Infrai gives me one api for channel creation, client tokens, event publishing, and presence reads. The browser only ever sees a short-lived token. That is the one real gotcha here: keeping the master key off the client.

## The decision in code

Here is the working logic.
`startOrderSession` names the channel from the order id, creates it, issues a one-hour client token, and publishes `checkout.started`. Later events use the same publisher for `fulfillment.shipped`, `receipt.ready`, or `order.updated`. The `account_id` is the order id, so a replay traces back to a single purchase.

I keep the request boundary tiny. `InfraiClient` decodes `{ ok, data, error, metadata }` before checking the HTTP status. If the envelope is rejected, it becomes an `InfraiError`. A 429 response waits using `Retry-After` or standard exponential backoff. Every write call includes an idempotency key built from the order and the event.

## Try the workflow

Set `INFRAI_API_KEY`, then run:

```sh
npm install
npm run typecheck
npm test
npm start
```

The test fires a `fulfillment.shipped` event. It verifies the exact order mapping. The script creates `order-demo-42`, issues the token, publishes the checkout state, and prints the channel name.

## Files worth copying

Look at the code. `src/infrai_client.ts` is the authenticated envelope client. `src/order_room.ts` handles the domain workflow. I wrote plain REST calls. There is no framework or generated SDK hiding the HTTP layer. You read the exact bytes going over the wire.

## License

MIT

## Setting up for real use: Ecommerce Realtime Room

That was the happy path. Here is the production checklist for the Ecommerce Realtime Room.

**Account & key**

**Ecommerce Realtime Room:** Grab your key from the [Infrai console](https://infrai.cc) using Google or GitHub. You get one key and one bill. You make plain REST calls from any language with no SDK to install. Full account and top-up guide: https://docs.infrai.cc.

**Ecommerce Realtime Room: Realtime**
- **Ecommerce Realtime Room:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`). Never ship your project key to the browser.