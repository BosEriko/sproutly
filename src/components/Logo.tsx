import Image from "next/image";

export function Logo({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`flex items-center justify-center gap-2 text-accent ${className}`}>
      <Image src="/app-icons/192" alt="" width={size} height={size} unoptimized className="rounded-xl shadow-[var(--shadow)]" />
      <span className="font-hand font-bold" style={{ fontSize: size * 0.9 }}>
        Sproutly
      </span>
    </span>
  );
}
