import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { settingsSchema } from "@/lib/settings/schema";
import { getPublicSettings, upsertSettings } from "@/lib/settings/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getPublicSettings();
    return NextResponse.json({ ok: true, settings }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const payload = settingsSchema.parse(body);
    const settings = await upsertSettings(payload);

    return NextResponse.json({ ok: true, settings }, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: "Invalid settings payload", issues: error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
