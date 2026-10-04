import type { ReactNode } from "react";

export default function PageHeader({ eyebrow, title, right }: { eyebrow?: string; title: string; right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 flex items-end justify-between bg-ink/85 px-4 pb-3 pt-5 backdrop-blur-lg">
      <div>
        {eyebrow && <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">{eyebrow}</p>}
        <h1 className="text-xl font-semibold tracking-tight text-white">{title}</h1>
      </div>
      {right}
    </header>
  );
}
