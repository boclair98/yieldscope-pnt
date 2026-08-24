import type { Metadata } from "next";
import type { ReactNode } from "react";

import { WarmingBar } from "@/components/WarmingBanner";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://yieldscope-pnt.coders.kr"),
  title: "YieldScope P&T | 품질 인텔리전스",
  description:
    "패키지·테스트 공정의 불량 신호와 수율 개선 우선순위를 탐색하는 포트폴리오 데모",
  openGraph: {
    title: "YieldScope P&T",
    description: "불량 신호에서 개선 검증까지 — 패키지·테스트 품질 인텔리전스",
    type: "website",
    locale: "ko_KR",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "YieldScope P&T — 불량 신호에서 개선 검증까지" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "YieldScope P&T",
    description: "불량 신호에서 개선 검증까지 — 패키지·테스트 품질 인텔리전스",
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
