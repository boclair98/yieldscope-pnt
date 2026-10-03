import type { QualificationCriteria, QualificationRow } from "./program-qualification.ts";

export type SyntheticScenario = "nominal" | "socket-contact" | "interconnect" | "thermal-corner";
export type SyntheticScale = "pilot" | "standard" | "extended";

export const SYNTHETIC_SCENARIOS: Array<{ id: SyntheticScenario; label: string; description: string }> = [
  { id: "nominal", label: "정상 변경 · 기준선 비교", description: "동일 표본군에서 재검·시간 개선을 확인하는 정상 시나리오" },
  { id: "socket-contact", label: "Site 접촉 불안정 신호", description: "한 synthetic site에 first-fail 증가와 retest 회복을 주입" },
  { id: "interconnect", label: "전기 연결 불량 신호", description: "한 synthetic LOT에 지속성 open 계열 실패를 주입" },
  { id: "thermal-corner", label: "열 코너 마진 저하 신호", description: "합성 hot-corner에서 최종 실패와 test-time 증가를 주입" },
];

export const SYNTHETIC_SCALES: Array<{
  id: SyntheticScale;
  label: string;
  lotCount: number;
  siteCount: number;
  unitsPerLotSite: number;
}> = [
  { id: "pilot", label: "Pilot · 4,000 paired", lotCount: 4, siteCount: 4, unitsPerLotSite: 250 },
  { id: "standard", label: "Standard · 12,800 paired", lotCount: 8, siteCount: 8, unitsPerLotSite: 200 },
  { id: "extended", label: "Extended · 20,000 paired", lotCount: 10, siteCount: 8, unitsPerLotSite: 250 },
];

export type SyntheticQualificationDataset = {
  rows: QualificationRow[];
  csv: string;
  scenario: SyntheticScenario;
  scale: SyntheticScale;
  seed: number;
  pairCount: number;
  rowCount: number;
  goldenCount: number;
  lotCount: number;
  siteCount: number;
  unitsPerLotSite: number;
};

export const SYNTHETIC_QUALIFICATION_CRITERIA: QualificationCriteria = {
  minPairedUnits: 1,
  minPairedCoveragePct: 100,
  minLots: 1,
  minUnitsPerLot: 1,
  minSites: 1,
  minGoldenUnits: 1,
  minGoldenAgreementPct: 99,
  maxFpyLossPp: 0.2,
  maxDppmIncrease: 1_000,
  maxPairedDiscordancePct: 0.8,
  maxP95TimeIncreasePct: 5,
  maxSiteSpreadPp: 1.5,
  maxWorstLotFpyLossPp: 0.5,
};

