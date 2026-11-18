"use client";

import { useEffect, useState } from "react";
import { AlarmClock } from "lucide-react";
import { resumeAlarmAudio, startAlarm, stopAlarm } from "@/lib/alarmSound";
import { StickyModal } from "./StickyModal";

export interface Alarm {
  key: string;
  title: string;
  detail: string;
}

const STOPPED_KEY = "sproutly:alarms-stopped";
const MAX_STOPPED = 50;

function loadStopped(): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STOPPED_KEY) ?? "[]");
    return Array.isArray(saved) ? saved.filter((k): k is string => typeof k === "string") : [];
  } catch {
    return [];
  }
}

export function AlarmPopup({ alarms }: { alarms: Alarm[] }) {
  const [stopped, setStopped] = useState<string[] | null>(null);

  useEffect(() => setStopped(loadStopped()), []);

  useEffect(() => {
    window.addEventListener("pointerdown", resumeAlarmAudio);
    window.addEventListener("keydown", resumeAlarmAudio);
    return () => {
      window.removeEventListener("pointerdown", resumeAlarmAudio);
      window.removeEventListener("keydown", resumeAlarmAudio);
      stopAlarm();
    };
  }, []);

  const ringing = stopped ? alarms.filter((a) => !stopped.includes(a.key)) : [];
  const open = ringing.length > 0;

  useEffect(() => {
    if (open) startAlarm();
    else stopAlarm();
  }, [open]);

  const stop = () => {
    const next = [...(stopped ?? []), ...ringing.map((a) => a.key)].slice(-MAX_STOPPED);
    setStopped(next);
    try {
      localStorage.setItem(STOPPED_KEY, JSON.stringify(next));
    } catch {}
  };

  return (
    <StickyModal
      open={open}
      title={
        <span className="flex items-center gap-2">
          <AlarmClock size={26} aria-hidden />
          {ringing.length === 1 ? ringing[0].title : `${ringing.length} alarms`}
        </span>
      }
      color="var(--sticky-pink)"
      okText="Stop"
      dismissible={false}
      onCancel={() => {}}
      onOk={stop}
    >
      <ul className="flex flex-col gap-2 pt-2" role="alert">
        {ringing.map((a) => (
          <li key={a.key}>
            {ringing.length > 1 && <p className="font-semibold">{a.title}</p>}
            <p>{a.detail}</p>
          </li>
        ))}
      </ul>
    </StickyModal>
  );
}
