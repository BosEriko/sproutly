"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import type { User } from "firebase/auth";
import { Alert, Button } from "antd";
import { Bath, CalendarDays, Droplet, Maximize, Milk, Sun, type LucideIcon } from "lucide-react";
import { AlarmPopup, type Alarm } from "@/components/AlarmPopup";
import { AuthGate } from "@/components/AuthGate";
import { BabyCard } from "@/components/BabyCard";
import { BabyDrawer } from "@/components/BabyDrawer";
import { BathCard } from "@/components/BathCard";
import { BottleCard, formatCountdown } from "@/components/BottleCard";
import { BottleEditDialog } from "@/components/BottleEditDialog";
import { BurpCard } from "@/components/BurpCard";
import { DiaperCard } from "@/components/DiaperCard";
import { DayChart, type DayEntry } from "@/components/DayChart";
import { DinoLoader } from "@/components/DinoLoader";
import { EntryMenu } from "@/components/EntryMenu";
import { FinishDialog } from "@/components/FinishDialog";
import { enterFullscreen, FullscreenView } from "@/components/FullscreenView";
import { Facts, HistoryItem, RecentCard } from "@/components/History";
import { END_ICONS } from "@/components/icons";
import { InstallPrompt } from "@/components/InstallPrompt";
import { Logo } from "@/components/Logo";
import { formatDuration, NextFeedingCard } from "@/components/NextFeedingCard";
import { PenCircle } from "@/components/PenCircle";
import { SunlightCard } from "@/components/SunlightCard";
import { TimeDotChart, type TimeDot } from "@/components/TimeDotChart";
import { Trends } from "@/components/Trends";
import { ageInDays, type BabyProfile } from "@/lib/baby";
import {
  createBottle,
  deleteDoneBottle,
  subscribeBottles,
  editDoneBottle,
  updateBottle,
  type Bottle,
} from "@/lib/bottles";
import type { BottleEdit } from "@/lib/bottleEdit";
import { recentDayKeys, totalsByDay } from "@/lib/days";
import {
  averageIntake,
  burpEndsAt,
  fedAt,
  feedingDuration,
  feedingRhythm,
  finishedTitle,
  idealFeedMl,
  nextFeedingWindow,
  RHYTHM_DAYS,
} from "@/lib/feeding";
import { HANDHELD } from "@/lib/install-prompt";
import { notifyDiscord } from "@/lib/notify";
import { subscribeProfile } from "@/lib/profile";
import { isExpired, type Action } from "@/lib/spoil";
import { dateKey } from "@/lib/sunlight";
import { hourlyLikelihood, inLastWeek, perDay } from "@/lib/trends";
import { useMediaQuery } from "@/lib/use-media-query";

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

const APP_TITLE = "Sproutly";

function countdownTitle(bottles: Bottle[] | null, profile: BabyProfile | null | undefined, now: number) {
  if (!bottles) return APP_TITLE;
  const active = bottles.filter((b) => b.status !== "done");
  if (active.length > 0) {
    const spoilsAt = active
      .filter((b) => !isExpired(b, now) && b.spoilsAt !== null)
      .map((b) => b.spoilsAt!)
      .sort((a, b) => a - b)[0];
    if (spoilsAt !== undefined) return `🍼 Spoils in ${formatCountdown(spoilsAt - now)} · ${APP_TITLE}`;
    return `🍼 Spoiled · ${APP_TITLE}`;
  }
  const next = nextFeedingWindow(bottles, profile?.birthday ? ageInDays(profile.birthday, new Date(now)) : null, now);
  if (!next) return APP_TITLE;
  if (now < next.from) return `🍼 Feed in ${formatCountdown(next.from - now)} · ${APP_TITLE}`;
  if (now < next.to) return `🍼 Feed any time now · ${APP_TITLE}`;
  return `🍼 Feed due now · ${APP_TITLE}`;
}

function dueAlarms(bottles: Bottle[] | null, profile: BabyProfile | null | undefined, now: number): Alarm[] {
  if (!bottles) return [];
  const active = bottles.filter((b) => b.status !== "done");
  if (active.length > 0) {
    return active
      .filter((b) => isExpired(b, now))
      .map((b) => ({
        key: `spoiled:${b.id}`,
        title: "Bottle spoiled",
        detail: `The bottle made at ${formatTime(b.madeAt)} has spoiled. Time to discard it.`,
        sound: "urgent" as const,
      }));
  }
  const next = nextFeedingWindow(bottles, profile?.birthday ? ageInDays(profile.birthday, new Date(now)) : null, now);
  if (!next || now < next.from) return [];
  return [
    {
      key: `feed:${next.from}`,
      title: "Feeding time",
      detail: `${profile?.name || "Your baby"} is likely hungry around ${formatTime(next.from)}–${formatTime(next.to)}.`,
      sound: "gentle",
    },
  ];
}

