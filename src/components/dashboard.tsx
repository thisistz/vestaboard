"use client";

import { useEffect, useMemo, useState } from "react";
import type { PublicSettings } from "@/types/settings";
import type { QuoteMode } from "@/types/quotes";

type DeliveryLogItem = {
  id: string;
  mode: QuoteMode;
  quoteText: string;
  status: "SUCCESS" | "FAILURE";
  error: string | null;
  sentAt: string;
  board: { name: string };
};

type FormState = {
  boardName: string;
  apiKey: string;
  apiSecret: string;
  mode: QuoteMode;
  intervalMinutes: number;
  timezone: string;
  active: boolean;
};

type ApiErrorPayload = {
  ok: false;
  error?: string;
  setupRequired?: boolean;
  missing?: string[];
};

const initialForm: FormState = {
  boardName: "My Vestaboard",
  apiKey: "",
  apiSecret: "",
  mode: "DAILYSCRIPT",
  intervalMinutes: 60,
  timezone: "America/Los_Angeles",
  active: true
};

function toForm(settings: PublicSettings | null): FormState {
  if (!settings) return initialForm;
  return {
    boardName: settings.boardName,
    apiKey: "",
    apiSecret: "",
    mode: settings.mode,
    intervalMinutes: settings.intervalMinutes,
    timezone: settings.timezone,
    active: settings.active
  };
}

function formatTime(value: string): string {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function toApiErrorMessage(data: ApiErrorPayload, fallback: string): string {
  if (data.setupRequired && Array.isArray(data.missing) && data.missing.length > 0) {
    return `Setup required: missing ${data.missing.join(", ")} in Vercel environment variables.`;
  }
  return data.error ?? fallback;
}

export function Dashboard() {
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [logs, setLogs] = useState<DeliveryLogItem[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const activeModeLabel = useMemo(() => {
    return form.mode === "DAILYSCRIPT" ? "DailyScript" : "Rick & Morty";
  }, [form.mode]);

  async function refreshAll() {
    setLoading(true);
    setError("");

    try {
      const [settingsRes, logsRes] = await Promise.all([
        fetch("/api/settings", { cache: "no-store" }),
        fetch("/api/logs?limit=15", { cache: "no-store" })
      ]);

      const settingsData = (await settingsRes.json()) as {
        ok: boolean;
        settings: PublicSettings | null;
        error?: string;
        setupRequired?: boolean;
        missing?: string[];
      };

      const logsData = (await logsRes.json()) as {
        ok: boolean;
        items: DeliveryLogItem[];
        error?: string;
        setupRequired?: boolean;
        missing?: string[];
      };

      if (!settingsData.ok) {
        throw new Error(toApiErrorMessage(settingsData as ApiErrorPayload, "Failed to load settings."));
      }

      if (!logsData.ok) {
        throw new Error(toApiErrorMessage(logsData as ApiErrorPayload, "Failed to load logs."));
      }

      setSettings(settingsData.settings);
      setForm(toForm(settingsData.settings));
      setLogs(logsData.items ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        ...form,
        apiKey: form.apiKey.trim() === "" ? undefined : form.apiKey.trim(),
        apiSecret: form.apiSecret
      };

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = (await res.json()) as {
        ok: boolean;
        settings?: PublicSettings;
        error?: string;
        setupRequired?: boolean;
        missing?: string[];
      };

      if (!data.ok || !data.settings) {
        throw new Error(toApiErrorMessage(data as ApiErrorPayload, "Failed to save settings."));
      }

      setSettings(data.settings);
      setForm(toForm(data.settings));
      setMessage("Settings saved.");
      await refreshLogs();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function refreshLogs() {
    try {
      const res = await fetch("/api/logs?limit=15", { cache: "no-store" });
      const data = (await res.json()) as {
        ok: boolean;
        items: DeliveryLogItem[];
        error?: string;
        setupRequired?: boolean;
        missing?: string[];
      };
      if (!data.ok) {
        throw new Error(toApiErrorMessage(data as ApiErrorPayload, "Failed to fetch logs."));
      }
      setLogs(data.items ?? []);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function sendTest() {
    setSending(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: form.mode })
      });

      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        quote?: { text: string };
        setupRequired?: boolean;
        missing?: string[];
      };

      if (!data.ok) {
        throw new Error(toApiErrorMessage(data as ApiErrorPayload, "Test send failed."));
      }

      setMessage(`Sent ${activeModeLabel} quote: ${data.quote?.text ?? "(no text)"}`);
      await refreshLogs();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    void refreshAll();
  }, []);

  return (
    <main className="container">
      <section className="hero">
        <h1>Vestaboard Quote MVP</h1>
        <p>
          Configure quote source and interval, then let Vercel cron deliver messages automatically.
        </p>
      </section>

      <section className="panel">
        <h2>Board Settings</h2>
        <div className="form-grid">
          <label>
            Board Name
            <input
              value={form.boardName}
              onChange={(event) => setForm((prev) => ({ ...prev, boardName: event.target.value }))}
              placeholder="Living Room Board"
            />
          </label>

          <label>
            Mode
            <select
              value={form.mode}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, mode: event.target.value as QuoteMode }))
              }
            >
              <option value="DAILYSCRIPT">DailyScript</option>
              <option value="RICK_MORTY">Rick &amp; Morty</option>
            </select>
          </label>

          <label>
            Interval Minutes
            <input
              type="number"
              min={1}
              max={1440}
              value={form.intervalMinutes}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  intervalMinutes: Number(event.target.value || "1")
                }))
              }
            />
          </label>

          <label>
            Timezone
            <input
              value={form.timezone}
              onChange={(event) => setForm((prev) => ({ ...prev, timezone: event.target.value }))}
              placeholder="America/Los_Angeles"
            />
          </label>

          <label>
            Vestaboard Read/Write Key
            <input
              value={form.apiKey}
              onChange={(event) => setForm((prev) => ({ ...prev, apiKey: event.target.value }))}
              placeholder={settings ? `Current: ${settings.apiKeyMasked}` : "rw key"}
            />
          </label>

          <label>
            API Secret (optional)
            <input
              value={form.apiSecret}
              onChange={(event) => setForm((prev) => ({ ...prev, apiSecret: event.target.value }))}
              placeholder={settings?.hasApiSecret ? "Stored (enter new to replace)" : "optional"}
            />
          </label>
        </div>

        <label className="toggle">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))}
          />
          Active schedule
        </label>

        <div className="actions">
          <button type="button" onClick={() => void saveSettings()} disabled={saving || loading}>
            {saving ? "Saving..." : "Save Settings"}
          </button>
          <button type="button" onClick={() => void sendTest()} disabled={sending || loading}>
            {sending ? "Sending..." : "Send Test Quote"}
          </button>
          <button type="button" onClick={() => void refreshAll()} disabled={loading}>
            Refresh
          </button>
        </div>

        {loading && <p className="status">Loading...</p>}
        {message && <p className="status ok">{message}</p>}
        {error && <p className="status err">{error}</p>}
      </section>

      <section className="panel">
        <h2>Recent Deliveries</h2>
        {logs.length === 0 ? (
          <p>No deliveries yet.</p>
        ) : (
          <div className="logs">
            {logs.map((item) => (
              <article className="log" key={item.id}>
                <div className="log-head">
                  <strong>{item.status}</strong>
                  <span>{item.mode}</span>
                  <span>{formatTime(item.sentAt)}</span>
                </div>
                <p>{item.quoteText || "(empty quote)"}</p>
                {item.error && <p className="err">{item.error}</p>}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
