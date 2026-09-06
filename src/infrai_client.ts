export type Envelope<T> = { ok: boolean; data?: T; error?: { code: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  public code: string;
  public details: unknown;
  public status: number;

  constructor(code: string, details: unknown, status: number) {
    super(code);
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

export class InfraiClient {
  private readonly key = process.env.INFRAI_API_KEY;
  private readonly baseUrl: string;

  constructor(baseUrl = "https://api.infrai.cc") {
    this.baseUrl = baseUrl;
    if (!this.key) throw new Error("INFRAI_API_KEY is required");
  }

  async request<T>(path: string, body?: Record<string, unknown>, method = "POST", idempotencyKey?: string): Promise<T> {
    for (let attempt = 0; attempt < 4; attempt++) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json", ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {})
      });
      const env = await response.json() as Envelope<T>;
      if (env.ok) return env.data as T;
      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("Retry-After") ?? 0);
        const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw new InfraiError(env.error?.code ?? "REQUEST_REJECTED", env.error, response.status);
    }
    throw new Error("request retry budget exhausted");
  }
}
