import { NextResponse } from "next/server";
import { getMissingServerEnvVars, getSetupResponse } from "@/lib/security/setup-check";
import { listDeliveryLogs } from "@/lib/settings/service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const missing = getMissingServerEnvVars();
  if (missing.length > 0) return getSetupResponse(missing);

  try {
    const url = new URL(req.url);
    const limitRaw = url.searchParams.get("limit");
    const limit = Number(limitRaw ?? "50");

    const items = await listDeliveryLogs(Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 200) : 50);
    return NextResponse.json({ ok: true, items }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}
