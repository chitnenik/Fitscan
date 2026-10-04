"use client";

import dynamic from "next/dynamic";

/** Client-only wrapper so Three.js never runs during prerender. */
const Avatar = dynamic(() => import("./BodyAvatar"), {
  ssr: false,
  loading: () => (
    <div className="flex h-80 w-full items-center justify-center text-sm text-slate-500">Loading 3D mesh…</div>
  ),
});

export default Avatar;
