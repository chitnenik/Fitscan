"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { House, Link2, ScanLine, Search, Shirt } from "lucide-react";

const TABS = [
  { href: "/", label: "Home", icon: House },
  { href: "/scan", label: "Scan", icon: ScanLine },
  { href: "/catalog", label: "Shop", icon: Search },
  { href: "/check", label: "Will it fit?", icon: Link2 },
  { href: "/fit", label: "Preview", icon: Shirt },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-edge bg-ink/90 backdrop-blur-lg">
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link href={href} className="relative flex flex-col items-center gap-1 py-2.5 text-[11px]">
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-accent"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
                <Icon className={`h-5 w-5 ${active ? "text-accent" : "text-slate-500"}`} />
                <span className={active ? "text-slate-100" : "text-slate-500"}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
