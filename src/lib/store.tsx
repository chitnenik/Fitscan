"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { SAMPLE_SCANS } from "./data";
import type { UserScan } from "./types";

interface ScanState {
  scans: UserScan[];
  activeScan: UserScan;
  setActive: (id: string) => void;
  addScan: (scan: UserScan) => void;
}

const ScanContext = createContext<ScanState | null>(null);
const STORAGE_KEY = "fitscan.v1";

export function ScanProvider({ children }: { children: React.ReactNode }) {
  const [scans, setScans] = useState<UserScan[]>(SAMPLE_SCANS);
  const [activeId, setActiveId] = useState<string>(SAMPLE_SCANS[0].id);

  // Restore scans made in this browser (mock "profile database").
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as
        | { custom: UserScan[]; activeId: string }
        | null;
      if (saved) {
        setScans([...saved.custom, ...SAMPLE_SCANS]);
        setActiveId(saved.activeId);
      }
    } catch {
      /* storage unavailable: keep defaults */
    }
  }, []);

  useEffect(() => {
    try {
      const custom = scans.filter((s) => !SAMPLE_SCANS.some((d) => d.id === s.id));
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ custom, activeId }));
    } catch {
      /* ignore */
    }
  }, [scans, activeId]);

  const addScan = useCallback((scan: UserScan) => {
    setScans((prev) => [scan, ...prev.filter((s) => s.id !== scan.id)]);
    setActiveId(scan.id);
  }, []);

  const value = useMemo<ScanState>(
    () => ({
      scans,
      activeScan: scans.find((s) => s.id === activeId) ?? scans[0],
      setActive: setActiveId,
      addScan,
    }),
    [scans, activeId, addScan],
  );

  return <ScanContext.Provider value={value}>{children}</ScanContext.Provider>;
}

export function useScans() {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error("useScans must be used inside ScanProvider");
  return ctx;
}
