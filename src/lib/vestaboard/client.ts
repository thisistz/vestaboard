export type VestaboardCredentials = {
  apiKey: string;
  apiSecret?: string;
};

const RW_ENDPOINT = "https://rw.vestaboard.com/";

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function normalizeMessage(message: string): string {
  return message.replace(/\s+/g, " ").trim().slice(0, 500);
}

export async function sendVestaboardMessage(
  credentials: VestaboardCredentials,
  message: string
): Promise<{ ok: true }> {
  const payload = {
    text: normalizeMessage(message)
  };

  const errors: string[] = [];
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const res = await fetch(RW_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Vestaboard-Read-Write-Key": credentials.apiKey
        },
        body: JSON.stringify(payload),
        cache: "no-store"
      });

      if (res.ok) {
        return { ok: true };
      }

      const responseText = await res.text();
      errors.push(`Attempt ${attempt}: ${res.status} ${responseText}`);
    } catch (error) {
      errors.push(`Attempt ${attempt}: ${(error as Error).message}`);
    }

    if (attempt < maxAttempts) {
      await wait(attempt * 400);
    }
  }

  throw new Error(`Vestaboard delivery failed. ${errors.join(" | ")}`);
}
