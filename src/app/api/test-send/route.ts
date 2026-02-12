import { NextResponse } from "next/server";
import { getQuoteProvider } from "@/lib/providers";
import { getMissingServerEnvVars, getSetupResponse } from "@/lib/security/setup-check";
import { testSendSchema } from "@/lib/settings/schema";
import {
  getAllActiveRuntimeConfigs,
  getRuntimeBoardConfigByBoardId,
  insertDeliveryLog,
  updateLastSendState
} from "@/lib/settings/service";
import { sendVestaboardMessage } from "@/lib/vestaboard/client";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const missing = getMissingServerEnvVars();
  if (missing.length > 0) return getSetupResponse(missing);

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = testSendSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid payload." }, { status: 400 });
    }

    const configs = await getAllActiveRuntimeConfigs();
    if (configs.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No active board settings found. Save settings first." },
        { status: 404 }
      );
    }

    const selected =
      parsed.data.mode !== undefined
        ? configs.find((cfg) => cfg.mode === parsed.data.mode) ?? configs[0]
        : configs[0];

    const fresh = await getRuntimeBoardConfigByBoardId(selected.boardId);
    if (!fresh) {
      return NextResponse.json({ ok: false, error: "Board settings unavailable." }, { status: 404 });
    }

    const provider = getQuoteProvider(parsed.data.mode ?? fresh.mode);
    const quote = await provider.getNextQuote(fresh.lastQuoteRef ?? undefined);

    await sendVestaboardMessage(fresh.credentials, quote.text);
    await updateLastSendState(fresh.boardId, new Date(), quote.ref);

    await insertDeliveryLog({
      boardId: fresh.boardId,
      mode: provider.mode,
      quoteText: quote.text,
      quoteRef: quote.ref,
      status: "SUCCESS"
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Quote delivered to Vestaboard.",
        quote
      },
      { status: 200 }
    );
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
