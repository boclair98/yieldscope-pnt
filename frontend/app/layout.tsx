import type { Metadata } from "next";
import type { ReactNode } from "react";

import { WarmingBar } from "@/components/WarmingBanner";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://yieldscope-pnt.coders.kr"),
  title: "YieldScope P&T | Mass Production Engineering OS",
  description:
    "Test program qualification부터 불량 격리, 원인 재현, 생산성 검증까지 연결하는 P&T 양산 엔지니어링 포트폴리오",
  openGraph: {
    title: "YieldScope P&T",
    description: "양산 Test를 더 빠르고, 더 정확하게 — P&T Mass Production Engineering OS",
    type: "website",
    locale: "ko_KR",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "YieldScope P&T — 불량 신호에서 개선 검증까지" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "YieldScope P&T",
    description: "양산 Test를 더 빠르고, 더 정확하게 — P&T Mass Production Engineering OS",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <WarmingBar />
        {children}
      </body>
    </html>
  );
}
