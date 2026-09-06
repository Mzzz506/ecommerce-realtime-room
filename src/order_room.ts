import { InfraiClient } from "./infrai_client.ts";
import { z } from "zod";

type Order = { orderId: string; customerId: string; totalCents: number };
type Session = { channel: string; token: unknown; order: Order };
const orderBody = z.object({ orderId: z.string().min(1), customerId: z.string().min(1), totalCents: z.number().int().nonnegative() });

export async function startOrderSession(input: unknown, client = new InfraiClient()): Promise<Session> {
  const order = orderBody.parse(input);
  const channel = `order-${order.orderId}`;
  // The matching API capability is infrai.realtime.channel.create.
  await client.request("/v1/realtime/channel/create", { channel, type: "video", vendor: "livekit" }, "POST", `channel-${order.orderId}`);
  const token = await client.request("/v1/realtime/token/issue", {
    client_id: order.customerId,
    channels: [channel],
    capabilities: ["publish", "subscribe"],
    ttl_seconds: 3600
  }, "POST", `token-${order.orderId}`);
  await publishOrderEvent(client, channel, "checkout.started", { order_id: order.orderId, total_cents: order.totalCents }, order.orderId);
  return { channel, token, order };
}

export async function publishOrderEvent(client: InfraiClient, channel: string, event: string, data: Record<string, unknown>, orderId: string): Promise<void> {
  await client.request("/v1/realtime/publish", { channel, event, data, account_id: orderId }, "POST", `event-${orderId}-${event}`);
}

export async function readPresence(client: InfraiClient, channel: string): Promise<unknown> {
  return client.request(`/v1/realtime/presence/get/${encodeURIComponent(channel)}`, undefined, "GET");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const order = { orderId: "demo-42", customerId: "customer-7", totalCents: 12900 };
  const session = await startOrderSession(order);
  console.log(JSON.stringify({ channel: session.channel, order: session.order }));
}
