"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Activity, Check, CircleDashed, Download, Layers3, Plus, RotateCcw, ShieldAlert, Trash2 } from "lucide-react";

import {
  PACKAGE_PLAN_STORAGE_KEY,
  PACKAGE_PROFILES,
  createEmptyPackagePlan,
  createEmptyPackageRunContext,
  type PackageCheck,
  type PackageCheckScope,
  type PackageCheckRecord,
  type PackageCheckStatus,
  type PackagePlanState,
  type PackageProfile,
  type PackageProfileKey,
  type PackageRunContext,
} from "@/lib/package-testing";

const STATUS_OPTIONS: PackageCheckStatus[] = ["미실행", "PASS", "WATCH", "FAIL", "N/A"];

const statusClasses: Record<PackageCheckStatus, string> = {
  미실행: "border-white/[0.1] bg-white/[0.035] text-[#9aa8bb]",
  PASS: "border-[#31c7a2]/20 bg-[#31c7a2]/[0.08] text-[#6de0c2]",
  WATCH: "border-[#f2b84b]/20 bg-[#f2b84b]/[0.08] text-[#ffd16b]",
  FAIL: "border-[#f36b78]/20 bg-[#f36b78]/[0.08] text-[#ff9aa3]",
  "N/A": "border-[#55b8f6]/20 bg-[#55b8f6]/[0.07] text-[#a9d9f4]",
};

function validProfile(value: unknown): value is PackageProfileKey {
  return typeof value === "string" && PACKAGE_PROFILES.some((item) => item.key === value);
}

function validRecord(value: unknown): value is PackageCheckRecord {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return STATUS_OPTIONS.includes(item.status as PackageCheckStatus) && typeof item.result === "string" && typeof item.evidence === "string";
}

function validCheck(value: unknown): value is PackageCheck {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" && item.id.startsWith("custom-") && item.id.length <= 96
    && (item.scope === "production" || item.scope === "qualification")
    && typeof item.stage === "string" && item.stage.length <= 48
    && typeof item.title === "string" && item.title.length <= 64
    && typeof item.format === "string" && item.format.length <= 80
    && typeof item.purpose === "string" && item.purpose.length <= 180
    && typeof item.required === "boolean"
    && item.custom === true
    && validRecord(item.demo);
}

function validContext(value: unknown): value is PackageRunContext {
  if (!value || typeof value !== "object") return false;
  const context = value as Record<string, unknown>;
  return ["product", "packageRevision", "lotId", "programRevision", "specRevision", "qualificationId", "qualificationPlanRevision", "owner"]
    .every((key) => typeof context[key] === "string");
}

function validScope(value: unknown): value is PackageCheckScope {
  return value === "production" || value === "qualification";
}

function contextFor(plan: PackagePlanState, key: PackageProfileKey): PackageRunContext {
  const context = plan.contexts?.[key];
  return context && validContext(context) ? context : createEmptyPackageRunContext();
}

const PRODUCTION_CONTEXT_KEYS = ["product", "packageRevision", "lotId", "programRevision", "specRevision", "owner"] as const;
const QUALIFICATION_CONTEXT_KEYS = ["product", "packageRevision", "qualificationId", "qualificationPlanRevision", "specRevision", "owner"] as const;

function contextProgress(context: PackageRunContext, scope: PackageCheckScope) {
  const keys = scope === "production" ? PRODUCTION_CONTEXT_KEYS : QUALIFICATION_CONTEXT_KEYS;
  const complete = keys.filter((key) => context[key].trim().length > 0).length;
  return { complete, total: keys.length, ready: complete === keys.length };
}

function recordFor(plan: PackagePlanState, check: PackageCheck): PackageCheckRecord {
  const stored = plan.records[check.id];
  return stored && validRecord(stored) ? stored : { status: "미실행", result: "", evidence: "" };
}

function evidenceComplete(plan: PackagePlanState, check: PackageCheck): boolean {
  const record = recordFor(plan, check);
  return record.status === "PASS" && record.result.trim().length > 0 && record.evidence.trim().length > 0;
}

function csvCell(value: string): string {
  const safeValue = /^[\s\u0000-\u001f]*[=+@-]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replaceAll('"', '""')}"`;
}

const CONTEXT_LABELS: Record<keyof PackageRunContext, string> = {
  product: "제품 / P/N",
  packageRevision: "Package revision",
  lotId: "LOT / run ID",
  programRevision: "Test Program revision",
  specRevision: "Databook / spec revision",
  qualificationId: "Qualification / sample ID",
  qualificationPlanRevision: "Qual Plan revision",
  owner: "담당 조직",
};

