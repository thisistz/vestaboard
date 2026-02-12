import { NextResponse } from "next/server";
import { getMissingCronEnvVars, getMissingServerEnvVars } from "@/lib/security/setup-check";

export const dynamic = "force-dynamic";

export async function GET() {
  const missing = [...getMissingServerEnvVars(), ...getMissingCronEnvVars()];

  return NextResponse.json(
    {
      ok: missing.length === 0,
      service: "vestaboard-quotes-sender",
      timestamp: new Date().toISOString(),
      setup: {
        complete: missing.length === 0,
        missing
      }
    },
    { status: 200 }
  );
}
