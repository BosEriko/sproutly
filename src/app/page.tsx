"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { User } from "firebase/auth";
import { Alert, Button, Popconfirm } from "antd";
import { Bath, Droplet, Milk, Sun, X, type LucideIcon } from "lucide-react";
import { AuthGate } from "@/components/AuthGate";
import { BabyCard } from "@/components/BabyCard";
import { BabyDrawer } from "@/components/BabyDrawer";
import { BathCard } from "@/components/BathCard";
import { BottleCard } from "@/components/BottleCard";
import { DiaperCard } from "@/components/DiaperCard";
import { DinoLoader } from "@/components/DinoLoader";
import { END_ICONS } from "@/components/icons";
import { InstallPrompt } from "@/components/InstallPrompt";
import { Logo } from "@/components/Logo";
import { NextFeedingCard } from "@/components/NextFeedingCard";
import { PenCircle } from "@/components/PenCircle";
import { SunlightCard } from "@/components/SunlightCard";
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

type Tab = "milk" | "diaper" | "bath" | "sunlight";

const TABS: { value: Tab; label: string; icon: LucideIcon; color: string; tilt: number }[] = [
  { value: "milk", label: "Milk", icon: Milk, color: "var(--sticky-mint)", tilt: -1 },
  { value: "diaper", label: "Diaper", icon: Droplet, color: "var(--sticky-blue)", tilt: 0.8 },
  { value: "bath", label: "Bath", icon: Bath, color: "var(--sticky-lavender)", tilt: -0.6 },
  { value: "sunlight", label: "Sunlight", icon: Sun, color: "var(--sticky-sun)", tilt: 1 },
];

const TAB_KEY = "sproutly:tab";

function useTab() {
  const [tab, setTab] = useState<Tab>("milk");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(TAB_KEY);
      if (TABS.some((t) => t.value === saved)) setTab(saved as Tab);
    } catch {}
  }, []);
  const choose = (next: Tab) => {
    setTab(next);
    try {
      localStorage.setItem(TAB_KEY, next);
    } catch {}
  };
  return [tab, choose] as const;
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
  const [tab, setTab] = useTab();

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
      <header>
        <h1>
          <Logo size={40} />
        </h1>
      </header>

      {profile !== undefined && (
        <BabyCard profile={profile} now={now} onEdit={() => setEditingProfile(true)} />
      )}

      <nav className="grid grid-cols-4 gap-2" aria-label="Sections">
        {TABS.map(({ value, label, icon: Icon, color, tilt }) => (
          <div key={value} className="relative" style={{ rotate: `${tilt}deg` }}>
            <Button
              type="primary"
              block
              aria-pressed={tab === value}
              icon={<Icon size={20} aria-hidden />}
              onClick={() => setTab(value)}
              className={`sticky h-16! flex-col! gap-0! font-hand text-xl! ${tab === value ? "sticky-active" : "sticky-idle"}`}
              style={{ "--sticky": color } as CSSProperties}
            >
              {label}
            </Button>
            {tab === value && <PenCircle key={value} />}
          </div>
        ))}
      </nav>

      {error && <Alert type="error" title={error} showIcon />}

      {tab === "milk" && (
        <>
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
        </>
      )}

      {tab === "diaper" && <DiaperCard user={user} now={now} />}
      {tab === "bath" && <BathCard user={user} now={now} />}
      {tab === "sunlight" && <SunlightCard user={user} now={now} />}

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
