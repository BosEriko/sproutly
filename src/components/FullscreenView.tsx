"use client";

import { useEffect, type ReactNode } from "react";
import { Button } from "antd";
import { Minimize } from "lucide-react";

export function enterFullscreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
}

function useWakeLock() {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    let released = false;
    const request = () => {
      if (document.visibilityState !== "visible" || !("wakeLock" in navigator)) return;
      navigator.wakeLock
        .request("screen")
        .then((sentinel) => {
          if (released) void sentinel.release();
          else lock = sentinel;
        })
        .catch(() => {});
    };
    request();
    document.addEventListener("visibilitychange", request);
    return () => {
      released = true;
      document.removeEventListener("visibilitychange", request);
      void lock?.release();
    };
  }, []);
}

function formatClock(ms: number) {
  return new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDay(ms: number) {
  return new Date(ms).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}

export function FullscreenView({ now, onExit, children }: { now: number; onExit: () => void; children: ReactNode }) {
  useWakeLock();

  useEffect(() => {
    let entered = false;
    const onChange = () => {
      if (document.fullscreenElement) entered = true;
      else if (entered) onExit();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onExit();
    };
    document.addEventListener("fullscreenchange", onChange);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      window.removeEventListener("keydown", onKey);
    };
  }, [onExit]);

  const exit = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    onExit();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background bg-[url('/dino-pattern.svg')] bg-size-[280px_280px]">
      <div className="absolute top-4 right-4">
        <Button type="text" icon={<Minimize size={18} aria-hidden />} onClick={exit}>
          Exit
        </Button>
      </div>
      <div className="mx-auto flex min-h-full max-w-lg flex-col justify-center gap-8 px-4 py-16 [zoom:1.35]">
        <header className="text-center">
          <p className="font-hand text-6xl leading-none font-bold tabular-nums">{formatClock(now)}</p>
          <p className="mt-1 text-muted">{formatDay(now)}</p>
        </header>
        {children}
      </div>
    </div>
  );
}
