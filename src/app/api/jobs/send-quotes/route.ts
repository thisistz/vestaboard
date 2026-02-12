import { NextResponse } from "next/server";
import { env } from "@/lib/security/env";
import {
  getMissingCronEnvVars,
  getMissingServerEnvVars,
  getSetupResponse
} from "@/lib/security/setup-check";
import { sendDueQuotes } from "@/lib/scheduler/send-due-quotes";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const missing = [...getMissingServerEnvVars(), ...getMissingCronEnvVars()];
  if (missing.length > 0) return getSetupResponse(missing);

  const expectedSecret = env.cronSecret;

  if (expectedSecret) {
    const providedSecret = req.headers.get("x-cron-secret");
    if (providedSecret !== expectedSecret) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await sendDueQuotes();
    return NextResponse.json({ ok: true, result }, { status: 200 });
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