function reviewBlockers(plan: PackagePlanState, checks: PackageCheck[], context: PackageRunContext, scope: PackageCheckScope): string[] {
  const contextKeys = scope === "production" ? PRODUCTION_CONTEXT_KEYS : QUALIFICATION_CONTEXT_KEYS;
  const missingContext = contextKeys.filter((key) => !context[key].trim()).map((key) => CONTEXT_LABELS[key]);
  const scoped = checks.filter((check) => check.scope === scope);
  const failures = scoped.filter((check) => recordFor(plan, check).status === "FAIL").map((check) => `${check.title} · FAIL 원인/조치 확인`);
  const missingEvidence = scoped.filter((check) => check.required && !evidenceComplete(plan, check) && recordFor(plan, check).status !== "FAIL")
    .map((check) => `${check.title} · PASS 결과와 증거 ID 필요`);
  return [...failures, ...missingContext.map((label) => `${label} 입력 필요`), ...missingEvidence];
}

function PackageCheckCard({
  check,
  record,
  onChange,
  onRemove,
}: {
  check: PackageCheck;
  record: PackageCheckRecord;
  onChange: (id: string, next: PackageCheckRecord) => void;
  onRemove?: (id: string) => void;
}) {
  const evidenceRequired = check.required;
  return (
    <article className="min-w-0 rounded-xl border border-white/[0.07] bg-[#0a1320]/65 p-4 sm:p-4.5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 text-[8px]">
            <span className="rounded-md border border-[#55b8f6]/15 bg-[#55b8f6]/[0.06] px-1.5 py-1 font-medium text-[#9bcfea]">{check.stage}</span>
            <span className="text-[#68778d]">{check.required ? "RELEASE GATE" : "POLICY-BASED"}</span>
            {check.custom && <span className="rounded-md border border-[#a78bfa]/20 bg-[#a78bfa]/[0.06] px-1.5 py-1 text-[#c7b8ff]">TEAM ITEM</span>}
          </div>
          <h4 className="mt-2.5 break-words text-[12px] font-semibold leading-5 text-[#dce5ef]">{check.title}</h4>
          <p className="mt-1 break-words text-[9px] font-medium leading-4 text-[#8b9aae]">{check.format}</p>
        </div>
        <label className="shrink-0">
          <span className="sr-only">{check.title} 상태</span>
          <select
            value={record.status}
            onChange={(event) => onChange(check.id, { ...record, status: event.target.value as PackageCheckStatus })}
            className={`min-h-10 w-full rounded-lg border px-3 text-[10px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-[#55b8f6]/60 sm:w-[126px] ${statusClasses[record.status]}`}
          >
            {STATUS_OPTIONS.map((status) => <option key={status} value={status} className="bg-[#101a29] text-white">{status}</option>)}
          </select>
        </label>
      </div>
      <p className="mt-3 text-[9px] leading-5 text-[#7f8ea2]">{check.purpose}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="min-w-0">
          <span className="mb-1 block text-[8px] font-medium text-[#738198]">결과 / 표본 수 {evidenceRequired && <span className="text-[#e3b95d]">· PASS 증거 필수</span>}</span>
          <input
            value={record.result}
            onChange={(event) => onChange(check.id, { ...record, result: event.target.value })}
            maxLength={120}
            placeholder="예: 24 / 24 통과, corner 측정값"
            className="min-h-10 w-full min-w-0 rounded-lg border border-white/[0.075] bg-[#080f1a] px-3 text-[9px] text-[#d4deea] outline-none placeholder:text-[#4e5e74] focus:border-[#55b8f6]/35 focus:ring-2 focus:ring-[#55b8f6]/10"
          />
        </label>
        <label className="min-w-0">
          <span className="mb-1 block text-[8px] font-medium text-[#738198]">기준 출처 / 증거 ID {evidenceRequired && <span className="text-[#e3b95d]">· 필수</span>}</span>
          <input
            value={record.evidence}
            onChange={(event) => onChange(check.id, { ...record, evidence: event.target.value })}
            maxLength={120}
            placeholder="Databook rev, Qual plan, report ID"
            className="min-h-10 w-full min-w-0 rounded-lg border border-white/[0.075] bg-[#080f1a] px-3 text-[9px] text-[#d4deea] outline-none placeholder:text-[#4e5e74] focus:border-[#55b8f6]/35 focus:ring-2 focus:ring-[#55b8f6]/10"
          />
        </label>
      </div>
      {record.status === "PASS" && evidenceRequired && (!record.result.trim() || !record.evidence.trim()) && (
        <p className="mt-2 flex items-center gap-1.5 text-[8px] text-[#ffd16b]"><ShieldAlert className="size-3 shrink-0" /> 결과와 기준/증거 ID를 기록해야 gate 완료로 집계됩니다.</p>
      )}
      {onRemove && (
        <button type="button" onClick={() => onRemove(check.id)} className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/[0.07] px-2.5 text-[8px] text-[#8997aa] transition hover:border-[#f36b78]/25 hover:text-[#ff9aa3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55b8f6]/50">
          <Trash2 className="size-3" /> 팀 항목 제거
        </button>
      )}
    </article>
  );
}

function PlanLane({
  profile,
  plan,
  scope,
  onChange,
  context,
  onRemove,
}: {
  profile: PackageProfile;
  plan: PackagePlanState;
  scope: "production" | "qualification";
  onChange: (id: string, next: PackageCheckRecord) => void;
  context: PackageRunContext;
  onRemove: (id: string) => void;
}) {
  const checks = profile.checks.filter((check) => check.scope === scope);
  const required = checks.filter((check) => check.required);
  const complete = required.filter((check) => evidenceComplete(plan, check)).length;
  const failing = checks.filter((check) => recordFor(plan, check).status === "FAIL").length;
  const traceability = contextProgress(context, scope);
  const label = scope === "production" ? "PRODUCTION SCREEN" : "RELIABILITY QUALIFICATION";
  const title = scope === "production" ? "양산 선별 · 전기 검사" : "샘플 기반 신뢰성 · 구조 검증";
  const caption = scope === "production"
    ? "제품 / LOT 판정에 연결되는 release gate. 해당 제품의 승인된 coverage와 limit을 입력합니다."
    : "별도 표본·stress 계획으로 qualification 상태를 관리합니다. 양산 LOT screen과 수량·판정 의미가 다릅니다.";
  const laneStatus = failing > 0 ? "FAIL" : complete === required.length && traceability.ready ? "CLOSED" : "OPEN";

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-[#0c1523]/55 p-4 sm:p-5" aria-label={title}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[8px] font-semibold tracking-[0.14em] text-[#728198]">{label}</p>
          <h3 className="mt-1.5 text-[14px] font-semibold text-[#e4ebf4]">{title}</h3>
          <p className="mt-1 max-w-3xl text-[9px] leading-5 text-[#78879c]">{caption}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`rounded-lg border px-2.5 py-1.5 text-[8px] font-semibold ${laneStatus === "CLOSED" ? "border-[#31c7a2]/20 bg-[#31c7a2]/[0.06] text-[#6de0c2]" : laneStatus === "FAIL" ? "border-[#f36b78]/20 bg-[#f36b78]/[0.06] text-[#ff9aa3]" : "border-[#f2b84b]/20 bg-[#f2b84b]/[0.06] text-[#ffd16b]"}`}>
            {scope === "production" ? (laneStatus === "CLOSED" ? "PLAN COMPLETE" : laneStatus === "FAIL" ? "REVIEW HOLD" : "PLAN OPEN") : laneStatus === "CLOSED" ? "PLAN COMPLETE" : laneStatus === "FAIL" ? "ISSUE" : "QUAL OPEN"}
          </span>
          <span className="text-[9px] tabular-nums text-[#8290a4]">{complete}/{required.length} 증거 · {traceability.complete}/{traceability.total} 추적정보</span>
        </div>
      </div>
      <div className="mt-4 grid min-w-0 gap-2.5 xl:grid-cols-2">
        {checks.map((check) => (
          <PackageCheckCard key={check.id} check={check} record={recordFor(plan, check)} onChange={onChange} onRemove={check.custom ? onRemove : undefined} />
        ))}
      </div>
    </section>
  );
}

