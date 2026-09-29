export const QUALIFICATION_CSV_HEADERS = [
  "unit_id",
  "lot_id",
  "test_stage",
  "test_condition",
  "program_revision",
  "site",
  "tester_id",
  "first_pass",
  "final_pass",
  "retest_count",
  "first_bin",
  "final_bin",
  "golden_expected",
  "test_time_sec",
] as const;

export const MAX_QUALIFICATION_FILE_BYTES = 8 * 1024 * 1024;
export const MAX_QUALIFICATION_ROWS = 100_000;
export const MAX_QUALIFICATION_SITES = 128;

export type QualificationRow = {
  unitId: string;
  lotId: string;
  testStage: string;
  condition: string;
  programRevision: string;
  site: string;
  testerId: string;
  firstPass: boolean;
  finalPass: boolean;
  retestCount: number;
  firstBin: string;
  finalBin: string;
  testTimeSec: number;
  goldenExpected: boolean | null;
};

export type QualificationCriteria = {
  minPairedUnits: number | null;
  minPairedCoveragePct: number | null;
  minLots: number | null;
  minUnitsPerLot: number | null;
  minSites: number | null;
  minGoldenUnits: number | null;
  minGoldenAgreementPct: number | null;
  maxFpyLossPp: number | null;
  maxDppmIncrease: number | null;
  maxPairedDiscordancePct: number | null;
  maxP95TimeIncreasePct: number | null;
  maxSiteSpreadPp: number | null;
  maxWorstLotFpyLossPp: number | null;
};

export type QualificationGate = {
  key: string;
  label: string;
  actual: string;
  criterion: string;
  state: "PASS" | "FAIL" | "기준 미입력" | "데이터 부족";
};

export type ProgramMetrics = {
  revision: string;
  count: number;
  firstPassPct: number;
  finalPassPct: number;
  observedFinalDppm: number;
  p95TimeSec: number;
  retestRatePct: number;
  retestRecoveryPct: number | null;
  retestEligibleCount: number;
  retestRecoveredCount: number;
  retestCountTotal: number;
  siteYields: Array<{ site: string; count: number; firstPassPct: number }>;
  siteSpreadPp: number;
};

export type LotComparison = {
  lotId: string;
  count: number;
  baselineFpyPct: number;
  candidateFpyPct: number;
  deltaPp: number;
};

export type QualificationAnalysis = {
  matchedCount: number;
  candidatePairCoveragePct: number;
  discordancePct: number;
  baselineFailCandidatePassCount: number;
  baselinePassCandidateFailCount: number;
  baseline: ProgramMetrics;
  candidate: ProgramMetrics;
  fpyDeltaPp: number;
  dppmDelta: number;
  p95TimeDeltaPct: number;
  goldenCount: number;
  goldenAgreementPct: number | null;
  goldenFalseFailCount: number;
  goldenEscapeCount: number;
  lotComparisons: LotComparison[];
  worstLotFpyDeltaPp: number;
  gates: QualificationGate[];
  disposition: "기준 미완료" | "HOLD · 원인 검토" | "ENGINEERING REVIEW 가능";
  blockers: string[];
};

function parseCsvMatrix(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  let quoteClosed = false;
  const source = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
        quoteClosed = true;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      if (cell.trim()) throw new Error("CSV의 따옴표 위치가 올바르지 않습니다.");
      cell = "";
      quoted = true;
    } else if (char === ",") {
      row.push(cell.trim());
      cell = "";
      quoteClosed = false;
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[index + 1] === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
      quoteClosed = false;
    } else if (quoteClosed) {
      if (!/\s/.test(char)) throw new Error("CSV의 닫는 따옴표 뒤에 예상하지 못한 값이 있습니다.");
    } else {
      cell += char;
    }
  }

  if (quoted) throw new Error("CSV의 큰따옴표 짝이 맞지 않습니다.");
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function parsePass(value: string, label: string, rowNumber: number): boolean {
  const normalized = value.trim().toLowerCase();
  if (["pass", "passed", "1", "true", "y"].includes(normalized)) return true;
  if (["fail", "failed", "0", "false", "n"].includes(normalized)) return false;
  throw new Error(`${rowNumber}행 ${label}: PASS/FAIL 값이 아닙니다.`);
}

