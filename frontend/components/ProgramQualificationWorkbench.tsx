"use client";

import { useMemo, useRef, useState } from "react";
import { Activity, Download, FileCheck2, FileUp, RotateCcw, ShieldAlert, ShieldCheck } from "lucide-react";
import {
  analyzeProgramQualification,
  MAX_QUALIFICATION_FILE_BYTES,
  parseQualificationCsv,
  qualificationCriteriaIssues,
  QUALIFICATION_CSV_HEADERS,
  type ProgramMetrics,
  type QualificationCriteria,
  type QualificationRow,
} from "@/lib/program-qualification";

type ImportInfo = { hash: string; rowCount: number; bytes: number; importedAt: string };
type StudyContext = { sourceAlias: string; product: string; qualificationId: string; planRevision: string; criteriaReference: string; goldenReference: string };

const EMPTY_CRITERIA: QualificationCriteria = {
  minPairedUnits: null,
  minPairedCoveragePct: null,
  minLots: null,
  minUnitsPerLot: null,
  minSites: null,
  minGoldenUnits: null,
  minGoldenAgreementPct: null,
  maxFpyLossPp: null,
  maxDppmIncrease: null,
  maxPairedDiscordancePct: null,
  maxP95TimeIncreasePct: null,
  maxSiteSpreadPp: null,
  maxWorstLotFpyLossPp: null,
};

const CRITERIA_FIELDS: Array<{ key: keyof QualificationCriteria; label: string; unit: string; min: number; max: number; step: number }> = [
  { key: "minPairedUnits", label: "최소 paired unit", unit: "units", min: 1, max: 100_000, step: 1 },
  { key: "minPairedCoveragePct", label: "최소 Candidate paired coverage", unit: "%", min: 0, max: 100, step: 0.1 },
  { key: "minLots", label: "최소 qualification LOT", unit: "lots", min: 1, max: 100_000, step: 1 },
  { key: "minUnitsPerLot", label: "LOT별 최소 paired unit", unit: "units / LOT", min: 1, max: 100_000, step: 1 },
  { key: "minSites", label: "최소 multi-site 수", unit: "sites", min: 1, max: 128, step: 1 },
  { key: "minGoldenUnits", label: "최소 golden unit", unit: "units", min: 1, max: 100_000, step: 1 },
  { key: "minGoldenAgreementPct", label: "최소 golden set 판정 일치율", unit: "%", min: 0, max: 100, step: 0.001 },
  { key: "maxFpyLossPp", label: "허용 FPY 하락", unit: "%p", min: 0, max: 100, step: 0.001 },
  { key: "maxDppmIncrease", label: "허용 final-fail DPPM 증가", unit: "DPPM", min: 0, max: 1_000_000, step: 0.1 },
  { key: "maxPairedDiscordancePct", label: "허용 paired 불일치", unit: "%", min: 0, max: 100, step: 0.001 },
  { key: "maxP95TimeIncreasePct", label: "허용 P95 시간 증가", unit: "%", min: 0, max: 500, step: 0.1 },
  { key: "maxSiteSpreadPp", label: "허용 site FPY 편차", unit: "%p", min: 0, max: 100, step: 0.001 },
  { key: "maxWorstLotFpyLossPp", label: "최악 LOT 허용 FPY 하락", unit: "%p", min: 0, max: 100, step: 0.001 },
];

const EMPTY_CONTEXT: StudyContext = { sourceAlias: "", product: "", qualificationId: "", planRevision: "", criteriaReference: "", goldenReference: "" };

function sha256(value: string): Promise<string> {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)).then((digest) =>
    [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join(""),
  );
}