export function syntheticCriteriaFor(dataset: Pick<SyntheticQualificationDataset, "pairCount" | "lotCount" | "siteCount" | "unitsPerLotSite" | "goldenCount">): QualificationCriteria {
  return {
    ...SYNTHETIC_QUALIFICATION_CRITERIA,
    minPairedUnits: dataset.pairCount,
    minLots: dataset.lotCount,
    minUnitsPerLot: dataset.siteCount * dataset.unitsPerLotSite,
    minSites: dataset.siteCount,
    minGoldenUnits: dataset.goldenCount,
  };
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function roundMillis(value: number): number {
  return Math.round(value * 1_000) / 1_000;
}

export function serializeQualificationRowsCsv(rows: QualificationRow[]): string {
  const headers = [
    "unit_id", "lot_id", "test_stage", "test_condition", "program_revision", "site", "tester_id",
    "first_pass", "final_pass", "retest_count", "first_bin", "final_bin", "golden_expected", "test_time_sec",
  ];
  const escape = (value: string) => /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
  const values = rows.map((row) => [
    row.unitId,
    row.lotId,
    row.testStage,
    row.condition,
    row.programRevision,
    row.site,
    row.testerId,
    row.firstPass ? "PASS" : "FAIL",
    row.finalPass ? "PASS" : "FAIL",
    String(row.retestCount),
    row.firstBin,
    row.finalBin,
    row.goldenExpected === null ? "" : row.goldenExpected ? "PASS" : "FAIL",
    String(row.testTimeSec),
  ].map(escape).join(","));
  return [headers.join(","), ...values].join("\r\n");
}

export function generateSyntheticQualificationDataset(args: {
  scenario: SyntheticScenario;
  scale: SyntheticScale;
  seed: number;
}): SyntheticQualificationDataset {
  const { scenario, scale, seed } = args;
  const scaleConfig = SYNTHETIC_SCALES.find((option) => option.id === scale);
  if (!scaleConfig) throw new Error("합성 데이터 규모 설정을 확인해 주세요.");
  if (!SYNTHETIC_SCENARIOS.some((option) => option.id === scenario)) throw new Error("합성 시험 시나리오를 확인해 주세요.");
  if (!Number.isSafeInteger(seed) || seed < 1 || seed > 2_147_483_647) {
    throw new Error("Seed는 1~2,147,483,647 사이의 정수여야 합니다.");
  }

  const random = seededRandom(seed);
  const rows: QualificationRow[] = [];
  const revisions = ["SIM-BASE-01", "SIM-CAND-02"];
  const conditionByScenario: Record<SyntheticScenario, string> = {
    nominal: "SIM-ROOM-NOMINAL",
    "socket-contact": "SIM-ROOM-CONTACT",
    interconnect: "SIM-ROOM-ELECTRICAL",
    "thermal-corner": "SIM-HOT-CORNER",
  };
  let goldenCount = 0;

  for (let lotIndex = 0; lotIndex < scaleConfig.lotCount; lotIndex += 1) {
    for (let siteIndex = 0; siteIndex < scaleConfig.siteCount; siteIndex += 1) {
      for (let unitIndex = 0; unitIndex < scaleConfig.unitsPerLotSite; unitIndex += 1) {
        const unitId = `SIM-L${String(lotIndex + 1).padStart(2, "0")}-S${String(siteIndex + 1).padStart(2, "0")}-U${String(unitIndex + 1).padStart(4, "0")}`;
        const lotId = `SIM-LOT-${String(lotIndex + 1).padStart(2, "0")}`;
        const site = `SIM-SITE-${String(siteIndex + 1).padStart(2, "0")}`;
        const testerId = `SIM-ATE-${String(siteIndex + 1).padStart(2, "0")}`;
        const golden = unitIndex % 25 === 0;
        const commonDefect = random() < 0.0005;
        const baselineTransientFail = random() < 0.002;
        const candidateTransientFail = random() < 0.001;
        const contactFail = scenario === "socket-contact" && siteIndex === scaleConfig.siteCount - 1 && random() < 0.08;
        const interconnectFail = scenario === "interconnect" && lotIndex === scaleConfig.lotCount - 1 && random() < 0.02;
        const thermalFail = scenario === "thermal-corner" && random() < 0.004;
        const scenarioPersistentFail = contactFail || interconnectFail || thermalFail;
        const goldenExpected = golden ? !commonDefect : null;
        if (golden) goldenCount += 1;
        const commonTestTime = 2.35 + random() * 0.2;
        const baselineTime = roundMillis(commonTestTime);
        const timeFactor = scenario === "nominal" ? 0.96 : scenario === "thermal-corner" ? 1.08 : 1;
        const candidateTime = roundMillis(commonTestTime * timeFactor);
        const baselinePersistentFail = commonDefect;

        for (const revision of revisions) {
          const baseline = revision === revisions[0];
          const persistentFail = baseline ? baselinePersistentFail : baselinePersistentFail || scenarioPersistentFail;
          const transientFail = baseline ? baselineTransientFail : candidateTransientFail || (scenario === "socket-contact" && contactFail);
          const firstPass = !persistentFail && !transientFail;
          const finalPass = !persistentFail;
          const failBin = commonDefect ? "SIM-BIN-PKG" : interconnectFail ? "SIM-BIN-OPEN" : thermalFail ? "SIM-BIN-MARGIN" : "SIM-BIN-CONTACT";

          rows.push({
            unitId,
            lotId,
            testStage: "SIM-PACKAGE-FT",
            condition: conditionByScenario[scenario],
            programRevision: revision,
            site,
            testerId,
            firstPass,
            finalPass,
            retestCount: transientFail ? 1 : 0,
            firstBin: firstPass ? "" : failBin,
            finalBin: finalPass ? "" : failBin,
            testTimeSec: baseline ? baselineTime : candidateTime,
            goldenExpected,
          });
        }
      }
    }
  }

  const pairCount = scaleConfig.lotCount * scaleConfig.siteCount * scaleConfig.unitsPerLotSite;
  return {
    rows,
    csv: serializeQualificationRowsCsv(rows),
    scenario,
    scale,
    seed,
    pairCount,
    rowCount: rows.length,
    goldenCount,
    lotCount: scaleConfig.lotCount,
    siteCount: scaleConfig.siteCount,
    unitsPerLotSite: scaleConfig.unitsPerLotSite,
  };
}