function ContextField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="min-w-0">
      <span className="mb-1 block text-[8px] font-medium text-[#8290a4]">{label}</span>
      <input value={value} maxLength={80} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-10 w-full min-w-0 rounded-lg border border-white/[0.075] bg-[#080f1a] px-3 text-[9px] text-[#d4deea] outline-none placeholder:text-[#4e5e74] focus:border-[#55b8f6]/35 focus:ring-2 focus:ring-[#55b8f6]/10" />
    </label>
  );
}

function ReleaseReview({
  production,
  qualification,
  productionFailed,
  productionReady,
}: {
  production: string[];
  qualification: string[];
  productionFailed: boolean;
  productionReady: boolean;
}) {
  return (
    <section className="mt-4 rounded-2xl border border-[#55b8f6]/20 bg-[#0d1b2b] p-4 sm:p-5" aria-labelledby="package-review-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.12em] text-[#8fcbe9]">ENGINEERING REVIEW</p>
          <h3 id="package-review-title" className="mt-1 text-lg font-semibold text-[#eef4fb]">이번 실행의 차단 사유</h3>
          <p className="mt-1 text-xs leading-5 text-[#a9bacd]">입력된 결과로 필수 증거와 추적정보의 누락을 정리합니다. 실제 출하 판정에는 승인된 제품 기준과 담당자의 검토가 필요합니다.</p>
        </div>
        <span className={`rounded-lg border px-3 py-2 text-xs font-semibold ${productionFailed ? "border-[#f36b78]/30 bg-[#f36b78]/10 text-[#ff9aa3]" : productionReady ? "border-[#31c7a2]/30 bg-[#31c7a2]/10 text-[#6de0c2]" : "border-[#f2b84b]/30 bg-[#f2b84b]/10 text-[#ffd16b]"}`}>
          양산 검토 · {productionFailed ? "HOLD" : productionReady ? "증거 완료" : "확인 필요"}
        </span>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="min-w-0 rounded-xl border border-white/[0.08] bg-[#091522] p-4">
          <div className="flex items-center justify-between gap-2"><h4 className="text-sm font-semibold text-[#e4edf7]">양산 screen</h4><span className="text-xs text-[#93a9bd]">{production.length}건 확인</span></div>
          {production.length ? <ul className="mt-3 space-y-2 text-xs leading-5 text-[#b7c5d6]">{production.slice(0, 5).map((item) => <li key={item} className="flex gap-2"><span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-[#f2b84b]" />{item}</li>)}</ul> : <p className="mt-3 text-xs leading-5 text-[#7ddfc5]">입력된 필수 검사와 추적정보에 누락이 없습니다.</p>}
          {production.length > 5 && <p className="mt-2 text-xs text-[#8395a8]">외 {production.length - 5}건은 아래 검사 카드에서 확인하세요.</p>}
        </div>
        <div className="min-w-0 rounded-xl border border-white/[0.08] bg-[#091522] p-4">
          <div className="flex items-center justify-between gap-2"><h4 className="text-sm font-semibold text-[#e4edf7]">Reliability qualification</h4><span className="text-xs text-[#93a9bd]">{qualification.length}건 확인</span></div>
          {qualification.length ? <ul className="mt-3 space-y-2 text-xs leading-5 text-[#b7c5d6]">{qualification.slice(0, 5).map((item) => <li key={item} className="flex gap-2"><span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-[#55b8f6]" />{item}</li>)}</ul> : <p className="mt-3 text-xs leading-5 text-[#7ddfc5]">입력된 필수 검사와 추적정보에 누락이 없습니다.</p>}
          {qualification.length > 5 && <p className="mt-2 text-xs text-[#8395a8]">외 {qualification.length - 5}건은 아래 검사 카드에서 확인하세요.</p>}
        </div>
      </div>
    </section>
  );
}

function RunContextEditor({
  profile,
  context,
  onChange,
}: {
  profile: PackageProfile;
  context: PackageRunContext;
  onChange: (next: PackageRunContext) => void;
}) {
  const set = (key: keyof PackageRunContext, value: string) => onChange({ ...context, [key]: value });
  return (
    <section className="mt-3 rounded-xl border border-white/[0.06] bg-[#09121f]/60 p-4 sm:p-5" aria-label="실행 추적 정보">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[8px] font-semibold tracking-[0.12em] text-[#64758d]">RUN TRACEABILITY</p>
          <h3 className="mt-1 text-[12px] font-semibold text-[#dce5ef]">제품·LOT·Program 연결</h3>
          <p className="mt-1 text-[9px] leading-5 text-[#7c8ba0]">{profile.label}의 실행 정보를 입력합니다. 양산과 qualification은 서로 다른 식별 필드를 요구하며, 빈 항목이 남으면 해당 lane의 입력 계획은 완료되지 않습니다.</p>
        </div>
        <span className="shrink-0 rounded-lg border border-[#55b8f6]/15 bg-[#55b8f6]/[0.04] px-2.5 py-1.5 text-[8px] text-[#9bcfea]">저장 범위: 이 브라우저</span>
      </div>
      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <div className="min-w-0 rounded-lg border border-white/[0.055] bg-white/[0.012] p-3.5 xl:col-span-2">
          <h4 className="text-[9px] font-semibold text-[#bdc9d8]">공통 제품 컨텍스트</h4>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            <ContextField label="제품 / Customer P/N" value={context.product} placeholder="예: 제품 식별자" onChange={(value) => set("product", value)} />
            <ContextField label="패키지 구조 개정" value={context.packageRevision} placeholder="예: Drawing / package rev" onChange={(value) => set("packageRevision", value)} />
            <ContextField label="Databook / limit 개정" value={context.specRevision} placeholder="예: spec / databook revision" onChange={(value) => set("specRevision", value)} />
            <ContextField label="담당 조직 / 별칭" value={context.owner} placeholder="개인정보 대신 팀 별칭 권장" onChange={(value) => set("owner", value)} />
          </div>
        </div>
        <div className="min-w-0 rounded-lg border border-white/[0.055] bg-white/[0.012] p-3.5">
          <h4 className="text-[9px] font-semibold text-[#bdc9d8]">양산 screen 식별정보</h4>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            <ContextField label="LOT / run ID" value={context.lotId} placeholder="예: LOT 또는 실행 추적 ID" onChange={(value) => set("lotId", value)} />
            <ContextField label="Test Program 개정" value={context.programRevision} placeholder="예: Program rev / checksum ID" onChange={(value) => set("programRevision", value)} />
          </div>
        </div>
        <div className="min-w-0 rounded-lg border border-white/[0.055] bg-white/[0.012] p-3.5">
          <h4 className="text-[9px] font-semibold text-[#bdc9d8]">Reliability qualification 식별정보</h4>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            <ContextField label="Qualification / sample ID" value={context.qualificationId} placeholder="예: qual run 또는 sample set ID" onChange={(value) => set("qualificationId", value)} />
            <ContextField label="승인 Qual Plan 개정" value={context.qualificationPlanRevision} placeholder="예: 승인 계획 revision" onChange={(value) => set("qualificationPlanRevision", value)} />
          </div>
        </div>
      </div>
      <p className="mt-3 text-[8px] leading-5 text-[#68788e]">민감한 제조 식별자나 고객 정보를 공개 데모에 입력하지 마세요. 본 도구는 입력값을 브라우저 localStorage에만 저장하며 서버 전송·계정 간 공유·승인 기록 기능은 제공하지 않습니다.</p>
    </section>
  );
}

function CustomCheckEditor({ onAdd }: { onAdd: (check: PackageCheck) => void }) {
  const [scope, setScope] = useState<PackageCheckScope>("production");
  const [stage, setStage] = useState("");
  const [title, setTitle] = useState("");
  const [format, setFormat] = useState("");
  const [purpose, setPurpose] = useState("");
  const [required, setRequired] = useState(true);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = title.trim();
    const cleanStage = stage.trim();
    if (!cleanTitle || !cleanStage) return;
    const id = `custom-${window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
    onAdd({
      id,
      scope,
      stage: cleanStage,
      title: cleanTitle,
      format: format.trim() || "팀 정의 검사 · 적용 기준 확인",
      purpose: purpose.trim() || "팀 승인 계획에 정의된 기준과 결과를 기록합니다.",
      required,
      custom: true,
      demo: { status: "미실행", result: "", evidence: "" },
    });
    setStage(""); setTitle(""); setFormat(""); setPurpose("");
  }

  return (
    <details className="mt-3 rounded-xl border border-[#a78bfa]/15 bg-[#a78bfa]/[0.025] p-4 sm:p-5">
      <summary className="flex min-h-9 cursor-pointer list-none items-center gap-2 text-[10px] font-semibold text-[#d3c8ff] marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55b8f6]/50">
        <span className="grid size-6 place-items-center rounded-md border border-[#a78bfa]/20 bg-[#a78bfa]/[0.06]"><Plus className="size-3.5" /></span>
        팀별 검사 항목 추가
        <span className="ml-1 text-[8px] font-normal text-[#817a9b]">제품별 검사항목·FA·공정 확인 등을 사용자 정의</span>
      </summary>
      <form onSubmit={submit} className="mt-4 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
        <label className="min-w-0"><span className="mb-1 block text-[8px] text-[#8290a4]">관리 lane</span><select value={scope} onChange={(event) => { if (validScope(event.target.value)) setScope(event.target.value); }} className="min-h-10 w-full rounded-lg border border-white/[0.075] bg-[#080f1a] px-3 text-[9px] text-[#d4deea] outline-none focus:ring-2 focus:ring-[#55b8f6]/30"><option value="production">양산 screen</option><option value="qualification">Reliability qualification</option></select></label>
        <label className="min-w-0"><span className="mb-1 block text-[8px] text-[#8290a4]">공정 / stage *</span><input required maxLength={48} value={stage} onChange={(event) => setStage(event.target.value)} placeholder="예: Post-mold inspection" className="min-h-10 w-full rounded-lg border border-white/[0.075] bg-[#080f1a] px-3 text-[9px] text-[#d4deea] outline-none placeholder:text-[#4e5e74] focus:ring-2 focus:ring-[#55b8f6]/30" /></label>
        <label className="min-w-0"><span className="mb-1 block text-[8px] text-[#8290a4]">검사 항목 *</span><input required maxLength={64} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="팀 승인 항목 이름" className="min-h-10 w-full rounded-lg border border-white/[0.075] bg-[#080f1a] px-3 text-[9px] text-[#d4deea] outline-none placeholder:text-[#4e5e74] focus:ring-2 focus:ring-[#55b8f6]/30" /></label>
        <label className="min-w-0"><span className="mb-1 block text-[8px] text-[#8290a4]">측정 형식</span><input maxLength={80} value={format} onChange={(event) => setFormat(event.target.value)} placeholder="예: 측정 / 검사 format" className="min-h-10 w-full rounded-lg border border-white/[0.075] bg-[#080f1a] px-3 text-[9px] text-[#d4deea] outline-none placeholder:text-[#4e5e74] focus:ring-2 focus:ring-[#55b8f6]/30" /></label>
        <label className="min-w-0 md:col-span-2"><span className="mb-1 block text-[8px] text-[#8290a4]">목적 / 적용 메모</span><input maxLength={180} value={purpose} onChange={(event) => setPurpose(event.target.value)} placeholder="적용 제품, 확인 목적 또는 팀 기준 메모" className="min-h-10 w-full rounded-lg border border-white/[0.075] bg-[#080f1a] px-3 text-[9px] text-[#d4deea] outline-none placeholder:text-[#4e5e74] focus:ring-2 focus:ring-[#55b8f6]/30" /></label>
        <label className="flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.055] px-3 text-[9px] text-[#aebbd0]"><input type="checkbox" checked={required} onChange={(event) => setRequired(event.target.checked)} className="size-4 accent-[#55b8f6]" /> 필수 gate로 관리</label>
        <div className="flex items-end"><button type="submit" className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-[#55b8f6]/25 bg-[#55b8f6]/[0.08] px-3 text-[9px] font-semibold text-[#b4dcf3] transition hover:bg-[#55b8f6]/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55b8f6]/50"><Plus className="size-3.5" /> 항목 추가</button></div>
      </form>
      <p className="mt-3 text-[8px] leading-5 text-[#817a9b]">사용자 정의 항목은 현재 브라우저의 선택 프로파일에 저장됩니다. 필수 항목은 PASS 결과·증거 ID와 해당 lane의 추적정보가 완성되어야 gate에 반영됩니다.</p>
    </details>
  );
}

export function PackageTestControl() {
  const [plan, setPlan] = useState<PackagePlanState>(createEmptyPackagePlan);
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState("");
  const profile = useMemo(() => {
    const base = PACKAGE_PROFILES.find((item) => item.key === plan.profile) ?? PACKAGE_PROFILES[0];
    return { ...base, checks: [...base.checks, ...(plan.customChecks?.[base.key] ?? []).filter(validCheck)] };
  }, [plan.profile, plan.customChecks]);
  const runContext = useMemo(() => contextFor(plan, profile.key), [plan, profile.key]);
  const productionTrace = contextProgress(runContext, "production");
  const qualificationTrace = contextProgress(runContext, "qualification");
  const productionChecks = profile.checks.filter((check) => check.scope === "production" && check.required);
  const productionComplete = productionChecks.filter((check) => evidenceComplete(plan, check)).length;
  const productionFailed = profile.checks.some((check) => check.scope === "production" && recordFor(plan, check).status === "FAIL");
  const productionReady = productionComplete === productionChecks.length && productionTrace.ready;
  const qualificationChecks = profile.checks.filter((check) => check.scope === "qualification" && check.required);
  const qualificationComplete = qualificationChecks.filter((check) => evidenceComplete(plan, check)).length;
  const qualificationFailed = qualificationChecks.some((check) => recordFor(plan, check).status === "FAIL");
  const qualificationClosed = qualificationComplete === qualificationChecks.length && qualificationTrace.ready;
  const productionBlockers = reviewBlockers(plan, profile.checks, runContext, "production");
  const qualificationBlockers = reviewBlockers(plan, profile.checks, runContext, "qualification");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(PACKAGE_PLAN_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<PackagePlanState>;
          if (validProfile(parsed.profile) && parsed.records && typeof parsed.records === "object") {
            const validRecords: PackagePlanState["records"] = {};
            for (const [id, record] of Object.entries(parsed.records)) {
              if (validRecord(record)) validRecords[id] = record;
            }
            const contexts: NonNullable<PackagePlanState["contexts"]> = {};
            if (parsed.contexts && typeof parsed.contexts === "object") {
              for (const [key, context] of Object.entries(parsed.contexts)) {
                if (validProfile(key) && validContext(context)) contexts[key] = context;
              }
            }
            const customChecks: NonNullable<PackagePlanState["customChecks"]> = {};
            if (parsed.customChecks && typeof parsed.customChecks === "object") {
              for (const [key, checks] of Object.entries(parsed.customChecks)) {
                if (validProfile(key) && Array.isArray(checks)) customChecks[key] = checks.filter(validCheck).slice(0, 100);
              }
            }
            setPlan({ profile: parsed.profile, records: validRecords, contexts, customChecks });
          }
        }
      } catch {
        setNotice("저장된 Package Plan을 읽지 못해 빈 계획으로 열었습니다.");
      } finally {
        setHydrated(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(PACKAGE_PLAN_STORAGE_KEY, JSON.stringify(plan));
    } catch {
      window.setTimeout(() => setNotice("브라우저 저장 공간을 사용할 수 없습니다. CSV를 내려받아 보관하세요."), 0);
    }
  }, [hydrated, plan]);

  function updateRecord(id: string, next: PackageCheckRecord) {
    setPlan((current) => ({ ...current, records: { ...current.records, [id]: next } }));
    setNotice("현재 브라우저에 저장했습니다.");
  }

  function updateContext(next: PackageRunContext) {
    setPlan((current) => ({ ...current, contexts: { ...current.contexts, [profile.key]: next } }));
    setNotice("제품·실행 추적정보를 현재 브라우저에 저장했습니다.");
  }

  function addCustomCheck(check: PackageCheck) {
    if ((plan.customChecks?.[profile.key]?.length ?? 0) >= 100) {
      setNotice("프로파일별 사용자 정의 항목은 최대 100개까지 추가할 수 있습니다.");
      return;
    }
    setPlan((current) => ({
      ...current,
      customChecks: { ...current.customChecks, [profile.key]: [...(current.customChecks?.[profile.key] ?? []), check] },
    }));
    setNotice("팀별 검사 항목을 추가했습니다. 적용 기준과 승인 여부는 팀에서 확인하세요.");
  }

  function removeCustomCheck(id: string) {
    const check = profile.checks.find((item) => item.id === id);
    if (!check?.custom || !window.confirm(`“${check.title}” 항목과 이 항목의 입력 결과를 제거할까요?`)) return;
    setPlan((current) => {
      const records = { ...current.records };
      delete records[id];
      return {
        ...current,
        records,
        customChecks: {
          ...current.customChecks,
          [profile.key]: (current.customChecks?.[profile.key] ?? []).filter((item) => item.id !== id),
        },
      };
    });
    setNotice("팀별 검사 항목과 연결된 결과를 제거했습니다.");
  }

  function loadSampleResults() {
    const records = { ...plan.records };
    for (const check of profile.checks) records[check.id] = check.demo;
    setPlan((current) => ({ ...current, records }));
    setNotice("합성 예시 결과만 불러왔습니다. 실제 제품·LOT·승인 ID는 직접 입력해야 합니다.");
  }

  function resetProfile() {
    if (!window.confirm(`${profile.label}의 입력 결과와 실행 식별정보를 초기화할까요? 사용자 정의 항목은 유지됩니다.`)) return;
    const selectedIds = new Set(profile.checks.map((check) => check.id));
    const records = Object.fromEntries(Object.entries(plan.records).filter(([id]) => !selectedIds.has(id)));
    setPlan((current) => ({ ...current, records, contexts: { ...current.contexts, [profile.key]: createEmptyPackageRunContext() } }));
    setNotice(`${profile.label} 결과와 실행 식별정보를 초기화했습니다. 사용자 정의 항목은 보존했습니다.`);
  }

  function exportCsv() {
    const rows = [
      ["Package Profile", "Architecture", "Product / P/N", "Package Revision", "LOT / Run ID", "Test Program Revision", "Databook / Spec Revision", "Qualification ID", "Qualification Plan Revision", "Owner Alias", "Scope", "Stage", "Test", "Format", "Required", "Status", "Result / Sample", "Criteria / Evidence ID"],
      ...profile.checks.map((check) => {
        const record = recordFor(plan, check);
        return [profile.label, profile.architecture, runContext.product, runContext.packageRevision, runContext.lotId, runContext.programRevision, runContext.specRevision, runContext.qualificationId, runContext.qualificationPlanRevision, runContext.owner, check.scope === "production" ? "양산 screen" : "신뢰성 qualification", check.stage, check.title, check.format, check.required ? "Y" : "Policy", record.status, record.result, record.evidence];
      }),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map((value) => csvCell(String(value))).join(",")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `yieldscope-${profile.key}-test-plan.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("현재 Package Test Plan을 CSV로 내보냈습니다.");
  }

  return (
    <PanelShell>
      <div className="flex flex-col gap-4 border-b border-white/[0.06] p-5 sm:p-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[9px] font-semibold tracking-[0.15em] text-[#8fcbe9]"><Layers3 className="size-3.5" /> PACKAGE TEST CONTROL</div>
          <h2 className="mt-2 text-[18px] font-semibold tracking-[-0.03em] text-[#eef4fb] sm:text-[20px]">패키지 구조별 Test Plan</h2>
          <p className="mt-1 max-w-3xl text-[10px] leading-5 text-[#8392a7]">HBM 적층, 2.5D SiP, 3DS 메모리 모듈, UTV/WLP 프로파일을 고르고 양산 screen과 reliability qualification을 각각 기록합니다.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={loadSampleResults} className="min-h-10 rounded-lg border border-[#55b8f6]/20 bg-[#55b8f6]/[0.055] px-3 text-[9px] font-medium text-[#b4dcf3] transition hover:bg-[#55b8f6]/[0.1]">예시 결과 불러오기</button>
          <button type="button" onClick={exportCsv} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-white/[0.09] px-3 text-[9px] font-medium text-[#aab7c8] transition hover:bg-white/[0.04] hover:text-white"><Download className="size-3.5" /> CSV 내보내기</button>
          <button type="button" onClick={resetProfile} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-white/[0.07] px-3 text-[9px] font-medium text-[#79889d] transition hover:bg-white/[0.035] hover:text-[#d5deea]"><RotateCcw className="size-3" /> 현재 실행값 초기화</button>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" role="group" aria-label="Package profile 선택">
          {PACKAGE_PROFILES.map((item) => {
            const active = item.key === plan.profile;
            return (
              <button key={item.key} type="button" aria-pressed={active} onClick={() => { setPlan((current) => ({ ...current, profile: item.key })); setNotice(`${item.label} 프로파일을 선택했습니다.`); }} className={`min-h-[76px] min-w-0 rounded-xl border p-3.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55b8f6]/50 ${active ? "border-[#55b8f6]/35 bg-[#55b8f6]/[0.075]" : "border-white/[0.065] bg-[#0a1320]/55 hover:border-white/[0.13] hover:bg-white/[0.025]"}`}>
                <span className={`block text-[10px] font-semibold ${active ? "text-[#d9effb]" : "text-[#a9b6c7]"}`}>{item.label}</span>
                <span className="mt-1.5 block break-words text-[8px] leading-4 text-[#6f8096]">{item.architecture}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)]">
          <div className="min-w-0 rounded-xl border border-white/[0.06] bg-[#09121f]/60 p-4 sm:p-5">
            <div className="flex items-start gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-lg border border-[#55b8f6]/15 bg-[#55b8f6]/[0.06] text-[#8fcbe9]"><Activity className="size-4" /></span><div className="min-w-0"><p className="text-[8px] font-semibold tracking-[0.12em] text-[#64758d]">PACKAGE ARCHITECTURE</p><p className="mt-1 text-[12px] font-semibold text-[#dce5ef]">{profile.packageTechnology}</p><p className="mt-1 text-[9px] leading-5 text-[#7c8ba0]">{profile.summary}</p></div></div>
            <p className="mt-3 rounded-lg border border-[#f2b84b]/12 bg-[#f2b84b]/[0.035] px-3 py-2 text-[8px] leading-5 text-[#a8956f]">경계 · {profile.boundary}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <SummaryTile icon={<Check className="size-3.5" />} label="PRODUCTION GATES" value={`${productionComplete} / ${productionChecks.length}`} state={productionFailed ? "fail" : productionReady ? "pass" : "watch"} status={productionFailed ? "REVIEW HOLD" : productionReady ? "PLAN COMPLETE" : productionTrace.ready ? "EVIDENCE REQUIRED" : "TRACE REQUIRED"} />
            <SummaryTile icon={<CircleDashed className="size-3.5" />} label="QUALIFICATION" value={`${qualificationComplete} / ${qualificationChecks.length}`} state={qualificationFailed ? "fail" : qualificationClosed ? "pass" : "watch"} status={qualificationFailed ? "ISSUE" : qualificationClosed ? "CLOSED" : qualificationTrace.ready ? "EVIDENCE REQUIRED" : "TRACE REQUIRED"} />
          </div>
        </div>

        <ReleaseReview production={productionBlockers} qualification={qualificationBlockers} productionFailed={productionFailed} productionReady={productionReady} />

        <RunContextEditor profile={profile} context={runContext} onChange={updateContext} />
        <CustomCheckEditor onAdd={addCustomCheck} />

        <div className="mt-4 space-y-4">
          <PlanLane profile={profile} plan={plan} scope="production" onChange={updateRecord} context={runContext} onRemove={removeCustomCheck} />
          <PlanLane profile={profile} plan={plan} scope="qualification" onChange={updateRecord} context={runContext} onRemove={removeCustomCheck} />
        </div>

        <div className="mt-4 flex flex-col gap-2 rounded-xl border border-white/[0.055] bg-white/[0.015] px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-4xl text-[8px] leading-5 text-[#68788e]">판정 의미 · 필수 결과·증거와 제품/LOT/Program 또는 Qualification 추적정보가 모두 갖춰져야 각 lane이 닫힙니다. 이 도구는 브라우저 로컬 데모이며 제조 시스템 연동, 권한 검토, 사내 test recipe·규격·출하 승인을 대체하지 않습니다.</p>
          <span aria-live="polite" className="shrink-0 text-[8px] text-[#8fcbe9]">{notice || "변경 사항은 이 브라우저에 자동 저장됩니다."}</span>
        </div>
      </div>
    </PanelShell>
  );
}

function SummaryTile({ icon, label, value, state, status }: { icon: ReactNode; label: string; value: string; state: "pass" | "watch" | "fail"; status: string }) {
  const color = state === "pass" ? "text-[#6de0c2] border-[#31c7a2]/18 bg-[#31c7a2]/[0.045]" : state === "fail" ? "text-[#ff9aa3] border-[#f36b78]/18 bg-[#f36b78]/[0.045]" : "text-[#ffd16b] border-[#f2b84b]/18 bg-[#f2b84b]/[0.045]";
  return <div className={`flex min-w-0 flex-col justify-between rounded-xl border p-3.5 ${color}`}><div className="flex items-center justify-between gap-2"><span className="text-[7px] font-semibold tracking-[0.12em] text-[#718097]">{label}</span>{icon}</div><strong className="mt-3 text-[17px] font-semibold tabular-nums">{value}</strong><span className="mt-1 text-[8px] font-medium tracking-[0.06em]">{status}</span></div>;
}

function PanelShell({ children }: { children: ReactNode }) {
  return <div className="package-test-control mt-4 overflow-hidden rounded-2xl border border-[#55b8f6]/15 bg-[linear-gradient(145deg,rgba(85,184,246,0.04),rgba(17,27,43,0.84)_42%,rgba(49,199,162,0.025))]">{children}</div>;
}