function syntheticRows(): QualificationRow[] {
  const rows: QualificationRow[] = [];
  const sites = ["SITE-A", "SITE-B", "SITE-C", "SITE-D"];
  const revisions = ["DEMO-BASE-01", "DEMO-CAND-02"];
  for (const site of sites) {
    for (let index = 0; index < 128; index += 1) {
      const unitId = `${site}-U${String(index + 1).padStart(3, "0")}`;
      const goldenExpected = index < 16 ? index < 15 : null;
      for (const [revisionIndex, programRevision] of revisions.entries()) {
        const firstPass = goldenExpected !== false && !(index === 100 && revisionIndex === 0);
        rows.push({
          unitId,
          lotId: `DEMO-LOT-${site}`,
          testStage: "DEMO-FT",
          condition: "DEMO-ROOM-CONDITION",
          programRevision,
          site,
          testerId: `${site}-DEMO-TESTER`,
          firstPass,
          finalPass: index === 15 ? false : true,
          retestCount: index === 100 && revisionIndex === 0 ? 1 : 0,
          firstBin: firstPass ? "" : index === 15 ? "DEMO-B07" : "DEMO-B19",
          finalBin: index === 15 ? "DEMO-B07" : "",
          testTimeSec: (revisionIndex === 0 ? 2.60 : 2.35) + (index % 5) * 0.01,
          goldenExpected,
        });
      }
    }
  }
  return rows;
}

function serializeDemoCsv(rows: QualificationRow[]): string {
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  return [
    QUALIFICATION_CSV_HEADERS.join(","),
    ...rows.map((row) => [row.unitId, row.lotId, row.testStage, row.condition, row.programRevision, row.site, row.testerId, row.firstPass ? "PASS" : "FAIL", row.finalPass ? "PASS" : "FAIL", String(row.retestCount), row.firstBin, row.finalBin, row.goldenExpected === null ? "" : row.goldenExpected ? "PASS" : "FAIL", String(row.testTimeSec)].map(escape).join(",")),
  ].join("\r\n");
}