export function parseQualificationCsv(input: string): QualificationRow[] {
  const matrix = parseCsvMatrix(input);
  if (matrix.length < 2) throw new Error("헤더와 데이터 행이 있는 CSV가 필요합니다.");
  if (matrix.length - 1 > MAX_QUALIFICATION_ROWS) throw new Error(`최대 ${MAX_QUALIFICATION_ROWS.toLocaleString()}행까지 처리할 수 있습니다.`);

  const headers = matrix[0].map((header) => header.toLowerCase());
  const duplicates = headers.filter((header, index) => headers.indexOf(header) !== index);
  if (duplicates.length) throw new Error(`중복 컬럼: ${[...new Set(duplicates)].join(", ")}`);
  const missing = QUALIFICATION_CSV_HEADERS.filter((header) => !headers.includes(header));
  if (missing.length) throw new Error(`필수 컬럼이 없습니다: ${missing.join(", ")}`);
  const column = (name: (typeof QUALIFICATION_CSV_HEADERS)[number]) => headers.indexOf(name);
  const seen = new Set<string>();
  const rows: QualificationRow[] = [];

  for (const [index, cells] of matrix.slice(1).entries()) {
    const rowNumber = index + 2;
    if (cells.length > headers.length) throw new Error(`${rowNumber}행: 헤더보다 많은 값이 있습니다.`);
    const get = (name: (typeof QUALIFICATION_CSV_HEADERS)[number]) => cells[column(name)] ?? "";
    const row: QualificationRow = {
      unitId: get("unit_id"),
      lotId: get("lot_id"),
      testStage: get("test_stage"),
      condition: get("test_condition"),
      programRevision: get("program_revision"),
      site: get("site"),
      testerId: get("tester_id"),
      firstPass: parsePass(get("first_pass"), "first_pass", rowNumber),
      finalPass: parsePass(get("final_pass"), "final_pass", rowNumber),
      retestCount: Number(get("retest_count")),
      firstBin: get("first_bin"),
      finalBin: get("final_bin"),
      goldenExpected: get("golden_expected") ? parsePass(get("golden_expected"), "golden_expected", rowNumber) : null,
      testTimeSec: Number(get("test_time_sec")),
    };

    if (![row.unitId, row.lotId, row.testStage, row.condition, row.programRevision, row.site, row.testerId].every(Boolean)) {
      throw new Error(`${rowNumber}행: unit, LOT, test stage/condition, program, site, tester 식별값이 필요합니다.`);
    }
    if (!Number.isFinite(row.testTimeSec) || row.testTimeSec <= 0 || row.testTimeSec > 3600) {
      throw new Error(`${rowNumber}행 test_time_sec: 0 초 초과, 3,600 초 이하의 숫자여야 합니다.`);
    }
    if (!Number.isInteger(row.retestCount) || row.retestCount < 0 || row.retestCount > 100) {
      throw new Error(`${rowNumber}행 retest_count: 0~100 사이의 정수여야 합니다.`);
    }
    if (row.firstPass && !row.finalPass) throw new Error(`${rowNumber}행: first_pass가 PASS인데 final_pass가 FAIL일 수 없습니다.`);
    if (!row.firstPass && !row.firstBin) throw new Error(`${rowNumber}행: first_pass FAIL에는 first_bin이 필요합니다.`);
    if (!row.finalPass && !row.finalBin) throw new Error(`${rowNumber}행: final_pass FAIL에는 final_bin이 필요합니다.`);
    if (!row.firstPass && row.finalPass && row.retestCount < 1) throw new Error(`${rowNumber}행: first FAIL → final PASS에는 retest_count가 1 이상이어야 합니다.`);

    const key = `${row.programRevision}\u0000${row.unitId}`;
    if (seen.has(key)) throw new Error(`${rowNumber}행: 동일 Program revision에 unit_id가 중복됩니다.`);
    seen.add(key);
    rows.push(row);
  }

  if (new Set(rows.map((row) => row.programRevision)).size < 2) throw new Error("Baseline과 Candidate 두 개 이상의 program_revision이 필요합니다.");
  if (new Set(rows.map((row) => row.site)).size > MAX_QUALIFICATION_SITES) throw new Error(`한 study에서 비교할 수 있는 site는 최대 ${MAX_QUALIFICATION_SITES}개입니다.`);
  if (new Set(rows.map((row) => row.testStage)).size !== 1 || new Set(rows.map((row) => row.condition)).size !== 1) {
    throw new Error("한 qualification CSV는 단일 test_stage·test_condition만 포함해야 합니다. stage/corner별로 별도 study를 실행하세요.");
  }
  return rows;
}

const INTEGER_CRITERIA: Array<keyof QualificationCriteria> = ["minPairedUnits", "minLots", "minUnitsPerLot", "minSites", "minGoldenUnits"];

