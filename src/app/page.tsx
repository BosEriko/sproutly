"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { User } from "firebase/auth";
import { Alert, Button, Popconfirm } from "antd";
import { Milk, Sprout, X } from "lucide-react";
import { AuthGate } from "@/components/AuthGate";
import { BabyCard } from "@/components/BabyCard";
import { BabyDrawer } from "@/components/BabyDrawer";
import { BottleCard } from "@/components/BottleCard";
import { DiaperCard } from "@/components/DiaperCard";
import { DinoLoader } from "@/components/DinoLoader";
import { END_ICONS } from "@/components/icons";
import { InstallPrompt } from "@/components/InstallPrompt";
import { NextFeedingCard } from "@/components/NextFeedingCard";
import type { BabyProfile } from "@/lib/baby";
import { createBottle, deleteDiscardedBottle, subscribeBottles, updateBottle, type Bottle } from "@/lib/bottles";
import { notifyDiscord } from "@/lib/notify";
import { subscribeProfile } from "@/lib/profile";
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
  const [profile, setProfile] = useState<BabyProfile | null | undefined>(undefined);
  const [editingProfile, setEditingProfile] = useState(false);

  useEffect(
    () => subscribeBottles(setBottles, (e) => setError(e.message)),
    [],
  );

  useEffect(
    () => subscribeProfile(setProfile, (e) => setError(e.message)),
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
      await notifyDiscord(user, id);
    });

  const handleAction = (id: string, action: Action) =>
    run(async () => {
      await updateBottle(id, action, user);
      await notifyDiscord(user, id);
    });

  const handleDelete = (id: string) => run(() => deleteDiscardedBottle(id, user));

  const active = bottles?.filter((b) => b.status !== "done") ?? [];
  const history = bottles?.filter((b) => b.status === "done").slice(0, 10) ?? [];

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 px-4 pt-6 pb-[calc(3rem+env(safe-area-inset-bottom))]">
      <header className="flex items-center gap-2 text-accent">
        <Sprout size={30} strokeWidth={2.25} aria-hidden />
        <h1 className="font-hand text-4xl font-bold">Sproutly</h1>
      </header>

      {profile !== undefined && (
        <BabyCard profile={profile} now={now} onEdit={() => setEditingProfile(true)} />
      )}

      <Button
        type="primary"
        size="large"
        block
        loading={busy}
        icon={<Milk size={30} aria-hidden />}
        onClick={handleMade}
        className="sticky h-24! rotate-[-0.6deg] font-hand text-4xl!"
        style={{ "--sticky": "var(--sticky-mint)" } as CSSProperties}
      >
        Made milk
      </Button>

      {error && <Alert type="error" title={error} showIcon />}

      {bottles === null ? (
        <DinoLoader label="Finding bottles…" />
      ) : active.length === 0 ? (
        profile !== undefined && <NextFeedingCard profile={profile} bottles={bottles} now={now} />
      ) : (
        <section className="flex flex-col gap-8 pt-2">
          {active.map((b, i) => (
            <BottleCard
              key={b.id}
              bottle={b}
              now={now}
              busy={busy}
              tilt={i % 2 === 0 ? -0.8 : 0.8}
              onAction={(a) => handleAction(b.id, a)}
            />
          ))}
        </section>
      )}

      <DiaperCard user={user} now={now} />

      {history.length > 0 && (
        <section className="paper mt-2 -rotate-[0.5deg] rounded-sm px-5 pt-8 pb-3">
          <span className="tape" />
          <h2 className="font-hand text-3xl font-bold leading-[44px]">Recent</h2>
          <ul className="divide-y divide-line">
            {history.map((b) => {
              const last = b.events[b.events.length - 1];
              const discarded = b.endReason === "discarded";
              const EndIcon = END_ICONS[discarded ? "discarded" : "finished"];
              return (
                <li key={b.id} className="flex h-11 items-center justify-between text-sm">
                  <span>Made {formatDateTime(b.madeAt)}</span>
                  <span className={`flex items-center gap-1 ${discarded ? "text-danger" : "text-muted"}`}>
                    {discarded && (
                      <Popconfirm
                        title="Delete this bottle?"
                        description="This also removes its Discord card."
                        okText="Delete"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => handleDelete(b.id)}
                      >
                        <Button
                          type="text"
                          size="small"
                          shape="circle"
                          disabled={busy}
                          aria-label="Delete discarded bottle"
                          icon={<X size={14} aria-hidden />}
                        />
                      </Popconfirm>
                    )}
                    <EndIcon size={14} aria-hidden />
                    {discarded ? "Discarded" : "Finished"}
                    {last ? ` · ${new Date(last.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      <BabyDrawer open={editingProfile} profile={profile ?? null} onClose={() => setEditingProfile(false)} />
    </main>
  );
}

export default function Home() {
  return (
    <>
      <AuthGate>{(user) => <Tracker user={user} />}</AuthGate>
      <InstallPrompt />
    </>
  );
}
