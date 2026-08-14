type PublishInput = {
  channel: string;
  event: string;
  data: unknown;
  ephemeral?: boolean;
};

function shouldSkipPublish(base: string): boolean {
  try {
    const host = new URL(base).hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return process.env.NODE_ENV === "production";
    }
    return false;
  } catch {
    return true;
  }
}

export async function publishRealtime(input: PublishInput): Promise<void> {
  const base = process.env.REALTIME_INTERNAL_URL;
  const secret =
    process.env.REALTIME_INTERNAL_SECRET ?? process.env.REALTIME_JWT_SECRET;
  if (!base || !secret || shouldSkipPublish(base)) return;

  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/internal/publish`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${secret}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(800),
    });
    if (!res.ok) {
      console.error("realtime publish failed", res.status);
    }
  } catch (error) {
    console.error("realtime publish error", error);
  }
}
