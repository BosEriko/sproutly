"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { AuthGate } from "@/components/AuthGate";
import { BottleCard } from "@/components/BottleCard";
import { createBottle, subscribeBottles, updateBottle, type Bottle } from "@/lib/bottles";
import { notifyDiscord } from "@/lib/notify";
import type { Action } from "@/lib/spoil";

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function formatDateTime(ms: number) {
  return new Date(ms).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function Tracker({ user }: { user: User }) {
  const now = useNow();
  const [bottles, setBottles] = useState<Bottle[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () => subscribeBottles(setBottles, (e) => setError(e.message)),
    [],
  );

  async function run(task: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const handleMade = () =>
    run(async () => {
      const id = await createBottle(user);
      void notifyDiscord(user, id, "made");
    });

  const handleAction = (id: string, action: Action) =>
    run(async () => {
      await updateBottle(id, action, user);
      void notifyDiscord(user, id, action);
    });

  const active = bottles?.filter((b) => b.status !== "done") ?? [];
  const history = bottles?.filter((b) => b.status === "done").slice(0, 10) ?? [];

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-5 px-4 pt-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🌱 Sproutly</h1>
      </header>

      <button
        onClick={handleMade}
        disabled={busy}
        className="rounded-3xl bg-accent px-6 py-8 text-2xl font-bold text-white shadow-lg active:scale-[0.98] disabled:opacity-50"
      >
        🍼 Made milk
      </button>

      {error && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-500">{error}</p>}

      {bottles === null ? (
        <p className="text-center text-muted">Loading bottles…</p>
      ) : active.length === 0 ? (
        <p className="text-center text-muted">No active bottles.</p>
      ) : (
        <section className="flex flex-col gap-4">
          {active.map((b) => (
            <BottleCard key={b.id} bottle={b} now={now} busy={busy} onAction={(a) => handleAction(b.id, a)} />
          ))}
        </section>
      )}

      {history.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Recent</h2>
          <ul className="divide-y divide-line rounded-2xl border border-line bg-card">
            {history.map((b) => {
              const last = b.events[b.events.length - 1];
              return (
                <li key={b.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span>Made {formatDateTime(b.madeAt)}</span>
                  <span className="text-muted">
                    {b.endReason === "discarded" ? "🗑️ Discarded" : "✅ Finished"}
                    {last ? ` · ${new Date(last.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}

export default function Home() {
  return <AuthGate>{(user) => <Tracker user={user} />}</AuthGate>;
}
