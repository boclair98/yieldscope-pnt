"use client";

import { Snowflake } from "lucide-react";

import { useWarming } from "@/lib/warming";

/**
 * Top-of-page heads-up while any tracked fetch (lib/warming.ts) has been
 * in flight for ~5s — i.e. the api KSvc is cold-starting.
 *
 * Fixed-positioned over the layout so it never pushes the page content
 * down. Opacity transitions 0 → 75 so the banner reveals smoothly and
 * still lets the content underneath read through.
 *
 * `pointer-events-none` keeps clicks falling through to whatever is
 * below — purely decorative.
 *
 * Stays inert at SSR; only after hydration does the client-side
 * `useWarming` flip it on.
 */
export function WarmingBar() {
  const warming = useWarming();
  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={!warming}
      className={`pointer-events-none fixed inset-x-0 top-0 z-[70] border-b border-white/[0.08] bg-[#0d1725]/85 px-6 py-2.5 text-[11px] text-[#a8b5c6] shadow-sm backdrop-blur-xl transition-opacity duration-500 sm:px-8 ${warming ? "opacity-100" : "opacity-0"}`}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-2">
        <Snowflake className="size-4 shrink-0 text-[#55b8f6]" />
        <span>
          <span className="font-medium text-[#d4deea]">분석 서버를 준비하고 있습니다.</span>{" "}
          <span className="text-[#748399]">
            잠시 후 검토 노트 저장 기능을 사용할 수 있습니다.
          </span>
        </span>
      </div>
    </div>
  );
}