function downloadText(filename: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Metric({ label, baseline, candidate, delta }: { label: string; baseline: string; candidate: string; delta: string }) {
  return <div className="min-w-0 rounded-xl border border-white/[0.07] bg-[#09121f]/75 p-3"><p className="text-sm font-medium text-[#a9b8ca]">{label}</p><div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-end gap-2 text-sm"><span className="truncate text-[#becada]" title={baseline}>{baseline}</span><span className="text-[#53657c]">→</span><span className="truncate text-right font-semibold text-[#e5edf7]" title={candidate}>{candidate}</span></div><p className="mt-2 text-xs tabular-nums text-[#83c8e9]">변화 {delta}</p></div>;
}

function GateState({ state }: { state: string }) {
  const style = state === "PASS" ? "border-[#31c7a2]/25 bg-[#31c7a2]/[0.08] text-[#6de0c2]" : state === "FAIL" || state === "데이터 부족" ? "border-[#f36b78]/25 bg-[#f36b78]/[0.08] text-[#ff9aa3]" : "border-[#f2b84b]/25 bg-[#f2b84b]/[0.07] text-[#ffd16b]";
  return <span className={`shrink-0 rounded-md border px-2 py-1 text-xs font-semibold ${style}`}>{state}</span>;
}

function metricsForReport(metrics: ProgramMetrics, revisionLabel: string) {
  return {
    ...metrics,
    revision: revisionLabel,
    firstPassPct: Number(metrics.firstPassPct.toFixed(6)),
    finalPassPct: Number(metrics.finalPassPct.toFixed(6)),
    observedFinalDppm: Number(metrics.observedFinalDppm.toFixed(3)),
    p95TimeSec: Number(metrics.p95TimeSec.toFixed(6)),
    retestRatePct: Number(metrics.retestRatePct.toFixed(6)),
    retestRecoveryPct: metrics.retestRecoveryPct === null ? null : Number(metrics.retestRecoveryPct.toFixed(6)),
    siteYields: metrics.siteYields.map((site, index) => ({ ...site, site: `SITE-${String(index + 1).padStart(2, "0")}`, firstPassPct: Number(site.firstPassPct.toFixed(6)) })),
    siteSpreadPp: Number(metrics.siteSpreadPp.toFixed(6)),
  };
}

export function ProgramQualificationWorkbench() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<QualificationRow[]>([]);
  const [importInfo, setImportInfo] = useState<ImportInfo | null>(null);
  const [revisions, setRevisions] = useState<string[]>([]);
  const [baselineRevision, setBaselineRevision] = useState("");
  const [candidateRevision, setCandidateRevision] = useState("");
  const [criteria, setCriteria] = useState<QualificationCriteria>(EMPTY_CRITERIA);
  const [context, setContext] = useState<StudyContext>(EMPTY_CONTEXT);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const analysisState = useMemo(() => {
    if (!rows.length || !baselineRevision || !candidateRevision) return { analysis: null, error: "" };
    try { return { analysis: analyzeProgramQualification({ rows, baselineRevision, candidateRevision, criteria }), error: "" }; }
    catch (reason) { return { analysis: null, error: reason instanceof Error ? reason.message : "비교 데이터를 계산할 수 없습니다." }; }
  }, [rows, baselineRevision, candidateRevision, criteria]);

  const contextReady = Object.values(context).every((value) => value.trim().length > 0);
  const criteriaIssues = qualificationCriteriaIssues(criteria);
  const criteriaReady = Object.values(criteria).every((value) => value !== null) && criteriaIssues.length === 0;
  const readyForReview = Boolean(contextReady && criteriaReady && importInfo && analysisState.analysis?.disposition === "ENGINEERING REVIEW 가능");
  const worstLots = useMemo(() => analysisState.analysis ? [...analysisState.analysis.lotComparisons].sort((a, b) => a.deltaPp - b.deltaPp).slice(0, 20) : [], [analysisState.analysis]);

  async function loadCsv(file: File) {
    setBusy(true);
    setError("");
    setNotice("");
    setRows([]);
    setImportInfo(null);
    setRevisions([]);
    setBaselineRevision("");
    setCandidateRevision("");
    setCriteria(EMPTY_CRITERIA);
    setContext(EMPTY_CONTEXT);
    try {
      if (file.size > MAX_QUALIFICATION_FILE_BYTES) throw new Error("파일은 8 MiB 이하로 선택해 주세요.");
      const text = await file.text();
      const parsed = parseQualificationCsv(text);
      const available = [...new Set(parsed.map((row) => row.programRevision))].sort();
      if (available.length !== 2) throw new Error("한 번의 비교 study 파일에는 Baseline과 Candidate, 두 revision만 넣어 주세요.");
      const hash = await sha256(text);
      setRows(parsed);
      setRevisions(available);
      setBaselineRevision("");
      setCandidateRevision("");
      setImportInfo({ hash, rowCount: parsed.length, bytes: file.size, importedAt: new Date().toISOString() });
      setNotice(`${parsed.length.toLocaleString()}개 행을 브라우저 메모리에서 읽었습니다. 이 분석 기능은 CSV를 서버로 보내거나 저장하지 않습니다.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "CSV를 읽지 못했습니다.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function loadSyntheticExample() {
    setBusy(true);
    setError("");
    const example = syntheticRows();
    const csv = serializeDemoCsv(example);
    const hash = await sha256(csv);
    setRows(example);
    setRevisions(["DEMO-BASE-01", "DEMO-CAND-02"]);
    setBaselineRevision("DEMO-BASE-01");
    setCandidateRevision("DEMO-CAND-02");
    setCriteria({ minPairedUnits: 500, minPairedCoveragePct: 100, minLots: 4, minUnitsPerLot: 32, minSites: 4, minGoldenUnits: 60, minGoldenAgreementPct: 99.7, maxFpyLossPp: 0.2, maxDppmIncrease: 500, maxPairedDiscordancePct: 0.9, maxP95TimeIncreasePct: 5, maxSiteSpreadPp: 2, maxWorstLotFpyLossPp: 0.5 });
    setContext({ sourceAlias: "DEMO-SOURCE-01", product: "DEMO-MEMORY-DEVICE", qualificationId: "DEMO-QUAL-01", planRevision: "DEMO-PLAN-R1", criteriaReference: "DEMO-CRITERIA-R1", goldenReference: "DEMO-GOLDEN-R1" });
    setImportInfo({ hash, rowCount: example.length, bytes: new Blob([csv]).size, importedAt: new Date().toISOString() });
    setNotice("예시 데이터와 기준은 동작 설명용으로 생성했습니다. 현장 기준이나 제품 판정에 사용하면 안 됩니다.");
    setBusy(false);
  }

  function clearStudy() {
    setRows([]);
    setImportInfo(null);
    setRevisions([]);
    setBaselineRevision("");
    setCandidateRevision("");
    setCriteria(EMPTY_CRITERIA);
    setContext(EMPTY_CONTEXT);
    setError("");
    setNotice("이 브라우저 메모리에서 study 데이터를 지웠습니다.");
  }

  function exportReport() {
    const analysis = analysisState.analysis;
    if (!analysis || !importInfo || !readyForReview) return;
    const report = {
      schema: "yieldscope.program-qualification-report.v2",
      generatedAt: new Date().toISOString(),
      evidence: { sourceAlias: context.sourceAlias, sourceSha256: importInfo.hash, sourceRowCount: importInfo.rowCount, sourceBytes: importInfo.bytes, importedAt: importInfo.importedAt, rawRowsIncluded: false },
      study: { ...context, baselineRevision: "Baseline", candidateRevision: "Candidate", criteria },
      computed: {
        disposition: analysis.disposition,
        matchedCount: analysis.matchedCount,
        candidatePairCoveragePct: Number(analysis.candidatePairCoveragePct.toFixed(6)),
        pairedDiscordancePct: Number(analysis.discordancePct.toFixed(6)),
        baselineFailCandidatePassCount: analysis.baselineFailCandidatePassCount,
        baselinePassCandidateFailCount: analysis.baselinePassCandidateFailCount,
        fpyDeltaPp: Number(analysis.fpyDeltaPp.toFixed(6)),
        observedFinalDppmDelta: Number(analysis.dppmDelta.toFixed(3)),
        p95TimeDeltaPct: Number(analysis.p95TimeDeltaPct.toFixed(6)),
        goldenSampleCount: analysis.goldenCount,
        goldenAgreementPct: analysis.goldenAgreementPct === null ? null : Number(analysis.goldenAgreementPct.toFixed(6)),
        goldenFalseFailCount: analysis.goldenFalseFailCount,
        goldenEscapeCount: analysis.goldenEscapeCount,
        worstLotFpyDeltaPp: Number(analysis.worstLotFpyDeltaPp.toFixed(6)),
        lotComparisonCount: analysis.lotComparisons.length,
        lotComparisonsTruncated: analysis.lotComparisons.length > 20,
        lotComparisons: [...analysis.lotComparisons].sort((a, b) => a.deltaPp - b.deltaPp).slice(0, 20).map((lot, index) => ({ lotAlias: `LOT-${String(index + 1).padStart(2, "0")}`, count: lot.count, baselineFpyPct: Number(lot.baselineFpyPct.toFixed(6)), candidateFpyPct: Number(lot.candidateFpyPct.toFixed(6)), deltaPp: Number(lot.deltaPp.toFixed(6)) })),
        baseline: metricsForReport(analysis.baseline, "Baseline"),
        candidate: metricsForReport(analysis.candidate, "Candidate"),
        gates: analysis.gates,
        blockers: analysis.blockers,
      },
      limits: ["This is an engineering review package, not a product release or shipment authorization.", "Approval criteria must come from an authorized product qualification plan.", "The report contains aggregate results and anonymized LOT/SITE aliases, not raw unit rows or source identifiers. Only the 20 worst LOT deltas are included.", "Observed DPPM is the sample's measured failure rate scaled to one million; it is not a production-rate estimate."],
    };
    downloadText(`qualification-${context.qualificationId.replace(/[^a-zA-Z0-9._-]/g, "_")}.json`, JSON.stringify(report, null, 2), "application/json;charset=utf-8");
  }

  const fileTemplate = `${QUALIFICATION_CSV_HEADERS.join(",")}\r\n`;

  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-[#55b8f6]/20 bg-[#0d1725]" aria-labelledby="qualification-workbench-title">
      <div className="border-b border-white/[0.07] bg-[linear-gradient(120deg,rgba(85,184,246,0.08),rgba(10,18,31,0.1)_58%,rgba(49,199,162,0.04))] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[#8fcbe9]"><Activity className="size-4" /> P&amp;T TEST PROGRAM QUALIFICATION</div>
            <h3 id="qualification-workbench-title" className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[#eef4fb]">Program 변경 근거를 원자료로 검증</h3>
            <p className="mt-2 max-w-3xl text-base leading-7 text-[#92a2b7]">같은 unit·LOT·stage·corner·site·tester의 결과만 짝지어 FPY, 관측 DPPM, retest, multi-site와 P95 test time을 비교합니다. 기준은 승인 plan에서 가져옵니다.</p>
          </div>
          <span className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-[#31c7a2]/20 bg-[#31c7a2]/[0.05] px-3 text-xs font-semibold text-[#74dac0]"><ShieldCheck className="size-4" /> Decision support · 승인 대체 불가</span>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-white/[0.06] bg-[#08111e]/65 px-3 py-2.5 text-xs leading-5 text-[#9aabc0]"><strong className="text-[#d7e3f1]">1 · Pair</strong><br />한 stage/corner, 동일 unit·site·tester</div>
          <div className="rounded-lg border border-white/[0.06] bg-[#08111e]/65 px-3 py-2.5 text-xs leading-5 text-[#9aabc0]"><strong className="text-[#d7e3f1]">2 · Gate</strong><br />제품별 승인 plan의 기준값을 적용</div>
          <div className="rounded-lg border border-white/[0.06] bg-[#08111e]/65 px-3 py-2.5 text-xs leading-5 text-[#9aabc0]"><strong className="text-[#d7e3f1]">3 · Review</strong><br />완료 결과를 추적 가능한 검토 JSON으로 내보내기</div>
        </div>
      </div>

      <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
        <div className="min-w-0 space-y-4">
          <div className="rounded-xl border border-[#f2b84b]/20 bg-[#f2b84b]/[0.045] p-4 text-sm leading-6 text-[#d5c18f]">
            <div className="flex items-start gap-2"><ShieldAlert className="mt-0.5 size-4 shrink-0 text-[#f2c363]" /><p className="text-base leading-7"><strong className="text-[#f3d89a]">공개 데모의 보안 경계</strong><br />이 분석 기능은 파일을 브라우저 메모리에서 계산하며 backend로 전송·저장하지 않습니다. 다만 현재 공개 웹사이트는 사내 승인 시스템이 아닙니다. 실제 제품/고객/LOT·serial/program ID, 내부 spec·문서 번호를 입력하지 말고 합성·익명 데이터만 사용하세요. 현장 적용 전 사내망 배포, 인증·권한·감사 로그·보안 검토가 필요합니다.</p></div>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#09121f]/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h4 className="text-base font-semibold text-[#e5edf7]">시험 데이터</h4><p className="mt-1 text-xs leading-5 text-[#8394aa]">UTF-8 CSV · 최대 8 MiB / 100,000행 · 한 test stage / condition</p></div><div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#55b8f6] px-3 text-sm font-semibold text-[#071522] disabled:opacity-50"><FileUp className="size-4" /> CSV 선택</button>
              <button type="button" onClick={() => downloadText("program-qualification-template.csv", fileTemplate, "text/csv;charset=utf-8")} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-[#b8c6d7]"><Download className="size-4" /> 양식</button>
            </div></div>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="sr-only" aria-label="qualification CSV 파일 선택" onChange={(event) => { const file = event.target.files?.[0]; if (file) void loadCsv(file); }} />
            <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => void loadSyntheticExample()} disabled={busy} className="min-h-11 rounded-lg border border-[#55b8f6]/20 px-3 text-sm text-[#9dd4f3] disabled:opacity-50">합성 예시 불러오기</button><button type="button" onClick={clearStudy} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/[0.08] px-3 text-sm text-[#a0adbd]"><RotateCcw className="size-3.5" /> 초기화</button></div>
            {importInfo && <div className="mt-4 rounded-lg border border-white/[0.06] bg-[#070e18] p-3 text-xs leading-5 text-[#8c9db2]"><p className="text-[#d2dce9]">원본 행 {importInfo.rowCount.toLocaleString()} · {(importInfo.bytes / 1024).toFixed(1)} KiB · Program {revisions.join(" / ")}</p><p className="break-all">SHA-256 · {importInfo.hash}</p><p>읽은 시각 · {new Date(importInfo.importedAt).toLocaleString("ko-KR")}</p><p className="mt-1">파일명은 화면·내보내기 결과에 기록하지 않습니다.</p></div>}
            {busy && <p role="status" className="mt-3 text-sm text-[#9dd4f3]">브라우저에서 파일을 검증하고 있습니다…</p>}
            {error && <p role="alert" className="mt-3 rounded-lg border border-[#f36b78]/20 bg-[#f36b78]/[0.05] p-3 text-sm leading-5 text-[#ff9aa3]">{error}</p>}
            {notice && <p role="status" className="mt-3 text-xs leading-5 text-[#87cdb7]">{notice}</p>}
          </div>

          <fieldset className="rounded-xl border border-white/[0.08] bg-[#09121f]/70 p-4">
            <legend className="px-1 text-base font-semibold text-[#e5edf7]">Qualification traceability</legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {([
                ["sourceAlias", "원자료 별칭", "예: QL-2026-01 (내부 파일명 금지)"],
                ["product", "제품 alias", "예: DEMO-DEVICE-A (P/N 금지)"],
                ["qualificationId", "Qualification run alias", "내부 run ID 대신 익명 별칭"],
                ["planRevision", "승인 Test Plan alias", "승인 plan의 익명 reference"],
                ["criteriaReference", "승인 기준 문서 alias", "실제 spec / 고객 문서 번호 금지"],
                ["goldenReference", "Golden set alias", "승인 sample set의 익명 reference"],
              ] as const).map(([key, label, placeholder]) => <label key={key} className="min-w-0 text-sm font-medium text-[#aebed0]">{label}<input value={context[key]} onChange={(event) => setContext((current) => ({ ...current, [key]: event.target.value }))} maxLength={120} placeholder={placeholder} className="mt-1 min-h-11 w-full rounded-lg border border-white/[0.09] bg-[#070e18] px-3 text-sm text-[#e2eaf4] outline-none focus:border-[#55b8f6]/50" /></label>)}
              <label className="min-w-0 text-xs font-medium text-[#aebed0]">Baseline revision<select value={baselineRevision} onChange={(event) => setBaselineRevision(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-white/[0.09] bg-[#070e18] px-3 text-sm text-[#e2eaf4]" disabled={!revisions.length}><option value="">Baseline 선택</option>{revisions.map((revision) => <option key={revision} value={revision}>{revision}</option>)}</select></label>
              <label className="min-w-0 text-xs font-medium text-[#aebed0]">Candidate revision<select value={candidateRevision} onChange={(event) => setCandidateRevision(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-white/[0.09] bg-[#070e18] px-3 text-sm text-[#e2eaf4]" disabled={!revisions.length}><option value="">Candidate 선택</option>{revisions.map((revision) => <option key={revision} value={revision}>{revision}</option>)}</select></label>
            </div>
            <p className="mt-3 text-xs leading-5 text-[#74869c]">두 revision의 비교 결과를 내보내기 전에 익명 traceability alias를 입력하세요. 파일명·unit·LOT·site ID는 JSON에 싣지 않습니다. 참조 문서의 진위나 승인 권한은 확인하지 않습니다. Paired 실행 순서·재시험에 따른 carry-over 영향은 승인된 plan에서 통제해야 합니다.</p>
          </fieldset>

          <fieldset className="rounded-xl border border-white/[0.08] bg-[#09121f]/70 p-4">
            <legend className="px-1 text-base font-semibold text-[#e5edf7]">사용자 정의 qualification 기준</legend>
            <p className="mb-3 mt-1 text-sm leading-6 text-[#8394aa]">아래 값은 빈칸으로 시작합니다. 승인된 제품별 plan에서 값을 확인해 입력하세요. 합성 예시 기준은 현장에 적용하지 마세요.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {CRITERIA_FIELDS.map((field) => <label key={field.key} className="min-w-0 text-sm font-medium text-[#aebed0]">{field.label}<div className="mt-1 flex items-center gap-2"><input type="number" inputMode="decimal" min={field.min} max={field.max} step={field.step} value={criteria[field.key] ?? ""} onChange={(event) => setCriteria((current) => ({ ...current, [field.key]: event.target.value === "" ? null : Number(event.target.value) }))} placeholder="승인 기준 입력" className="min-h-11 min-w-0 flex-1 rounded-lg border border-white/[0.09] bg-[#070e18] px-3 text-sm text-[#e2eaf4] outline-none focus:border-[#55b8f6]/50" /><span className="shrink-0 text-right text-xs text-[#6c7d92]">{field.unit}</span></div></label>)}
            </div>
          </fieldset>
        </div>

        <div className="min-w-0 space-y-4">
          <div className={`rounded-xl border p-4 sm:p-5 ${readyForReview ? "border-[#31c7a2]/25 bg-[#31c7a2]/[0.045]" : analysisState.analysis?.blockers.some((item) => item.includes("FAIL") || item.includes("데이터 부족")) ? "border-[#f36b78]/20 bg-[#f36b78]/[0.035]" : "border-[#f2b84b]/20 bg-[#f2b84b]/[0.035]"}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="text-xs font-semibold tracking-[0.12em] text-[#8b9bb0]">AUTOMATED GATE SUMMARY</p><h4 className="mt-1 break-keep text-xl font-semibold text-[#eef4fb]">{!rows.length ? "CSV를 선택해 분석 시작" : !baselineRevision || !candidateRevision ? "비교 revision 선택 필요" : !contextReady || !criteriaReady ? "기준·추적정보 입력 필요" : analysisState.analysis?.disposition ?? "짝지은 데이터 확인 필요"}</h4><p className="mt-1 text-sm leading-5 text-[#9baabe]">{readyForReview ? "계산된 gate를 통과했습니다. 제품·출하 판정 전에 승인 권한자의 검토·서명이 남아 있습니다." : "누락 또는 실패 gate를 확인하고 원자료·승인 기준을 다시 검토하세요."}</p></div>
              <button type="button" onClick={exportReport} disabled={!readyForReview} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#f2b84b] px-3.5 text-sm font-semibold text-[#20170b] disabled:cursor-not-allowed disabled:opacity-40"><Download className="size-4" /> 검토 보고서 JSON</button></div>
            {analysisState.error && <p role="alert" className="mt-3 text-sm text-[#ff9aa3]">{analysisState.error}</p>}
          </div>

          {analysisState.analysis && <>
            <div className="grid gap-2 sm:grid-cols-2">
              <Metric label="Paired first-pass yield" baseline={`${analysisState.analysis.baseline.firstPassPct.toFixed(3)}%`} candidate={`${analysisState.analysis.candidate.firstPassPct.toFixed(3)}%`} delta={`${analysisState.analysis.fpyDeltaPp >= 0 ? "+" : ""}${analysisState.analysis.fpyDeltaPp.toFixed(3)}%p`} />
              <Metric label="Observed final-fail DPPM" baseline={analysisState.analysis.baseline.observedFinalDppm.toFixed(1)} candidate={analysisState.analysis.candidate.observedFinalDppm.toFixed(1)} delta={`${analysisState.analysis.dppmDelta >= 0 ? "+" : ""}${analysisState.analysis.dppmDelta.toFixed(1)} · sample 관측치`} />
              <Metric label="P95 test time" baseline={`${analysisState.analysis.baseline.p95TimeSec.toFixed(3)} sec`} candidate={`${analysisState.analysis.candidate.p95TimeSec.toFixed(3)} sec`} delta={`${analysisState.analysis.p95TimeDeltaPct >= 0 ? "+" : ""}${analysisState.analysis.p95TimeDeltaPct.toFixed(2)}%`} />
              <Metric label="Retest recovery · first FAIL → final PASS" baseline={analysisState.analysis.baseline.retestRecoveryPct === null ? "해당 없음" : `${analysisState.analysis.baseline.retestRecoveryPct.toFixed(2)}%`} candidate={analysisState.analysis.candidate.retestRecoveryPct === null ? "해당 없음" : `${analysisState.analysis.candidate.retestRecoveryPct.toFixed(2)}%`} delta={`retest ${analysisState.analysis.baseline.retestCountTotal} → ${analysisState.analysis.candidate.retestCountTotal}회`} />
              <Metric label="Paired first-pass discordance" baseline={`${analysisState.analysis.matchedCount.toLocaleString()} paired units`} candidate={`${analysisState.analysis.discordancePct.toFixed(3)}% discordant`} delta={`F→P ${analysisState.analysis.baselineFailCandidatePassCount} · P→F ${analysisState.analysis.baselinePassCandidateFailCount}`} />
              <Metric label="Golden set 판정 일치율" baseline={`${analysisState.analysis.goldenCount.toLocaleString()} labeled`} candidate={analysisState.analysis.goldenAgreementPct === null ? "판정 불가" : `${analysisState.analysis.goldenAgreementPct.toFixed(3)}%`} delta={`false-fail ${analysisState.analysis.goldenFalseFailCount} · escape ${analysisState.analysis.goldenEscapeCount}`} />
              <Metric label="Candidate site FPY spread" baseline={`${analysisState.analysis.candidate.siteYields.length} sites`} candidate={`${analysisState.analysis.candidate.siteSpreadPp.toFixed(3)}%p`} delta="paired cohort · max − min" />
            </div>

            <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#09121f]/65">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] p-4"><div><h4 className="text-base font-semibold text-[#e5edf7]">Gate별 근거</h4><p className="mt-1 text-xs text-[#8495aa]">승인 기준 alias: {context.criteriaReference.trim() || "미입력"}</p></div><span className="text-xs text-[#8495aa]">paired {analysisState.analysis.matchedCount.toLocaleString()} / {analysisState.analysis.candidatePairCoveragePct.toFixed(2)}% coverage</span></div>
              <div className="divide-y divide-white/[0.05]">{analysisState.analysis.gates.map((item) => <div key={item.key} className="grid min-w-0 gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(110px,0.7fr)_auto] sm:items-center"><div className="min-w-0"><p className="text-sm font-medium text-[#d5dfeb]">{item.label}</p><p className="mt-0.5 text-xs text-[#8495aa]">실측 {item.actual} · 기준 {item.criterion}</p></div><GateState state={item.state} /><span className="sr-only">{item.state}</span></div>)}</div>
            </div>

            <div className="rounded-xl border border-white/[0.07] bg-[#09121f]/55 p-4">
              <h4 className="text-sm font-semibold text-[#dce5ef]">Site 결과 · first-pass 수율</h4>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">{analysisState.analysis.candidate.siteYields.map((site) => <div key={site.site} className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] px-3 py-2 text-sm"><span className="min-w-0 truncate text-[#aebed0]">{site.site}</span><span className="shrink-0 tabular-nums text-[#e2eaf4]">{site.firstPassPct.toFixed(3)}% <span className="text-xs text-[#708198]">({site.count})</span></span></div>)}</div>
              <p className="mt-3 text-xs leading-5 text-[#74869c]">지표는 동일 paired unit만 사용합니다. Site 편차 신호는 원인 확정이 아니며, tester·load board·handler·온도·contact 상태를 별도 확인해야 합니다.</p>
            </div>

            <div className="rounded-xl border border-white/[0.07] bg-[#09121f]/55 p-4">
              <h4 className="text-sm font-semibold text-[#dce5ef]">LOT별 paired FPY 변화 · worst {worstLots.length} / {analysisState.analysis.lotComparisons.length}</h4>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">{worstLots.map((lot) => <div key={lot.lotId} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-white/[0.06] px-3 py-2 text-sm"><span className="min-w-0 truncate text-[#aebed0]" title={lot.lotId}>{lot.lotId}</span><span className={`shrink-0 tabular-nums ${lot.deltaPp < 0 ? "text-[#ff9aa3]" : "text-[#e2eaf4]"}`}>{lot.deltaPp >= 0 ? "+" : ""}{lot.deltaPp.toFixed(3)}%p <span className="text-xs text-[#708198]">({lot.count})</span></span></div>)}</div>
              <p className="mt-3 text-sm leading-6 text-[#8d9eb2]">DPPM은 paired sample의 final FAIL 비율을 1,000,000 기준으로 환산한 관측치이며 생산 DPPM 예측이 아닙니다. P95는 unit test time 필드만 사용하며 handler/index 포함 UPH·TAT를 뜻하지 않습니다.</p>
            </div>
          </>}
          {!analysisState.analysis && !analysisState.error && <div className="grid min-h-56 place-items-center rounded-xl border border-dashed border-white/[0.1] bg-[#09121f]/45 p-6 text-center"><div><FileCheck2 className="mx-auto size-8 text-[#52647c]" /><p className="mt-3 text-sm font-medium text-[#b3c0d1]">원자료를 짝지으면 결과가 여기에 나옵니다</p><p className="mt-1 text-xs leading-5 text-[#74869c]">먼저 CSV를 불러온 뒤 승인 plan, revision, 기준값을 입력하세요.</p></div></div>}
        </div>
      </div>
    </section>
  );
}