export function qualificationCriteriaIssues(criteria: QualificationCriteria): string[] {
  const issues: string[] = [];
  for (const key of Object.keys(criteria) as Array<keyof QualificationCriteria>) {
    const value = criteria[key];
    if (value === null) continue;
    if (!Number.isFinite(value)) {
      issues.push(`${key}: 유한한 숫자를 입력하세요.`);
      continue;
    }
    if (INTEGER_CRITERIA.includes(key) && (!Number.isInteger(value) || value < 1)) issues.push(`${key}: 1 이상의 정수여야 합니다.`);
    if (key === "minPairedUnits" && value > MAX_QUALIFICATION_ROWS) issues.push(`minPairedUnits: ${MAX_QUALIFICATION_ROWS.toLocaleString()} 이하여야 합니다.`);
    if (key === "minUnitsPerLot" && value > MAX_QUALIFICATION_ROWS) issues.push(`minUnitsPerLot: ${MAX_QUALIFICATION_ROWS.toLocaleString()} 이하여야 합니다.`);
    if (key === "minGoldenUnits" && value > MAX_QUALIFICATION_ROWS) issues.push(`minGoldenUnits: ${MAX_QUALIFICATION_ROWS.toLocaleString()} 이하여야 합니다.`);
    if (["minPairedCoveragePct", "minGoldenAgreementPct", "maxFpyLossPp", "maxPairedDiscordancePct", "maxSiteSpreadPp", "maxWorstLotFpyLossPp"].includes(key) && (value < 0 || value > 100)) {
      issues.push(`${key}: 0~100 사이 값이어야 합니다.`);
    }
    if (key === "maxP95TimeIncreasePct" && (value < 0 || value > 500)) issues.push("maxP95TimeIncreasePct: 0~500 사이 값이어야 합니다.");
    if (key === "maxDppmIncrease" && value < 0) issues.push("maxDppmIncrease: 0 이상이어야 합니다.");
    if (key === "minSites" && value > 128) issues.push("minSites: 128 이하여야 합니다.");
  }
  return issues;
}

function pct(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : (numerator / denominator) * 100;
}

function percentile95(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)] ?? 0;
}

function metrics(rows: QualificationRow[], revision: string): ProgramMetrics {
  const siteGroups = new Map<string, QualificationRow[]>();
  for (const row of rows) {
    const group = siteGroups.get(row.site);
    if (group) group.push(row);
    else siteGroups.set(row.site, [row]);
  }
  const siteYields = [...siteGroups.entries()]
    .map(([site, items]) => ({ site, count: items.length, firstPassPct: pct(items.filter((row) => row.firstPass).length, items.length) }))
    .sort((a, b) => a.site.localeCompare(b.site));
  const yields = siteYields.map((site) => site.firstPassPct);
  const firstFailCount = rows.filter((row) => !row.firstPass).length;
  const retestRecoveredCount = rows.filter((row) => !row.firstPass && row.finalPass).length;
  return {
    revision,
    count: rows.length,
    firstPassPct: pct(rows.filter((row) => row.firstPass).length, rows.length),
    finalPassPct: pct(rows.filter((row) => row.finalPass).length, rows.length),
    observedFinalDppm: (rows.filter((row) => !row.finalPass).length / rows.length) * 1_000_000,
    p95TimeSec: percentile95(rows.map((row) => row.testTimeSec)),
    retestRatePct: pct(rows.filter((row) => row.retestCount > 0).length, rows.length),
    retestRecoveryPct: firstFailCount ? pct(retestRecoveredCount, firstFailCount) : null,
    retestEligibleCount: firstFailCount,
    retestRecoveredCount,
    retestCountTotal: rows.reduce((sum, row) => sum + row.retestCount, 0),
    siteYields,
    siteSpreadPp: yields.length ? Math.max(...yields) - Math.min(...yields) : 0,
  };
}

