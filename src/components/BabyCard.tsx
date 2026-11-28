"use client";

import { Button, Tooltip } from "antd";
import { Baby, Cake, Hourglass, Milk, Pencil, Ruler, Weight } from "lucide-react";
import { ageLabel, type BabyProfile } from "@/lib/baby";

function formatBirthday(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export function BabyCard({
  profile,
  now,
  mlPerFeed,
  feedGap,
  onEdit,
}: {
  profile: BabyProfile | null;
  now: number;
  mlPerFeed: number | null;
  feedGap: string | null;
  onEdit: () => void;
}) {
  if (!profile) {
    return (
      <div className="paper rotate-[0.6deg] rounded-sm px-5 pt-7 pb-5 text-center">
        <span className="tape" style={{ background: "var(--tape-neutral)" }} />
        <p className="mb-3 text-muted">Add your baby&apos;s name, birthday, weight and height.</p>
        <Button icon={<Baby size={16} aria-hidden />} onClick={onEdit}>
          Add baby details
        </Button>
      </div>
    );
  }

  const details = [
    profile.birthday && { icon: Cake, text: formatBirthday(profile.birthday) },
    profile.weightKg !== null && { icon: Weight, text: `${profile.weightKg} kg` },
    profile.heightCm !== null && { icon: Ruler, text: `${profile.heightCm} cm` },
    mlPerFeed !== null && { icon: Milk, text: `${mlPerFeed} ml/feed`, tooltip: "Average per feed, last 7 days" },
    feedGap !== null && { icon: Hourglass, text: feedGap, tooltip: "Usual time between feeds, last 7 days" },
  ].filter(Boolean) as { icon: typeof Cake; text: string; tooltip?: string }[];

  return (
    <div className="paper rotate-[0.6deg] rounded-sm px-5 pt-7 pb-4">
      <span className="tape" style={{ background: "var(--tape-neutral)" }} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-hand text-4xl leading-tight font-bold">{profile.name}</h2>
          {profile.birthday && <p className="text-muted">{ageLabel(profile.birthday, new Date(now))}</p>}
        </div>
        <Button type="text" shape="circle" aria-label="Edit baby details" icon={<Pencil size={16} aria-hidden />} onClick={onEdit} />
      </div>
      {details.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          {details.map(({ icon: Icon, text, tooltip }) => (
            <Tooltip key={text} title={tooltip}>
              <li className="flex items-center gap-1.5" aria-label={tooltip ? `${tooltip}: ${text}` : undefined}>
                <Icon size={14} aria-hidden className="text-muted" />
                {text}
              </li>
            </Tooltip>
          ))}
        </ul>
      )}
    </div>
  );
}
