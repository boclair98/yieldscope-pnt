"use client";

import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  ClipboardCheck,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  FlaskConical,
  Gauge,
  Layers3,
  LogIn,
  Microscope,
  PanelLeft,
  Printer,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TestTube2,
  TrendingDown,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { signInHref } from "@/lib/identity";
import {
  METRIC_DEFINITIONS,
  SCENARIO_ORDER,
  SCENARIOS,
  type ScenarioKey,
} from "@/lib/quality";

const NAV = [
  { id: "overview", label: "Overview", icon: Gauge },
  { id: "defects", label: "Defect Explorer", icon: BarChart3 },
  { id: "rca", label: "RCA Workbench", icon: Microscope },
  { id: "validation", label: "Action Validation", icon: ClipboardCheck },
];

const statusStyle: Record<string, string> = {
  격리: "border-[#f36b78]/25 bg-[#f36b78]/10 text-[#ff96a0]",
  "확인 중": "border-[#f2b84b]/25 bg-[#f2b84b]/10 text-[#ffd16b]",
  모니터링: "border-[#55b8f6]/25 bg-[#55b8f6]/10 text-[#86ceff]",
  해제: "border-[#31c7a2]/25 bg-[#31c7a2]/10 text-[#65ddbf]",
};

export function YieldDashboard() {
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>("stacker");
  const scenario = SCENARIOS[scenarioKey];
  const [selectedTrend, setSelectedTrend] = useState(scenario.trend.length - 1);
  const [selectedDefect, setSelectedDefect] = useState(scenario.pareto[0].code);
  const [query, setQuery] = useState("");
  const [selectedLots, setSelectedLots] = useState<string[]>([]);
  const [mobileNav, setMobileNav] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [review, setReview] = useState("");
  const [reviewState, setReviewState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedTrend(scenario.trend.length - 1);
    setSelectedDefect(scenario.pareto[0].code);
    setSelectedLots([]);
    setReview("");
    setReviewState("idle");
  }, [scenario, scenarioKey]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape") {
        setQuery("");
        searchRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 2800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const filteredLots = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return scenario.lots;
    return scenario.lots.filter((lot) =>
      [lot.id, lot.product, lot.tool, lot.defect, lot.status]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [query, scenario.lots]);

  const selectedPoint = scenario.trend[selectedTrend];
  const trendMin = Math.min(...scenario.trend.map((point) => point.yield));
  const trendMax = Math.max(...scenario.trend.map((point) => point.yield));
  const maxPareto = Math.max(...scenario.pareto.map((item) => item.count));
  const maxValidation = Math.max(...scenario.validation.series.map((item) => item.value));

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileNav(false);
  }

  function toggleLot(id: string) {
    setSelectedLots((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 3) {
        setNotice("LOT 비교는 최대 3개까지 선택할 수 있습니다.");
        return current;
      }
      return [...current, id];
    });
  }

  function exportCsv() {
    const rows = [
      ["lot_id", "product", "tool", "units", "yield_pct", "top_defect", "shift", "status"],
      ...filteredLots.map((lot) => [
        lot.id,
        lot.product,
        lot.tool,
        String(lot.units),
        String(lot.yield),
        lot.defect,
        lot.shift,
        lot.status,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `yieldscope-${scenarioKey}-lots.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice("현재 LOT 목록을 CSV로 내보냈습니다.");
  }

  async function saveReview() {
    if (!review.trim() || reviewState === "saving") return;
    setReviewState("saving");
    try {
      const response = await fetch("/api/quality/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ scenario: scenarioKey, note: review.trim() }),
      });
      if (response.status === 401) {
        window.location.href = signInHref();
        return;
      }
      if (!response.ok) throw new Error("save failed");
      setReviewState("saved");
      setNotice("검토 노트를 저장했습니다.");
    } catch {
      setReviewState("error");
    }
  }

  return (
    <div className="min-h-screen text-[#edf3fc]">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-lg bg-[#f2b84b] px-4 py-2 text-sm font-semibold text-[#17110a] focus:translate-y-0"
      >
        본문 바로가기
      </a>

      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#08101d]/88 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            aria-label="메뉴 열기"
            aria-expanded={mobileNav}
            onClick={() => setMobileNav((open) => !open)}
            className="grid size-9 place-items-center rounded-xl border border-white/[0.08] text-[#9aa8bc] lg:hidden"
          >
            {mobileNav ? <X className="size-4" /> : <PanelLeft className="size-4" />}
          </button>

          <button type="button" onClick={() => scrollTo("overview")} className="flex shrink-0 items-center gap-3 text-left">
            <span className="relative grid size-9 place-items-center overflow-hidden rounded-xl border border-[#f2b84b]/35 bg-[#f2b84b]/10 text-[#f2b84b]">
              <CircleDot className="size-[18px]" />
              <span className="absolute inset-x-2 bottom-1 h-px bg-[#31c7a2]" />
            </span>
            <span>
              <span className="block text-[15px] font-semibold tracking-[-0.02em]">YieldScope</span>
              <span className="block text-[9px] font-semibold tracking-[0.2em] text-[#7d8ba0]">P&amp;T QUALITY LAB</span>
            </span>
          </button>

          <label className="ml-2 hidden h-10 max-w-[430px] flex-1 items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3.5 text-sm text-[#7f8ea3] transition focus-within:border-[#f2b84b]/40 focus-within:bg-white/[0.05] md:flex">
            <Search className="size-4 shrink-0" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="LOT, 장비, 불량 코드를 검색하세요"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-[#dbe4f1] outline-none placeholder:text-[#64738a]"
            />
            {query ? (
              <button type="button" aria-label="검색어 지우기" onClick={() => setQuery("")} className="text-[#718097] hover:text-white"><X className="size-3.5" /></button>
            ) : (
              <kbd className="rounded-md border border-white/10 bg-[#0b1422] px-1.5 py-0.5 text-[9px]">⌘ K</kbd>
            )}
          </label>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 text-[11px] text-[#76859b] xl:flex">
              <span className="size-1.5 rounded-full bg-[#31c7a2] shadow-[0_0_0_3px_rgba(49,199,162,0.09)]" />
              최근 갱신 2026.08.24 10:32 KST
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="hidden h-9 items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.035] px-3.5 text-[11px] font-medium text-[#b8c4d4] transition hover:border-white/20 hover:text-white sm:flex"
            >
              <FileText className="size-3.5" /> 분석 리포트
            </button>
            <span className="rounded-full border border-[#31c7a2]/20 bg-[#31c7a2]/10 px-2.5 py-1.5 text-[10px] font-medium text-[#6ee0c3]">100% 합성 데이터</span>
          </div>
        </div>

        {mobileNav && (
          <nav className="border-t border-white/[0.07] bg-[#09111f] p-3 lg:hidden" aria-label="모바일 내비게이션">
            <div className="grid grid-cols-2 gap-2">
              {NAV.map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" onClick={() => scrollTo(id)} className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-3 text-left text-xs text-[#a8b5c7]">
                  <Icon className="size-4 text-[#f2b84b]" /> {label}
                </button>
              ))}
            </div>
          </nav>
        )}
      </header>

      <div className="mx-auto grid max-w-[1600px] grid-cols-1 lg:grid-cols-[224px_minmax(0,1fr)]">
        <aside className="sticky top-16 hidden h-[calc(100vh-64px)] border-r border-white/[0.065] px-4 py-7 lg:flex lg:flex-col">
          <p className="px-3 text-[9px] font-semibold tracking-[0.18em] text-[#5f6e84]">ANALYSIS FLOW</p>
          <nav className="mt-3 space-y-1" aria-label="분석 단계">
            {NAV.map(({ id, label, icon: Icon }, index) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollTo(id)}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] transition ${index === 0 ? "bg-[#f2b84b]/10 text-[#ffd470]" : "text-[#8593a8] hover:bg-white/[0.035] hover:text-white"}`}
              >
                <Icon className="size-4" />
                <span>{label}</span>
                {index === 0 && <span className="ml-auto size-1.5 rounded-full bg-[#f2b84b]" />}
              </button>
            ))}
          </nav>

          <div className="mt-8 px-3">
            <p className="text-[9px] font-semibold tracking-[0.18em] text-[#5f6e84]">ACTIVE CASE</p>
            <div className="mt-3 space-y-2">
              {SCENARIO_ORDER.map((key, index) => {
                const item = SCENARIOS[key];
                const active = key === scenarioKey;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { setScenarioKey(key); scrollTo("overview"); }}
                    className={`w-full rounded-xl border p-3 text-left transition ${active ? "border-[#f2b84b]/25 bg-[#f2b84b]/[0.07]" : "border-transparent hover:border-white/[0.07] hover:bg-white/[0.025]"}`}
                  >
                    <span className={`text-[9px] font-semibold tracking-[0.12em] ${active ? "text-[#dcb45e]" : "text-[#5f6e84]"}`}>CASE 0{index + 1}</span>
                    <span className={`mt-1 block text-[11px] font-medium ${active ? "text-[#e8edf5]" : "text-[#8795aa]"}`}>{item.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-auto rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="flex items-center gap-2 text-[11px] font-medium text-[#bbc6d5]"><Sparkles className="size-3.5 text-[#f2b84b]" /> 해석 가드레일</div>
            <p className="mt-2 text-[10px] leading-5 text-[#66758c]">상관 신호는 원인 확정이 아닙니다. 재현 시험, 물리 분석, 개선 후 검증을 함께 확인하세요.</p>
          </div>
        </aside>

        <main id="main-content" className="min-w-0 px-4 pb-16 pt-7 sm:px-6 lg:px-8 lg:pt-9 xl:px-10">
          <section id="overview" className="scroll-mt-24">
            <div className="flex flex-col gap-6 2xl:flex-row 2xl:items-end 2xl:justify-between">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.15em] text-[#f2b84b]">
                  <span className="h-px w-6 bg-[#f2b84b]" /> QUALITY INTELLIGENCE
                </div>
                <h1 className="mt-3 text-[28px] font-semibold tracking-[-0.04em] sm:text-[34px]">불량 신호에서 개선 검증까지.</h1>
                <p className="mt-2 max-w-3xl text-[13px] leading-6 text-[#8391a6] sm:text-sm">패키지·테스트 이력을 연결해 이상 감지, 기여 요인 분리, 물리 분석 증거, 개선 효과를 하나의 의사결정 흐름으로 탐색합니다.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <label className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-[#a7b4c6]">
                  기간
                  <select className="bg-transparent font-medium text-[#e3eaf4] outline-none" defaultValue="30"><option className="bg-[#101a29]" value="30">최근 30일</option><option className="bg-[#101a29]" value="90">최근 90일</option></select>
                </label>
                <span className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-[#a7b4c6]">제품군 <strong className="ml-2 font-medium text-[#e3eaf4]">Stacked-M</strong></span>
                <span className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-[#a7b4c6]">공정 <strong className="ml-2 font-medium text-[#e3eaf4]">{scenario.stage}</strong></span>
                <button type="button" onClick={() => { setQuery(""); setSelectedLots([]); }} className="grid size-9 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-[#8b9aaf] transition hover:text-white" aria-label="필터 초기화"><RotateCcw className="size-3.5" /></button>
              </div>
            </div>

            <div className="mt-6 flex gap-2 overflow-x-auto pb-1 sm:hidden">
              {SCENARIO_ORDER.map((key) => {
                const item = SCENARIOS[key];
                return <button key={key} type="button" onClick={() => setScenarioKey(key)} className={`shrink-0 rounded-full border px-3 py-2 text-[11px] ${key === scenarioKey ? "border-[#f2b84b]/40 bg-[#f2b84b]/10 text-[#ffd16b]" : "border-white/[0.08] text-[#8593a8]"}`}>{item.shortLabel}</button>;
              })}
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {scenario.kpis.map((kpi) => (
                <article key={kpi.label} className="group rounded-2xl border border-white/[0.075] bg-[#111b2b]/78 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.1)] transition hover:-translate-y-0.5 hover:border-white/[0.13]">
                  <div className="flex items-center justify-between text-[11px] text-[#7d8ba0]">
                    <span>{kpi.label}</span>
                    <span className={`size-1.5 rounded-full ${kpi.tone === "good" ? "bg-[#31c7a2]" : kpi.tone === "alert" ? "bg-[#f36b78]" : kpi.tone === "warn" ? "bg-[#ff9254]" : "bg-[#59687e]"}`} />
                  </div>
                  <div className="mt-3 flex items-end gap-1.5">
                    <strong className="text-[27px] font-semibold tracking-[-0.045em] tabular-nums">{kpi.value}</strong>
                    {kpi.unit && <span className="mb-1 text-[11px] text-[#7d8ba0]">{kpi.unit}</span>}
                  </div>
                  <p className={`mt-2 text-[10px] ${kpi.tone === "good" ? "text-[#54d7b7]" : kpi.tone === "alert" ? "text-[#ff8e99]" : kpi.tone === "warn" ? "text-[#ffad68]" : "text-[#718097]"}`}>{kpi.delta}</p>
                  <p className="mt-3 border-t border-white/[0.055] pt-3 text-[9px] text-[#56657b] opacity-0 transition group-hover:opacity-100">{kpi.hint}</p>
                </article>
              ))}
            </div>

            <div className="mt-4 grid gap-4 2xl:grid-cols-[minmax(0,1.62fr)_minmax(330px,0.8fr)]">
              <Panel className="p-5 sm:p-6">
                <PanelHeading
                  eyebrow={`${scenario.incidentWindow} · ${scenario.stage}`}
                  title="Final yield p-chart"
                  description="일별 최종 수율 · 점선은 내부 데모 목표선 97.0%"
                  action={<span className="rounded-lg border border-[#31c7a2]/20 bg-[#31c7a2]/10 px-2.5 py-1 text-[10px] text-[#65ddbf]">조치 후 안정화</span>}
                />
                <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_150px]">
                  <div>
                    <div className="relative h-[230px] overflow-hidden rounded-xl border border-white/[0.055] bg-[#0b1422]/78 px-3 pb-7 pt-4 sm:px-4">
                      {[25, 50, 75].map((line) => <span key={line} className="pointer-events-none absolute inset-x-3 border-t border-white/[0.045] sm:inset-x-4" style={{ top: `${line}%` }} />)}
                      <div className="pointer-events-none absolute inset-x-3 top-[31%] border-t border-dashed border-[#f2b84b]/38 sm:inset-x-4"><span className="absolute -top-4 right-0 text-[8px] font-medium text-[#b59552]">TARGET 97.0</span></div>
                      <div className="relative flex h-full items-end gap-1.5 sm:gap-2">
                        {scenario.trend.map((point, index) => {
                          const height = 28 + ((point.yield - trendMin) / Math.max(0.01, trendMax - trendMin)) * 62;
                          const active = index === selectedTrend;
                          return (
                            <button
                              key={`${point.date}-${index}`}
                              type="button"
                              aria-label={`${point.date} 수율 ${point.yield}%`}
                              aria-pressed={active}
                              onClick={() => setSelectedTrend(index)}
                              className="group relative flex h-full min-w-0 flex-1 items-end"
                            >
                              <span className={`absolute inset-x-0 bottom-0 rounded-t-sm transition-all ${active ? "bg-[#f2b84b] shadow-[0_0_18px_rgba(242,184,75,0.25)]" : point.breach ? "bg-[#f36b78]/75 group-hover:bg-[#f36b78]" : "bg-gradient-to-t from-[#1f7772] to-[#35c9a6] group-hover:brightness-125"}`} style={{ height: `${height}%` }} />
                              {active && <span className="absolute inset-x-0 z-10 mx-auto size-2 rounded-full bg-white shadow-[0_0_0_4px_rgba(242,184,75,0.24)]" style={{ bottom: `calc(${height}% - 3px)` }} />}
                              <span className={`absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] ${active ? "text-[#f2b84b]" : "text-[#526177]"}`}>{index % 2 === 0 ? point.date.slice(3) : ""}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-[9px] text-[#627187]">
                      <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-[#31c7a2]" /> 관리 한계 내</span>
                      <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-[#f36b78]" /> LCL 이탈</span>
                      <span className="flex items-center gap-1.5"><span className="h-px w-3 border-t border-dashed border-[#f2b84b]" /> 목표 97.0%</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 lg:grid-cols-1 lg:content-center">
                    <DataPoint label="선택 일자" value={selectedPoint.date} />
                    <DataPoint label="Final yield" value={`${selectedPoint.yield.toFixed(2)}%`} accent={selectedPoint.breach} />
                    <DataPoint label="투입 LOT" value={`${selectedPoint.lots} lots`} />
                  </div>
                </div>
              </Panel>

              <article className="relative overflow-hidden rounded-2xl border border-[#f2b84b]/20 bg-[linear-gradient(148deg,rgba(242,184,75,0.115),rgba(17,27,43,0.88)_48%)] p-6 sm:p-7">
                <div className="absolute -right-12 -top-12 size-48 rounded-full border border-[#f2b84b]/10" />
                <div className="absolute -right-2 -top-2 size-28 rounded-full border border-[#f2b84b]/10" />
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-[9px] font-semibold tracking-[0.17em] text-[#d4aa53]">ACTIVE QUALITY SIGNAL</p>
                    <p className="mt-2 text-[10px] text-[#7f8da1]">{scenario.eyebrow}</p>
                  </div>
                  <span className="grid size-10 place-items-center rounded-xl border border-[#f2b84b]/20 bg-[#f2b84b]/10 text-[#f2b84b]"><AlertTriangle className="size-5" /></span>
                </div>
                <h2 className="relative mt-7 text-xl font-semibold leading-8 tracking-[-0.03em] sm:text-[22px]">{scenario.signal}</h2>
                <p className="relative mt-4 text-[13px] leading-6 text-[#8997aa]">{scenario.signalDetail}</p>

                <div className="relative mt-6 grid grid-cols-4 gap-1.5">
                  {["Detect", "Isolate", "Confirm", "Improve"].map((step, index) => (
                    <div key={step} className="text-center">
                      <div className={`mx-auto grid size-7 place-items-center rounded-full border text-[9px] ${index < 3 ? "border-[#31c7a2]/30 bg-[#31c7a2]/10 text-[#69e0c3]" : "border-[#f2b84b]/30 bg-[#f2b84b]/10 text-[#ffd16b]"}`}>{index < 3 ? <Check className="size-3" /> : "04"}</div>
                      <span className="mt-1.5 block text-[8px] uppercase tracking-[0.08em] text-[#627187]">{step}</span>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => scrollTo("rca")} className="relative mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-[#f2b84b] px-4 py-3 text-[11px] font-semibold text-[#181208] transition hover:bg-[#ffd06a]">근거 체인 열기 <ArrowRight className="size-3.5" /></button>
                <p className="relative mt-3 text-center text-[9px] leading-4 text-[#5d6c82]">검증 전 신호는 기여 요인 후보로만 표시합니다.</p>
              </article>
            </div>
          </section>

          <section id="defects" className="scroll-mt-24 pt-10">
            <SectionHeader number="02" title="Defect Explorer" description="불량 구성과 장비 집중도를 함께 보며 손실의 80%를 만드는 구간부터 좁힙니다." />
            <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
              <Panel className="p-5 sm:p-6">
                <PanelHeading eyebrow="DEFECT OCCURRENCES" title="불량 Pareto" description="결함 발생 건수 기준 · 불량품 수와 중복될 수 있음" action={<span className="text-[10px] text-[#6d7c92]">총 {scenario.pareto.reduce((sum, item) => sum + item.count, 0).toLocaleString()}건</span>} />
                <div className="mt-6 space-y-3">
                  {scenario.pareto.map((item, index) => {
                    const active = item.code === selectedDefect;
                    const cumulative = scenario.pareto.slice(0, index + 1).reduce((sum, row) => sum + row.share, 0);
                    return (
                      <button key={item.code} type="button" onClick={() => setSelectedDefect(item.code)} aria-pressed={active} className={`grid w-full grid-cols-[38px_minmax(0,1fr)_44px] items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${active ? "border-[#f2b84b]/25 bg-[#f2b84b]/[0.055]" : "border-transparent hover:border-white/[0.06] hover:bg-white/[0.02]"}`}>
                        <span className={`grid size-8 place-items-center rounded-lg text-[9px] font-semibold ${active ? "bg-[#f2b84b]/15 text-[#ffd16b]" : "bg-white/[0.04] text-[#6f7e94]"}`}>{item.code}</span>
                        <span className="min-w-0">
                          <span className="flex items-center justify-between gap-3 text-[11px]"><span className={active ? "text-[#e8edf5]" : "text-[#9aa8bb]"}>{item.label}</span><span className="text-[9px] tabular-nums text-[#65748a]">누적 {cumulative}%</span></span>
                          <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-white/[0.045]"><span className="block h-full rounded-full transition-all duration-500" style={{ width: `${(item.count / maxPareto) * 100}%`, backgroundColor: item.tone }} /></span>
                        </span>
                        <span className="text-right"><strong className="block text-[12px] tabular-nums text-[#d5deea]">{item.count}</strong><span className="text-[9px] text-[#5f6e84]">{item.share}%</span></span>
                      </button>
                    );
                  })}
                </div>
              </Panel>

              <Panel className="p-5 sm:p-6">
                <PanelHeading eyebrow="STRATIFIED RISK" title="공정 · 장비 집중도" description={`${scenario.pareto.find((item) => item.code === selectedDefect)?.label ?? "전체"} 기준 층화 비교`} action={<span className="rounded-lg bg-white/[0.04] px-2 py-1 text-[9px] text-[#8492a6]">RR = Risk ratio</span>} />
                <div className="mt-6 overflow-hidden rounded-xl border border-white/[0.06]">
                  <div className="grid grid-cols-[minmax(90px,1fr)_74px_64px_66px] gap-2 bg-white/[0.025] px-3 py-2.5 text-[8px] font-semibold tracking-[0.1em] text-[#59687e]">
                    <span>TOOL / STAGE</span><span className="text-right">DEFECT %</span><span className="text-right">RR</span><span className="text-right">STATE</span>
                  </div>
                  {scenario.tools.map((tool) => (
                    <div key={tool.name} className="grid grid-cols-[minmax(90px,1fr)_74px_64px_66px] items-center gap-2 border-t border-white/[0.05] px-3 py-3 text-[10px] hover:bg-white/[0.02]">
                      <span><strong className="block text-[11px] font-medium text-[#ced8e5]">{tool.name}</strong><span className="text-[8px] text-[#5f6e84]">{tool.stage}</span></span>
                      <span className="text-right tabular-nums text-[#a6b3c4]">{tool.rate.toFixed(2)}</span>
                      <span className={`text-right font-semibold tabular-nums ${tool.risk >= 3 ? "text-[#ff8d98]" : tool.risk >= 1.2 ? "text-[#ffb36f]" : "text-[#68dcc0]"}`}>{tool.risk.toFixed(1)}×</span>
                      <span className="text-right"><span className={`inline-flex rounded-md px-1.5 py-0.5 text-[8px] ${tool.status === "위험" ? "bg-[#f36b78]/10 text-[#ff8d98]" : tool.status === "주의" ? "bg-[#ff9254]/10 text-[#ffb36f]" : "bg-[#31c7a2]/10 text-[#68dcc0]"}`}>{tool.status}</span></span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-xl border border-[#55b8f6]/12 bg-[#55b8f6]/[0.045] p-3 text-[10px] leading-5 text-[#8092aa]">
                  <span className="font-medium text-[#9dcae7]">읽는 법</span> · RR 1.0은 비교 기준과 동일, 3.6×는 해당 조건에서 불량 비율이 3.6배임을 뜻합니다. 인과 확정값은 아닙니다.
                </div>
              </Panel>
            </div>

            <Panel className="mt-4 overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-white/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div><p className="text-[9px] font-semibold tracking-[0.14em] text-[#67768b]">LOT WATCHLIST</p><h3 className="mt-1 text-sm font-semibold">우선 확인 LOT</h3></div>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedLots.length > 0 && <span className="rounded-lg border border-[#f2b84b]/20 bg-[#f2b84b]/[0.07] px-2.5 py-1.5 text-[9px] text-[#dcb45e]">{selectedLots.length}개 LOT 비교 선택</span>}
                  <button type="button" onClick={exportCsv} className="flex items-center gap-2 rounded-lg border border-white/[0.08] px-3 py-2 text-[9px] text-[#95a3b6] transition hover:text-white"><Download className="size-3" /> CSV 내보내기</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <thead><tr className="text-[8px] font-semibold tracking-[0.11em] text-[#59687e]">{["COMPARE", "LOT ID", "PRODUCT", "TOOL", "UNITS", "YIELD", "TOP DEFECT", "SHIFT", "STATE"].map((head) => <th key={head} className="bg-white/[0.018] px-4 py-3 first:pl-6">{head}</th>)}</tr></thead>
                  <tbody>
                    {filteredLots.map((lot) => {
                      const checked = selectedLots.includes(lot.id);
                      return (
                        <tr key={lot.id} className={`border-t border-white/[0.05] text-[10px] transition hover:bg-white/[0.02] ${checked ? "bg-[#f2b84b]/[0.025]" : ""}`}>
                          <td className="px-4 py-3.5 pl-6"><button type="button" onClick={() => toggleLot(lot.id)} aria-label={`${lot.id} 비교 선택`} aria-pressed={checked} className={`grid size-4 place-items-center rounded border ${checked ? "border-[#f2b84b] bg-[#f2b84b] text-[#17110a]" : "border-white/15"}`}>{checked && <Check className="size-3" />}</button></td>
                          <td className="px-4 py-3.5 font-medium text-[#d7e0ec]">{lot.id}</td>
                          <td className="px-4 py-3.5 text-[#8290a5]">{lot.product}</td>
                          <td className="px-4 py-3.5 text-[#a9b5c5]">{lot.tool}</td>
                          <td className="px-4 py-3.5 tabular-nums text-[#8290a5]">{lot.units.toLocaleString()}</td>
                          <td className={`px-4 py-3.5 font-medium tabular-nums ${lot.yield < 96.5 ? "text-[#ff8994]" : "text-[#b9c5d5]"}`}>{lot.yield.toFixed(2)}%</td>
                          <td className="px-4 py-3.5 text-[#a9b5c5]">{lot.defect}</td>
                          <td className="px-4 py-3.5 text-[#8290a5]">{lot.shift}</td>
                          <td className="px-4 py-3.5"><span className={`inline-flex rounded-full border px-2 py-1 text-[8px] ${statusStyle[lot.status]}`}>{lot.status}</span></td>
                        </tr>
                      );
                    })}
                    {filteredLots.length === 0 && <tr><td colSpan={9} className="px-6 py-12 text-center text-xs text-[#66758c]">현재 검색 조건에 맞는 LOT가 없습니다.</td></tr>}
                  </tbody>
                </table>
              </div>
            </Panel>
          </section>

          <section id="rca" className="scroll-mt-24 pt-10">
            <SectionHeader number="03" title="RCA Workbench" description="데이터 연관성을 출발점으로, 재현 시험과 물리 분석이 일치할 때만 원인 상태를 승격합니다." />
            <div className="mt-5 grid gap-4 2xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
              <Panel className="p-5 sm:p-6">
                <PanelHeading eyebrow="CONTRIBUTING FACTORS" title="기여 요인 후보" description="층화 비교 → 교차 재현 → 물리 증거 순으로 신뢰도 계산" />
                <div className="mt-5 space-y-3">
                  {scenario.hypotheses.map((hypothesis) => (
                    <article key={hypothesis.rank} className="rounded-xl border border-white/[0.065] bg-white/[0.018] p-4 transition hover:border-white/[0.11]">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                        <span className={`grid size-8 shrink-0 place-items-center rounded-lg text-[10px] font-semibold ${hypothesis.rank === 1 ? "bg-[#f2b84b]/12 text-[#ffd16b]" : "bg-white/[0.04] text-[#718097]"}`}>0{hypothesis.rank}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2"><h3 className="text-[12px] font-semibold text-[#dae3ee]">{hypothesis.title}</h3><StateBadge state={hypothesis.state} /></div>
                          <p className="mt-2 text-[10px] leading-5 text-[#718097]">{hypothesis.evidence}</p>
                          <div className="mt-3 flex items-center gap-3"><span className="text-[9px] font-medium text-[#a5b2c3]">{hypothesis.metric}</span><span className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.05]"><span className={`block h-full rounded-full ${hypothesis.confidence >= 85 ? "bg-[#31c7a2]" : hypothesis.confidence >= 50 ? "bg-[#f2b84b]" : "bg-[#64748b]"}`} style={{ width: `${hypothesis.confidence}%` }} /></span><span className="text-[9px] tabular-nums text-[#6e7d92]">{hypothesis.confidence}%</span></div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </Panel>

              <Panel className="p-5 sm:p-6">
                <PanelHeading eyebrow="EVIDENCE CHAIN" title="FA 증거 체인" description="전기적 확인부터 개선 검증까지의 상태" />
                <div className="mt-6">
                  {scenario.evidence.map((item, index) => (
                    <div key={item.label} className="relative flex gap-3 pb-6 last:pb-0">
                      {index < scenario.evidence.length - 1 && <span className="absolute left-[13px] top-7 h-[calc(100%-14px)] w-px bg-white/[0.08]" />}
                      <span className={`relative z-10 grid size-7 shrink-0 place-items-center rounded-full border ${item.status === "done" ? "border-[#31c7a2]/30 bg-[#31c7a2]/10 text-[#64ddbf]" : item.status === "active" ? "border-[#f2b84b]/30 bg-[#f2b84b]/10 text-[#ffd16b]" : "border-white/10 bg-[#111b2b] text-[#66758c]"}`}>{item.status === "done" ? <Check className="size-3" /> : item.status === "active" ? <Zap className="size-3" /> : <Clock3 className="size-3" />}</span>
                      <div className="min-w-0 flex-1 pt-0.5"><div className="flex items-center justify-between gap-3"><p className="text-[11px] font-medium text-[#cdd7e3]">{item.label}</p><span className="text-[9px] font-semibold text-[#91a1b6]">{item.value}</span></div><p className="mt-1 text-[9px] leading-4 text-[#627187]">{item.detail}</p></div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-xl border border-[#31c7a2]/13 bg-[#31c7a2]/[0.045] p-4">
                  <div className="flex items-center gap-2 text-[10px] font-medium text-[#7ce3c8]"><ShieldCheck className="size-4" /> Confirmed 기준 충족</div>
                  <p className="mt-2 text-[9px] leading-5 text-[#6f8394]">연관 신호, 교차 재현, 물리 분석, 개선 후 효과가 같은 방향으로 일치합니다.</p>
                </div>
              </Panel>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <MethodCard icon={TestTube2} title="1. Stratify" text="장비·재료·Shift·온도 corner별 분모와 불량률을 함께 비교합니다." />
              <MethodCard icon={FlaskConical} title="2. Reproduce" text="다른 tester/socket 또는 조건 split으로 현상을 재현하고 testability를 분리합니다." />
              <MethodCard icon={Microscope} title="3. Corroborate" text="X-ray·SAM·단면 같은 물리 증거와 개선 후 재발 여부로 판단을 닫습니다." />
            </div>
          </section>

          <section id="validation" className="scroll-mt-24 pt-10">
            <SectionHeader number="04" title="Action Validation" description="Containment로 영향을 차단하고, Corrective·Preventive action의 개선 폭과 재발 여부를 검증합니다." />
            <div className="mt-5 grid gap-4 2xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
              <Panel className="p-5 sm:p-6">
                <PanelHeading
                  eyebrow="BEFORE / AFTER"
                  title={scenario.validation.title}
                  description={`개선 전 4 LOT vs 개선 후 ${scenario.validation.lots} LOT · 단위 %`}
                  action={<span className="flex items-center gap-1.5 rounded-lg border border-[#31c7a2]/20 bg-[#31c7a2]/10 px-2.5 py-1 text-[10px] font-medium text-[#69dfc2]"><TrendingDown className="size-3" /> −{scenario.validation.reduction}%</span>}
                />
                <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_165px]">
                  <div>
                    <div className="relative flex h-[230px] items-end gap-2 rounded-xl border border-white/[0.055] bg-[#0b1422]/78 px-4 pb-8 pt-4">
                      <span className="absolute bottom-8 left-[42%] top-4 border-l border-dashed border-white/[0.1]" />
                      <span className="absolute left-4 top-3 text-[8px] font-medium text-[#f59a76]">BEFORE</span>
                      <span className="absolute left-[45%] top-3 text-[8px] font-medium text-[#5bd9ba]">AFTER</span>
                      {scenario.validation.series.map((item) => (
                        <div key={item.label} className="group relative flex h-full flex-1 items-end">
                          <span className={`w-full rounded-t-sm transition group-hover:brightness-125 ${item.phase === "before" ? "bg-gradient-to-t from-[#8e4652] to-[#f36b78]" : "bg-gradient-to-t from-[#1f7772] to-[#31c7a2]"}`} style={{ height: `${Math.max(10, (item.value / maxValidation) * 85)}%` }} />
                          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] text-[#59687e]">{item.label}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-[9px] leading-5 text-[#5f6e84]">개선 효과는 합성 데이터의 단순 전후 비교입니다. 실제 판단에는 충분한 표본과 관리도 안정성 검토가 필요합니다.</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 lg:grid-cols-1 lg:content-center">
                    <DataPoint label="개선 전" value={`${scenario.validation.before.toFixed(2)}%`} accent />
                    <DataPoint label="개선 후" value={`${scenario.validation.after.toFixed(2)}%`} good />
                    <DataPoint label="감소율" value={`${scenario.validation.reduction}%`} good />
                  </div>
                </div>
              </Panel>

              <Panel className="p-5 sm:p-6">
                <PanelHeading eyebrow="CAPA" title="개선 액션" description="차단 → 시정 → 재발 방지 순서" />
                <div className="mt-5 space-y-3">
                  {scenario.actions.map((action, index) => (
                    <article key={action.type} className="rounded-xl border border-white/[0.06] bg-white/[0.018] p-4">
                      <div className="flex items-start gap-3">
                        <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${index < 2 ? "bg-[#31c7a2]/10 text-[#62ddbd]" : "bg-[#f2b84b]/10 text-[#ffd16b]"}`}>{index < 2 ? <CheckCircle2 className="size-4" /> : <Clock3 className="size-4" />}</span>
                        <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="text-[8px] font-semibold uppercase tracking-[0.1em] text-[#6c7b91]">{action.type}</span><span className="text-[8px] text-[#56657b]">{action.date}</span></div><p className="mt-1.5 text-[10px] leading-5 text-[#bcc8d8]">{action.title}</p><div className="mt-2 flex items-center gap-2 text-[8px] text-[#68778d]"><span>{action.owner}</span><span>·</span><span>{action.state}</span></div></div>
                      </div>
                    </article>
                  ))}
                </div>
              </Panel>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.48fr)]">
              <Panel className="p-5 sm:p-6">
                <PanelHeading eyebrow="ENGINEER REVIEW" title="검토 노트" description="로그인한 방문자는 분석 판단과 다음 확인 항목을 저장할 수 있습니다." action={<button type="button" onClick={() => { window.location.href = signInHref(); }} className="flex items-center gap-1.5 text-[9px] text-[#8998ac] hover:text-white"><LogIn className="size-3" /> coders.kr 로그인</button>} />
                <textarea value={review} onChange={(event) => { setReview(event.target.value.slice(0, 500)); setReviewState("idle"); }} placeholder="예: STK-03 교정 효과는 확인됐으나, 야간 Shift 첫 LOT의 golden sample 확인 결과를 2주간 추가 추적한다." className="mt-5 min-h-28 w-full resize-y rounded-xl border border-white/[0.075] bg-[#0b1422]/75 p-4 text-[11px] leading-6 text-[#d5dfeb] outline-none placeholder:text-[#536278] focus:border-[#f2b84b]/35" />
                <div className="mt-3 flex items-center justify-between gap-3"><span className="text-[9px] tabular-nums text-[#5d6c82]">{review.length} / 500</span><button type="button" onClick={saveReview} disabled={!review.trim() || reviewState === "saving" || reviewState === "saved"} className="rounded-xl bg-[#e6b24c] px-4 py-2.5 text-[10px] font-semibold text-[#17110a] transition hover:bg-[#ffd06a] disabled:cursor-not-allowed disabled:opacity-45">{reviewState === "saving" ? "저장 중…" : reviewState === "saved" ? "저장 완료" : "검토 노트 저장"}</button></div>
                {reviewState === "error" && <p role="alert" className="mt-3 text-[9px] text-[#ff8e99]">서버에 연결하지 못했습니다. 배포 후 로그인 상태에서 다시 시도해 주세요.</p>}
              </Panel>

              <Panel className="border-[#55b8f6]/12 bg-[linear-gradient(145deg,rgba(85,184,246,0.06),rgba(17,27,43,0.78))] p-5 sm:p-6">
                <div className="flex items-center gap-2 text-[10px] font-medium text-[#9fd6f5]"><AlertCircle className="size-4" /> Portfolio disclosure</div>
                <p className="mt-4 text-[10px] leading-5 text-[#7d8da3]">본 프로젝트는 공개 기술 자료를 참고한 <strong className="font-medium text-[#b7c4d4]">HBM-inspired 단순화 공정</strong>과 100% 합성 데이터로 구성했습니다.</p>
                <p className="mt-3 text-[10px] leading-5 text-[#7d8da3]">표시된 수치·임계값·LOT·장비명은 실제 기업의 사양이나 내부 데이터가 아니며, 특정 기업과의 공식 제휴를 의미하지 않습니다.</p>
              </Panel>
            </div>
          </section>

          <footer className="mt-12 border-t border-white/[0.065] py-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
              <div><div className="flex items-center gap-2 text-[11px] font-semibold"><CircleDot className="size-4 text-[#f2b84b]" /> YieldScope P&amp;T</div><p className="mt-2 max-w-md text-[9px] leading-5 text-[#5f6e84]">반도체 패키지·테스트 품질 분석 역량을 보여주기 위한 포트폴리오 데모. Detect → Isolate → Confirm → Improve.</p></div>
              <div className="grid gap-2 sm:grid-cols-2">
                {METRIC_DEFINITIONS.map(([term, definition]) => <div key={term} className="rounded-lg bg-white/[0.018] px-3 py-2"><span className="text-[8px] font-semibold text-[#8090a5]">{term}</span><p className="mt-1 text-[8px] leading-4 text-[#536278]">{definition}</p></div>)}
              </div>
            </div>
            <div className="mt-7 flex flex-col gap-3 border-t border-white/[0.045] pt-5 text-[8px] text-[#4f5e73] sm:flex-row sm:items-center sm:justify-between"><span>© 2026 YieldScope P&amp;T · Portfolio demo</span><a href="https://coders.kr" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-[#8290a5]">Hosted on coders.kr <ExternalLink className="size-2.5" /></a></div>
          </footer>
        </main>
      </div>

      {selectedLots.length > 0 && (
        <div className="fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 items-center gap-3 rounded-2xl border border-[#f2b84b]/20 bg-[#111a28]/95 p-3 shadow-2xl backdrop-blur-xl">
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#f2b84b]/10 text-[#f2b84b]"><Layers3 className="size-4" /></span>
          <div className="min-w-0 flex-1"><p className="text-[10px] font-medium text-[#d6dfeb]">{selectedLots.length}개 LOT 비교 준비</p><p className="truncate text-[8px] text-[#66758c]">{selectedLots.join(" · ")}</p></div>
          <button type="button" onClick={() => setNotice("비교 분석 뷰를 구성했습니다. 선택 LOT의 수율·불량 구성·장비 조건을 나란히 검토할 수 있습니다.")} className="rounded-xl bg-[#f2b84b] px-3 py-2 text-[9px] font-semibold text-[#17110a]">비교 분석</button>
          <button type="button" onClick={() => setSelectedLots([])} aria-label="비교 선택 해제" className="grid size-8 place-items-center text-[#718097] hover:text-white"><X className="size-3.5" /></button>
        </div>
      )}

      {notice && <div role="status" aria-live="polite" className="fixed right-4 top-20 z-[60] max-w-sm rounded-xl border border-white/[0.1] bg-[#151f2e]/96 px-4 py-3 text-[10px] leading-5 text-[#c8d2df] shadow-2xl backdrop-blur-xl">{notice}</div>}
    </div>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <article className={`rounded-2xl border border-white/[0.075] bg-[#111b2b]/78 shadow-[0_18px_60px_rgba(0,0,0,0.09)] ${className}`}>{children}</article>;
}

function PanelHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="flex items-start justify-between gap-4"><div><p className="text-[8px] font-semibold tracking-[0.14em] text-[#617087]">{eyebrow}</p><h2 className="mt-1.5 text-[13px] font-semibold text-[#e4eaf2]">{title}</h2><p className="mt-1 text-[9px] leading-4 text-[#68778d]">{description}</p></div>{action}</div>;
}

function SectionHeader({ number, title, description }: { number: string; title: string; description: string }) {
  return <div className="flex items-start gap-4"><span className="mt-1 text-[9px] font-semibold tracking-[0.12em] text-[#f2b84b]">{number}</span><div><h2 className="text-xl font-semibold tracking-[-0.025em]">{title}</h2><p className="mt-1 max-w-3xl text-[11px] leading-5 text-[#748298]">{description}</p></div></div>;
}

function DataPoint({ label, value, accent, good }: { label: string; value: string; accent?: boolean; good?: boolean }) {
  return <div className="rounded-xl border border-white/[0.055] bg-white/[0.022] p-3"><p className="text-[8px] text-[#617087]">{label}</p><p className={`mt-1.5 text-[12px] font-semibold tabular-nums ${accent ? "text-[#ff8e99]" : good ? "text-[#62dbbd]" : "text-[#d6dfeb]"}`}>{value}</p></div>;
}

function StateBadge({ state }: { state: "Suspected" | "Corroborated" | "Confirmed" }) {
  const classes = state === "Confirmed" ? "border-[#31c7a2]/20 bg-[#31c7a2]/10 text-[#67ddbf]" : state === "Corroborated" ? "border-[#f2b84b]/20 bg-[#f2b84b]/10 text-[#e5bc67]" : "border-white/[0.08] bg-white/[0.035] text-[#75849a]";
  return <span className={`rounded-full border px-2 py-0.5 text-[8px] ${classes}`}>{state}</span>;
}

function MethodCard({ icon: Icon, title, text }: { icon: typeof Target; title: string; text: string }) {
  return <article className="rounded-2xl border border-white/[0.065] bg-white/[0.018] p-5"><span className="grid size-9 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-[#f2b84b]"><Icon className="size-4" /></span><h3 className="mt-4 text-[11px] font-semibold text-[#cdd7e3]">{title}</h3><p className="mt-2 text-[9px] leading-5 text-[#66758c]">{text}</p></article>;
}