export function analyzeProgramQualification(args: {
  rows: QualificationRow[];
  baselineRevision: string;
  candidateRevision: string;
  criteria: QualificationCriteria;
}): QualificationAnalysis {
  const { rows, baselineRevision, candidateRevision, criteria } = args;
  if (!baselineRevision || !candidateRevision || baselineRevision === candidateRevision) throw new Error("서로 다른 Baseline과 Candidate revision을 선택하세요.");
  const criteriaIssues = qualificationCriteriaIssues(criteria);
  if (criteriaIssues.length) throw new Error(`Qualification 기준 확인: ${criteriaIssues.join(" · ")}`);

  const baselineRows = rows.filter((row) => row.programRevision === baselineRevision);
  const candidateRows = rows.filter((row) => row.programRevision === candidateRevision);
  if (!baselineRows.length || !candidateRows.length) throw new Error("선택한 revision의 데이터가 CSV에 없습니다.");
  const baseByUnit = new Map(baselineRows.map((row) => [row.unitId, row]));
  const candidateByUnit = new Map(candidateRows.map((row) => [row.unitId, row]));
  const matched: Array<[QualificationRow, QualificationRow]> = [];

  for (const [unitId, candidate] of candidateByUnit) {
    const baseline = baseByUnit.get(unitId);
    if (!baseline) continue;
    if (baseline.lotId !== candidate.lotId || baseline.testStage !== candidate.testStage || baseline.condition !== candidate.condition || baseline.site !== candidate.site || baseline.testerId !== candidate.testerId) {
      throw new Error(`unit_id ${unitId}: paired rows의 LOT, stage, condition, site, tester가 다릅니다. 동일 조건 비교를 확인하세요.`);
    }
    if (baseline.goldenExpected !== null && candidate.goldenExpected !== null && baseline.goldenExpected !== candidate.goldenExpected) {
      throw new Error(`unit_id ${unitId}: paired rows의 golden_expected label이 서로 다릅니다.`);
    }
    matched.push([baseline, candidate]);
  }
  if (!matched.length) throw new Error("두 revision 사이에 짝지을 수 있는 unit이 없습니다. unit_id와 실행 범위를 확인하세요.");

  // All headline deltas use only the exact paired cohort to avoid comparing different sample mixes.
  const baseline = metrics(matched.map(([row]) => row), baselineRevision);
  const candidate = metrics(matched.map(([, row]) => row), candidateRevision);
  const candidatePairCoveragePct = pct(matched.length, candidateRows.length);
  const baselineFailCandidatePassCount = matched.filter(([base, next]) => !base.firstPass && next.firstPass).length;
  const baselinePassCandidateFailCount = matched.filter(([base, next]) => base.firstPass && !next.firstPass).length;
  const discordantCount = baselineFailCandidatePassCount + baselinePassCandidateFailCount;
  const goldenRows = candidateRows.filter((row) => row.goldenExpected !== null);
  const goldenAgreement = goldenRows.length ? pct(goldenRows.filter((row) => row.firstPass === row.goldenExpected).length, goldenRows.length) : null;
  const goldenFalseFails = goldenRows.filter((row) => row.goldenExpected === true && !row.firstPass).length;
  const goldenEscapes = goldenRows.filter((row) => row.goldenExpected === false && row.firstPass).length;
  const fpyDeltaPp = candidate.firstPassPct - baseline.firstPassPct;
  const dppmDelta = candidate.observedFinalDppm - baseline.observedFinalDppm;
  const p95TimeDeltaPct = ((candidate.p95TimeSec - baseline.p95TimeSec) / baseline.p95TimeSec) * 100;
  const lotGroups = new Map<string, Array<[QualificationRow, QualificationRow]>>();
  for (const pair of matched) {
    const group = lotGroups.get(pair[0].lotId);
    if (group) group.push(pair);
    else lotGroups.set(pair[0].lotId, [pair]);
  }
  const lotComparisons = [...lotGroups.entries()].map(([lotId, pairs]) => {
    const baselineFpyPct = pct(pairs.filter(([row]) => row.firstPass).length, pairs.length);
    const candidateFpyPct = pct(pairs.filter(([, row]) => row.firstPass).length, pairs.length);
    return { lotId, count: pairs.length, baselineFpyPct, candidateFpyPct, deltaPp: candidateFpyPct - baselineFpyPct };
  }).sort((a, b) => a.lotId.localeCompare(b.lotId));
  const worstLotFpyDeltaPp = Math.min(...lotComparisons.map((lot) => lot.deltaPp));

  const gates: QualificationGate[] = [];
  const gate = (
    key: string,
    label: string,
    actual: string,
    criterion: number | null,
    format: (value: number) => string,
    passes: (value: number) => boolean,
    enough = true,
  ) => {
    gates.push({
      key,
      label,
      actual,
      criterion: criterion === null ? "승인 기준 입력 필요" : format(criterion),
      state: criterion === null ? "기준 미입력" : !enough ? "데이터 부족" : passes(criterion) ? "PASS" : "FAIL",
    });
  };

  gate("paired", "Paired sample 수", `${matched.length.toLocaleString()} units`, criteria.minPairedUnits, (value) => `≥ ${value} units`, (value) => matched.length >= value);
  gate("coverage", "Candidate paired coverage", `${candidatePairCoveragePct.toFixed(3)}%`, criteria.minPairedCoveragePct, (value) => `≥ ${value}%`, (value) => candidatePairCoveragePct >= value);
  gate("lot-count", "Paired qualification LOT 수", `${lotComparisons.length} lots`, criteria.minLots, (value) => `≥ ${value} lots`, (value) => lotComparisons.length >= value);
  const minUnitsInLot = Math.min(...lotComparisons.map((lot) => lot.count));
  gate("per-lot-units", "LOT별 paired 표본 하한", `최소 ${minUnitsInLot} units / LOT`, criteria.minUnitsPerLot, (value) => `각 LOT ≥ ${value} units`, (value) => lotComparisons.every((lot) => lot.count >= value));
  gate("site-count", "Paired multi-site 수", `${candidate.siteYields.length} sites`, criteria.minSites, (value) => `≥ ${value} sites`, (value) => candidate.siteYields.length >= value);
  gate("golden-count", "Candidate golden sample 수", `${goldenRows.length.toLocaleString()} units`, criteria.minGoldenUnits, (value) => `≥ ${value} units`, (value) => goldenRows.length >= value);
  gate("golden-agreement", "Golden set 판정 일치율", goldenAgreement === null ? "측정 불가" : `${goldenAgreement.toFixed(3)}%`, criteria.minGoldenAgreementPct, (value) => `≥ ${value}%`, (value) => goldenAgreement !== null && goldenAgreement >= value, goldenRows.length > 0);
  gate("fpy-loss", "Paired first-pass yield 변화", `${fpyDeltaPp >= 0 ? "+" : ""}${fpyDeltaPp.toFixed(3)}%p`, criteria.maxFpyLossPp, (value) => `하락 ≤ ${value}%p`, (value) => fpyDeltaPp >= -value);
  gate("dppm-rise", "관측 final-fail DPPM 변화", `${dppmDelta >= 0 ? "+" : ""}${dppmDelta.toFixed(1)} DPPM`, criteria.maxDppmIncrease, (value) => `증가 ≤ ${value} DPPM`, (value) => dppmDelta <= value);
  gate("discordance", "Paired first-pass 불일치율", `${pct(discordantCount, matched.length).toFixed(3)}%`, criteria.maxPairedDiscordancePct, (value) => `≤ ${value}%`, (value) => pct(discordantCount, matched.length) <= value);
  gate("test-time", "Paired P95 test time 변화", `${p95TimeDeltaPct >= 0 ? "+" : ""}${p95TimeDeltaPct.toFixed(2)}% (${candidate.p95TimeSec.toFixed(3)} sec)`, criteria.maxP95TimeIncreasePct, (value) => `증가 ≤ ${value}%`, (value) => p95TimeDeltaPct <= value);
  gate("site-spread", "Candidate site FPY spread", `${candidate.siteSpreadPp.toFixed(3)}%p`, criteria.maxSiteSpreadPp, (value) => `≤ ${value}%p`, (value) => candidate.siteSpreadPp <= value);
  gate("worst-lot-fpy", "Worst LOT paired FPY 변화", `${worstLotFpyDeltaPp >= 0 ? "+" : ""}${worstLotFpyDeltaPp.toFixed(3)}%p`, criteria.maxWorstLotFpyLossPp, (value) => `하락 ≤ ${value}%p`, (value) => worstLotFpyDeltaPp >= -value);

  const blockers = gates.filter((item) => item.state !== "PASS").map((item) => `${item.label}: ${item.state}`);
  const disposition = gates.some((item) => item.state === "기준 미입력")
    ? "기준 미완료"
    : gates.some((item) => item.state === "FAIL" || item.state === "데이터 부족")
      ? "HOLD · 원인 검토"
      : "ENGINEERING REVIEW 가능";

  return {
    matchedCount: matched.length,
    candidatePairCoveragePct,
    discordancePct: pct(discordantCount, matched.length),
    baselineFailCandidatePassCount,
    baselinePassCandidateFailCount,
    baseline,
    candidate,
    fpyDeltaPp,
    dppmDelta,
    p95TimeDeltaPct,
    goldenCount: goldenRows.length,
    goldenAgreementPct: goldenAgreement,
    goldenFalseFailCount: goldenFalseFails,
    goldenEscapeCount: goldenEscapes,
    lotComparisons,
    worstLotFpyDeltaPp,
    gates,
    disposition,
    blockers,
  };
}