function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
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
  const [finishing, setFinishing] = useState<string | null>(null);
  const [picked, setPicked] = useState<Bottle | null>(null);
  const [historyMode, setHistoryMode] = useState<"menu" | "edit" | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const exitFullscreen = useCallback(() => setFullscreen(false), []);
  const handheld = useMediaQuery(HANDHELD, true);

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

  const handleAction = (id: string, action: Action) => {
    if (action === "finish") {
      setFinishing(id);
      return;
    }
    return run(async () => {
      await updateBottle(id, action, user);
      await notifyDiscord(user, id);
    });
  };

  const handleFinish = (amountMl: number) => {
    const id = finishing;
    setFinishing(null);
    if (!id) return;
    return run(async () => {
      await updateBottle(id, "finish", user, { amountMl });
      await notifyDiscord(user, id);
    });
  };

  const suggestedMl = idealFeedMl(
    profile?.birthday ? ageInDays(profile.birthday, new Date(now)) : null,
    profile?.weightKg ?? null,
  );

  const title = countdownTitle(bottles, profile, now);
  useEffect(() => {
    document.title = title;
  }, [title]);
  useEffect(
    () => () => {
      document.title = APP_TITLE;
    },
    [],
  );

  const closeHistory = () => {
    setHistoryMode(null);
    setPicked(null);
  };

  const handleEditBottle = (edit: BottleEdit & { amountMl?: number }) => {
    const bottle = picked;
    closeHistory();
    if (!bottle) return;
    return run(async () => {
      await editDoneBottle(bottle.id, edit, user);
      await notifyDiscord(user, bottle.id);
    });
  };

  const active = bottles?.filter((b) => b.status !== "done") ?? [];
  const burpUntil = bottles ? burpEndsAt(bottles, now) : null;
  const history = bottles?.filter((b) => b.status === "done").slice(0, 20) ?? [];
  const intake = bottles ? averageIntake(bottles, now) : null;
  const chartDays = recentDayKeys(now);
  const mlPerDay = totalsByDay(
    bottles ?? [],
    chartDays,
    (b) => {
      const finish = b.events.find((e) => e.type === "finish");
      return b.amountMl && finish ? dateKey(finish.at) : null;
    },
    (b) => b.amountMl ?? 0,
  );
  const feedTimes = (bottles ?? []).map(fedAt).filter((at): at is number => at !== null);
  const feedDots = (bottles ?? []).flatMap((b): TimeDot[] => {
    const at = fedAt(b) ?? b.events.find((e) => e.type === "discard")?.at;
    if (at === undefined) return [];
    const discarded = b.endReason === "discarded";
    const detail = discarded ? "Discarded" : b.amountMl ? `${b.amountMl}ml` : b.status === "done" ? "Finished" : "Feeding";
    return [
      {
        at,
        color: discarded ? "var(--sticky-pink)" : "var(--sticky-mint)",
        label: `${formatDateTime(at)} · ${detail}`,
        value: !discarded && b.amountMl ? String(b.amountMl) : undefined,
      },
    ];
  });
  const rhythm = bottles ? feedingRhythm(bottles, now) : null;
  const weekDurations = (bottles ?? [])
    .filter((b) => {
      const at = fedAt(b);
      return at !== null && inLastWeek(at, now);
    })
    .map(feedingDuration)
    .filter((d): d is number => d !== null);

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 px-4 pt-6 pb-[calc(3rem+env(safe-area-inset-bottom))]">
      <header className="relative">
        <h1>
          <Logo size={40} />
        </h1>
        {!handheld && (
          <div className="absolute inset-y-0 right-0 flex items-center" style={{ rotate: "3deg" }}>
            <Button
              type="primary"
              aria-label="Full screen"
              title="Full screen"
              icon={<Maximize size={18} aria-hidden />}
              onClick={() => {
                enterFullscreen();
                setFullscreen(true);
              }}
              className="sticky size-11!"
              style={{ "--sticky": "var(--sticky-yellow)" } as CSSProperties}
            />
          </div>
        )}
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
            disabled={bottles === null || active.length > 0}
            icon={<Milk size={30} aria-hidden />}
            onClick={handleMade}
            className="sticky h-24! rotate-[-0.6deg] font-hand text-4xl!"
            style={{ "--sticky": "var(--sticky-mint)" } as CSSProperties}
          >
            Made milk
          </Button>

          {burpUntil !== null && <BurpCard endsAt={burpUntil} now={now} />}

          {bottles === null ? (
            <DinoLoader label="Finding bottles…" />
          ) : active.length === 0 ? (
            profile !== undefined && burpUntil === null && <NextFeedingCard profile={profile} bottles={bottles} now={now} />
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

          {bottles !== null && (
            <RecentCard
              tape="var(--tape-neutral)"
              color="var(--sticky-mint)"
              tilt={-0.5}
              aside={
                intake && (
                  <Facts
                    items={[
                      { icon: <CalendarDays size={13} />, text: `${intake.perDay}ml/day`, label: `Average per day, last ${RHYTHM_DAYS} days` },
                      { icon: <Milk size={13} />, text: `${intake.perFeed}ml/feed`, label: `Average per feed, last ${RHYTHM_DAYS} days` },
                    ]}
                  />
                )
              }
              empty="No finished bottles yet"
              graph={
                <DayChart
                  days={chartDays}
                  today={dateKey(now)}
                  unit="ml"
                  series={[{ label: "Milk", color: "var(--sticky-mint)", values: mlPerDay }]}
                  entries={feedDots.map((d): DayEntry => ({ ...d, tag: d.value ? `${d.value}ml` : undefined }))}
                  times={
                    <TimeDotChart
                      days={chartDays}
                      today={dateKey(now)}
                      dots={feedDots}
                      legend={[
                        { label: "Fed", color: "var(--sticky-mint)" },
                        { label: "Discarded", color: "var(--sticky-pink)" },
                      ]}
                    />
                  }
                />
              }
              trends={
                <Trends
                  stats={[
                    { label: "Feeds/day", value: String(perDay(feedTimes.filter((at) => inLastWeek(at, now)).length)) },
                    {
                      label: "Usual gap",
                      value: rhythm ? `${formatDuration(rhythm.minGap)}–${formatDuration(rhythm.maxGap)}` : "—",
                    },
                    {
                      label: "Feed length",
                      value: weekDurations.length
                        ? formatDuration(weekDurations.reduce((sum, d) => sum + d, 0) / weekDurations.length)
                        : "—",
                    },
                  ]}
                  hours={[{ label: "Feedings", color: "var(--sticky-mint)", likelihood: hourlyLikelihood(feedTimes, now) }]}
                />
              }
            >
              {history.map((b) => {
                const last = b.events[b.events.length - 1];
                const discarded = b.endReason === "discarded";
                const EndIcon = END_ICONS[discarded ? "discarded" : "finished"];
                const duration = feedingDuration(b);
                return (
                  <HistoryItem
                    key={b.id}
                    icon={<EndIcon size={15} />}
                    title={discarded ? "Discarded" : finishedTitle(b.amountMl, duration)}
                    facts={[{ icon: <Milk size={12} />, text: formatDateTime(b.madeAt), label: "Made" }]}
                    meta={last ? formatTime(last.at) : undefined}
                    color={discarded ? "var(--sticky-pink)" : "var(--sticky-mint)"}
                    danger={discarded}
                    label={`Bottle made ${formatDateTime(b.madeAt)}, ${discarded ? "discarded" : "finished"}`}
                    onHold={() => {
                      setPicked(b);
                      setHistoryMode("menu");
                    }}
                  />
                );
              })}
            </RecentCard>
          )}
        </>
      )}

      {tab === "diaper" && <DiaperCard user={user} now={now} />}
      {tab === "bath" && <BathCard user={user} now={now} />}
      {tab === "sunlight" && <SunlightCard user={user} now={now} />}

      <FinishDialog
        open={finishing !== null}
        name={profile?.name || "your baby"}
        suggestedMl={suggestedMl}
        onCancel={() => setFinishing(null)}
        onConfirm={handleFinish}
      />

      <EntryMenu
        open={historyMode === "menu"}
        title={picked ? `Bottle · ${formatDateTime(picked.madeAt)}` : ""}
        onClose={closeHistory}
        onEdit={() => setHistoryMode("edit")}
        onDelete={() => (picked ? run(() => deleteDoneBottle(picked.id, user)) : Promise.resolve())}
      />

      <BottleEditDialog
        open={historyMode === "edit"}
        bottle={picked}
        suggestedMl={suggestedMl}
        saving={busy}
        onCancel={closeHistory}
        onSave={handleEditBottle}
      />

      {fullscreen && (
        <FullscreenView
          bottles={bottles}
          profile={profile}
          now={now}
          busy={busy}
          onMade={handleMade}
          onAction={handleAction}
          onExit={exitFullscreen}
        />
      )}

      <AlarmPopup alarms={dueAlarms(bottles, profile, now)} />

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
