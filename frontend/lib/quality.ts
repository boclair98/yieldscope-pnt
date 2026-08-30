export type ScenarioKey = "stacker" | "socket" | "muf";

export type Scenario = {
  key: ScenarioKey;
  eyebrow: string;
  label: string;
  shortLabel: string;
  stage: "PACKAGE" | "TEST";
  signal: string;
  signalDetail: string;
  incidentWindow: string;
  kpis: Array<{
    label: string;
    value: string;
    unit?: string;
    delta: string;
    tone: "good" | "warn" | "alert" | "neutral";
    hint: string;
  }>;
  trend: Array<{ date: string; yield: number; lots: number; breach?: boolean }>;
  pareto: Array<{ code: string; label: string; count: number; share: number; tone: string }>;
  tools: Array<{ name: string; stage: string; rate: number; risk: number; status: "정상" | "주의" | "위험" }>;
  lots: Array<{
    id: string;
    product: string;
    tool: string;
    units: number;
    yield: number;
    defect: string;
    shift: string;
    status: "격리" | "확인 중" | "모니터링" | "해제";
  }>;
  hypotheses: Array<{
    rank: number;
    title: string;
    metric: string;
    evidence: string;
    confidence: number;
    state: "Suspected" | "Corroborated" | "Confirmed";
  }>;
  evidence: Array<{ label: string; value: string; detail: string; status: "done" | "active" | "pending" }>;
  validation: {
    before: number;
    after: number;
    reduction: number;
    lots: number;
    title: string;
    series: Array<{ label: string; value: number; phase: "before" | "after" }>;
  };
  actions: Array<{ type: "Containment" | "Corrective" | "Preventive"; title: string; owner: string; state: string; date: string }>;
};

export const SCENARIOS: Record<ScenarioKey, Scenario> = {
  stacker: {
    key: "stacker",
    eyebrow: "INCIDENT 01 · INTERCONNECT",
    label: "Stacker 정렬 편차",
    shortLabel: "Open / High-R",
    stage: "PACKAGE",
    signal: "Stack 공정 이후 Open / High-R 불량이 기준 대비 3.6배 높습니다.",
    signalDetail: "STK-03과 야간 Shift의 4개 LOT에 손실의 71%가 집중되었습니다.",
    incidentWindow: "2026.08.05—08.18",
    kpis: [
      { label: "최종 수율", value: "96.82", unit: "%", delta: "+0.43%p vs 직전", tone: "good", hint: "재발 방지 조치 후 최근 10 LOT" },
      { label: "Open 불량", value: "3,420", unit: "DPPM", delta: "피크 대비 −70.3%", tone: "good", hint: "최종 검사 불량품 기준" },
      { label: "주의 LOT", value: "4", delta: "4개 격리 완료", tone: "alert", hint: "관리 한계 이탈 LOT" },
      { label: "영향 추정", value: "1,240", unit: "pcs", delta: "32,840 units 중", tone: "neutral", hint: "합성 단위 수량" },
    ],
    trend: [
      { date: "08.05", yield: 97.31, lots: 4 }, { date: "08.06", yield: 97.22, lots: 5 },
      { date: "08.07", yield: 97.14, lots: 4 }, { date: "08.08", yield: 96.98, lots: 5 },
      { date: "08.09", yield: 96.72, lots: 6, breach: true }, { date: "08.10", yield: 96.43, lots: 5, breach: true },
      { date: "08.11", yield: 95.88, lots: 5, breach: true }, { date: "08.12", yield: 95.74, lots: 4, breach: true },
      { date: "08.13", yield: 96.11, lots: 6, breach: true }, { date: "08.14", yield: 96.62, lots: 5 },
      { date: "08.15", yield: 96.94, lots: 4 }, { date: "08.16", yield: 97.08, lots: 5 },
      { date: "08.17", yield: 97.22, lots: 4 }, { date: "08.18", yield: 97.34, lots: 6 },
    ],
    pareto: [
      { code: "OPN", label: "Open / High-R", count: 382, share: 47, tone: "#f2b84b" },
      { code: "MIS", label: "Misalignment", count: 154, share: 19, tone: "#ff9254" },
      { code: "BRG", label: "Bridge / Short", count: 98, share: 12, tone: "#55b8f6" },
      { code: "CRK", label: "Die crack", count: 73, share: 9, tone: "#31c7a2" },
      { code: "OTH", label: "기타", count: 106, share: 13, tone: "#708099" },
    ],
    tools: [
      { name: "STK-01", stage: "Stack", rate: 0.31, risk: 0.9, status: "정상" },
      { name: "STK-02", stage: "Stack", rate: 0.38, risk: 1.1, status: "정상" },
      { name: "STK-03", stage: "Stack", rate: 1.18, risk: 3.6, status: "위험" },
      { name: "RFL-02", stage: "Reflow", rate: 0.46, risk: 1.3, status: "주의" },
      { name: "TST-04", stage: "Final test", rate: 0.35, risk: 1.0, status: "정상" },
    ],
    lots: [
      { id: "PT6A-0811", product: "Stacked-M8", tool: "STK-03", units: 8420, yield: 95.54, defect: "Open / High-R", shift: "N", status: "격리" },
      { id: "PT6A-0812", product: "Stacked-M8", tool: "STK-03", units: 8160, yield: 95.71, defect: "Open / High-R", shift: "N", status: "확인 중" },
      { id: "PT6B-0813", product: "Stacked-M12", tool: "STK-03", units: 7980, yield: 96.08, defect: "Misalignment", shift: "N", status: "격리" },
      { id: "PT6A-0814", product: "Stacked-M8", tool: "RFL-02", units: 8280, yield: 96.62, defect: "Bridge / Short", shift: "D", status: "모니터링" },
      { id: "PT6C-0816", product: "Stacked-M8", tool: "STK-02", units: 8640, yield: 97.08, defect: "Open / High-R", shift: "D", status: "해제" },
    ],
    hypotheses: [
      { rank: 1, title: "STK-03 X/Y 정렬 드리프트", metric: "Risk ratio 3.6×", evidence: "X-ray에서 bump offset 증가, 다른 tester에서도 동일 fail 재현", confidence: 92, state: "Confirmed" },
      { rank: 2, title: "야간 Shift 보정 지연", metric: "+0.74%p loss", evidence: "교대 후 첫 2개 LOT에 편차 집중, 장비 요인 통제 후 영향 축소", confidence: 66, state: "Corroborated" },
      { rank: 3, title: "Reflow profile 상호작용", metric: "p = 0.08", evidence: "TAL 상단 구간에서 증가 신호, 단독 재현은 미완료", confidence: 38, state: "Suspected" },
    ],
    evidence: [
      { label: "전기적 재현", value: "Alternate tester 94%", detail: "테스터 교차 확인에서도 동일 Open bin 유지", status: "done" },
      { label: "비파괴 분석", value: "X-ray offset +2.5 μm", detail: "STK-03 표본의 정렬 편차 증가 확인", status: "done" },
      { label: "물리 분석", value: "Partial joint", detail: "단면 표본 5/6에서 부분 접합 관측", status: "done" },
      { label: "개선 검증", value: "10 LOT stable", detail: "교정 후 관리 한계 내 유지", status: "active" },
    ],
    validation: {
      before: 1.18, after: 0.35, reduction: 70.3, lots: 10,
      title: "STK-03 calibration 이후 Open 불량률",
      series: [
        { label: "B-4", value: 1.03, phase: "before" }, { label: "B-3", value: 1.12, phase: "before" },
        { label: "B-2", value: 1.26, phase: "before" }, { label: "B-1", value: 1.31, phase: "before" },
        { label: "A+1", value: 0.48, phase: "after" }, { label: "A+2", value: 0.41, phase: "after" },
        { label: "A+3", value: 0.36, phase: "after" }, { label: "A+4", value: 0.33, phase: "after" },
        { label: "A+5", value: 0.31, phase: "after" }, { label: "A+6", value: 0.29, phase: "after" },
      ],
    },
    actions: [
      { type: "Containment", title: "영향 4개 LOT 격리 및 100% continuity 재검", owner: "QE", state: "완료", date: "08.12" },
      { type: "Corrective", title: "STK-03 vision calibration 및 offset interlock 복원", owner: "PE", state: "완료", date: "08.13" },
      { type: "Preventive", title: "교대 직후 golden sample 확인 주기 표준화", owner: "MFG", state: "검증 중", date: "08.18" },
    ],
  },
  socket: {
    key: "socket",
    eyebrow: "INCIDENT 02 · TESTABILITY",
    label: "Socket False Reject",
    shortLabel: "Retest recovery",
    stage: "TEST",
    signal: "SCK-07에서 최초 Fail의 76%가 alternate socket 재검에서 회복됩니다.",
    signalDetail: "패키지 기인 불량보다 contact 저항·오염에 의한 false reject 가능성이 우선입니다.",
    incidentWindow: "2026.07.22—08.04",
    kpis: [
      { label: "First Pass Yield", value: "97.41", unit: "%", delta: "+1.18%p after PM", tone: "good", hint: "최초 검사 기준" },
      { label: "Retest Recovery", value: "76", unit: "%", delta: "SCK-07 fail 표본", tone: "warn", hint: "최초 fail 후 pass 비율" },
      { label: "주의 Socket", value: "1", delta: "SCK-07 hold", tone: "alert", hint: "contact 이상 신호" },
      { label: "회수 추정", value: "860", unit: "pcs", delta: "불필요 scrap 방지", tone: "neutral", hint: "합성 단위 수량" },
    ],
    trend: [
      { date: "07.22", yield: 97.28, lots: 5 }, { date: "07.23", yield: 97.18, lots: 4 },
      { date: "07.24", yield: 96.82, lots: 5 }, { date: "07.25", yield: 96.41, lots: 6, breach: true },
      { date: "07.26", yield: 95.96, lots: 5, breach: true }, { date: "07.27", yield: 95.88, lots: 4, breach: true },
      { date: "07.28", yield: 96.14, lots: 5, breach: true }, { date: "07.29", yield: 96.22, lots: 6, breach: true },
      { date: "07.30", yield: 96.74, lots: 5 }, { date: "07.31", yield: 97.02, lots: 4 },
      { date: "08.01", yield: 97.33, lots: 5 }, { date: "08.02", yield: 97.47, lots: 5 },
      { date: "08.03", yield: 97.39, lots: 4 }, { date: "08.04", yield: 97.44, lots: 5 },
    ],
    pareto: [
      { code: "CON", label: "Contact / Open", count: 426, share: 52, tone: "#f2b84b" },
      { code: "LEK", label: "DC Leakage", count: 131, share: 16, tone: "#ff9254" },
      { code: "TIM", label: "AC / Timing", count: 106, share: 13, tone: "#55b8f6" },
      { code: "FUN", label: "Function", count: 74, share: 9, tone: "#31c7a2" },
      { code: "OTH", label: "기타", count: 82, share: 10, tone: "#708099" },
    ],
    tools: [
      { name: "SCK-03", stage: "Final test", rate: 0.29, risk: 0.8, status: "정상" },
      { name: "SCK-05", stage: "Final test", rate: 0.35, risk: 1.0, status: "정상" },
      { name: "SCK-07", stage: "Final test", rate: 1.42, risk: 4.1, status: "위험" },
      { name: "TST-02", stage: "Tester", rate: 0.44, risk: 1.2, status: "주의" },
      { name: "TST-04", stage: "Tester", rate: 0.33, risk: 0.9, status: "정상" },
    ],
    lots: [
      { id: "FT6D-0726", product: "Stacked-M8", tool: "SCK-07", units: 9120, yield: 95.82, defect: "Contact / Open", shift: "D", status: "확인 중" },
      { id: "FT6D-0727", product: "Stacked-M8", tool: "SCK-07", units: 8840, yield: 95.91, defect: "Contact / Open", shift: "N", status: "격리" },
      { id: "FT6E-0728", product: "Stacked-M12", tool: "SCK-07", units: 7680, yield: 96.11, defect: "DC Leakage", shift: "N", status: "확인 중" },
      { id: "FT6D-0730", product: "Stacked-M8", tool: "SCK-05", units: 9280, yield: 96.74, defect: "AC / Timing", shift: "D", status: "모니터링" },
      { id: "FT6F-0802", product: "Stacked-M8", tool: "SCK-03", units: 9440, yield: 97.47, defect: "Contact / Open", shift: "D", status: "해제" },
    ],
    hypotheses: [
      { rank: 1, title: "SCK-07 contact 열화", metric: "Recovery 76%", evidence: "alternate socket 교차 재검에서 회복, cleaning 후 contact R 정상화", confidence: 95, state: "Confirmed" },
      { rank: 2, title: "야간 온도 corner 영향", metric: "+0.31%p fail", evidence: "저온 corner에서 신호 증가, socket 통제 시 격차 감소", confidence: 54, state: "Corroborated" },
      { rank: 3, title: "Package interconnect", metric: "재현 8%", evidence: "다른 socket에서 fail 유지 표본만 물리 분석 대상으로 분리", confidence: 21, state: "Suspected" },
    ],
    evidence: [
      { label: "교차 재검", value: "Recovery 76%", detail: "동일 tester + alternate socket에서 pass 전환", status: "done" },
      { label: "Contact 저항", value: "+38 mΩ", detail: "SCK-07 특정 pin cluster에서 증가", status: "done" },
      { label: "Cleaning 검증", value: "FPY +1.18%p", detail: "PM 직후 6 LOT 정상 범위 복귀", status: "done" },
      { label: "수명 관리", value: "Cycle rule", detail: "pin group별 사용 횟수 interlock 검증 중", status: "active" },
    ],
    validation: {
      before: 1.42, after: 0.34, reduction: 76.1, lots: 6,
      title: "SCK-07 PM 이후 Contact fail 비율",
      series: [
        { label: "B-4", value: 1.31, phase: "before" }, { label: "B-3", value: 1.38, phase: "before" },
        { label: "B-2", value: 1.48, phase: "before" }, { label: "B-1", value: 1.51, phase: "before" },
        { label: "A+1", value: 0.47, phase: "after" }, { label: "A+2", value: 0.39, phase: "after" },
        { label: "A+3", value: 0.33, phase: "after" }, { label: "A+4", value: 0.31, phase: "after" },
        { label: "A+5", value: 0.29, phase: "after" }, { label: "A+6", value: 0.28, phase: "after" },
      ],
    },
    actions: [
      { type: "Containment", title: "SCK-07 hold 및 alternate socket 100% 재검", owner: "TE", state: "완료", date: "07.27" },
      { type: "Corrective", title: "contact cleaning·pin 교체 및 calibration", owner: "EQUIP", state: "완료", date: "07.29" },
      { type: "Preventive", title: "socket cycle 기반 PM interlock 도입", owner: "TE", state: "검증 중", date: "08.04" },
    ],
  },
  muf: {
    key: "muf",
    eyebrow: "INCIDENT 03 · MATERIAL / PROCESS",
    label: "MUF Delamination",
    shortLabel: "Delamination",
    stage: "PACKAGE",
    signal: "MUF-24B material lot에서 SAM delamination이 2주 기준 대비 3.9배 증가했습니다.",
    signalDetail: "Floor time 상단과 vacuum 편차가 겹친 3개 LOT에서 신호가 집중됩니다.",
    incidentWindow: "2026.06.18—07.02",
    kpis: [
      { label: "Package Yield", value: "98.71", unit: "%", delta: "+0.36%p after hold", tone: "good", hint: "SAM sampling 포함" },
      { label: "Delamination", value: "1,600", unit: "DPPM", delta: "피크 대비 −72.4%", tone: "good", hint: "검사 표본 보정 값" },
      { label: "Material Hold", value: "1", delta: "MUF-24B", tone: "alert", hint: "영향 material lot" },
      { label: "영향 추정", value: "740", unit: "pcs", delta: "27,260 units 중", tone: "neutral", hint: "합성 단위 수량" },
    ],
    trend: [
      { date: "06.18", yield: 98.73, lots: 4 }, { date: "06.19", yield: 98.69, lots: 5 },
      { date: "06.20", yield: 98.58, lots: 5 }, { date: "06.21", yield: 98.42, lots: 4 },
      { date: "06.22", yield: 98.11, lots: 5, breach: true }, { date: "06.23", yield: 97.86, lots: 4, breach: true },
      { date: "06.24", yield: 97.64, lots: 5, breach: true }, { date: "06.25", yield: 97.72, lots: 6, breach: true },
      { date: "06.26", yield: 98.02, lots: 4, breach: true }, { date: "06.27", yield: 98.31, lots: 5 },
      { date: "06.28", yield: 98.49, lots: 5 }, { date: "06.29", yield: 98.62, lots: 4 },
      { date: "07.01", yield: 98.74, lots: 5 }, { date: "07.02", yield: 98.79, lots: 5 },
    ],
    pareto: [
      { code: "DEL", label: "Delamination", count: 286, share: 43, tone: "#f2b84b" },
      { code: "VOI", label: "Void", count: 146, share: 22, tone: "#ff9254" },
      { code: "WRP", label: "Warpage", count: 93, share: 14, tone: "#55b8f6" },
      { code: "CRK", label: "Package crack", count: 66, share: 10, tone: "#31c7a2" },
      { code: "OTH", label: "기타", count: 73, share: 11, tone: "#708099" },
    ],
    tools: [
      { name: "MUF-01", stage: "Mold", rate: 0.15, risk: 0.9, status: "정상" },
      { name: "MUF-03", stage: "Mold", rate: 0.58, risk: 3.9, status: "위험" },
      { name: "CUR-02", stage: "Cure", rate: 0.22, risk: 1.4, status: "주의" },
      { name: "SAM-01", stage: "Inspection", rate: 0.17, risk: 1.1, status: "정상" },
      { name: "SAM-02", stage: "Inspection", rate: 0.16, risk: 1.0, status: "정상" },
    ],
    lots: [
      { id: "PK6M-0623", product: "Stacked-M12", tool: "MUF-03", units: 6840, yield: 97.81, defect: "Delamination", shift: "D", status: "격리" },
      { id: "PK6M-0624", product: "Stacked-M12", tool: "MUF-03", units: 6720, yield: 97.59, defect: "Void", shift: "N", status: "격리" },
      { id: "PK6N-0625", product: "Stacked-M8", tool: "MUF-03", units: 7080, yield: 97.70, defect: "Delamination", shift: "N", status: "확인 중" },
      { id: "PK6N-0627", product: "Stacked-M8", tool: "CUR-02", units: 6940, yield: 98.29, defect: "Warpage", shift: "D", status: "모니터링" },
      { id: "PK6P-0701", product: "Stacked-M8", tool: "MUF-01", units: 7240, yield: 98.74, defect: "Delamination", shift: "D", status: "해제" },
    ],
    hypotheses: [
      { rank: 1, title: "Material floor time + vacuum 편차", metric: "Risk ratio 3.9×", evidence: "MUF-24B·MUF-03 조합 집중, SAM 면적과 동반 증가", confidence: 89, state: "Confirmed" },
      { rank: 2, title: "Cure ramp 상단 편차", metric: "+0.18%p loss", evidence: "CUR-02 구간 신호, material lot 통제 후 일부 잔존", confidence: 61, state: "Corroborated" },
      { rank: 3, title: "입고 moisture 편차", metric: "검증 대기", evidence: "보관 이력 신호 있으나 bake split 결과 대기", confidence: 34, state: "Suspected" },
    ],
    evidence: [
      { label: "SAM 검사", value: "Area +0.42%p", detail: "die edge 방향 delamination 면적 증가", status: "done" },
      { label: "Material 추적", value: "MUF-24B", detail: "floor time 상단 표본에 신호 집중", status: "done" },
      { label: "단면 분석", value: "Interface gap", detail: "표본 4/5에서 계면 gap 관측", status: "done" },
      { label: "조건 Split", value: "8 LOT", detail: "vacuum·floor time 복원 조건 검증 중", status: "active" },
    ],
    validation: {
      before: 0.58, after: 0.16, reduction: 72.4, lots: 8,
      title: "조건 복원 이후 SAM delamination 비율",
      series: [
        { label: "B-4", value: 0.51, phase: "before" }, { label: "B-3", value: 0.56, phase: "before" },
        { label: "B-2", value: 0.61, phase: "before" }, { label: "B-1", value: 0.64, phase: "before" },
        { label: "A+1", value: 0.24, phase: "after" }, { label: "A+2", value: 0.21, phase: "after" },
        { label: "A+3", value: 0.18, phase: "after" }, { label: "A+4", value: 0.16, phase: "after" },
        { label: "A+5", value: 0.15, phase: "after" }, { label: "A+6", value: 0.14, phase: "after" },
      ],
    },
    actions: [
      { type: "Containment", title: "MUF-24B hold 및 영향 LOT SAM 확대 검사", owner: "QE", state: "완료", date: "06.24" },
      { type: "Corrective", title: "floor time reset·vacuum 조건 복원", owner: "PE", state: "완료", date: "06.26" },
      { type: "Preventive", title: "material scan 기반 floor-time interlock", owner: "MFG", state: "검증 중", date: "07.02" },
    ],
  },
};

export const SCENARIO_ORDER: ScenarioKey[] = ["stacker", "socket", "muf"];

export const METRIC_DEFINITIONS = [
  ["FPY", "재검 없이 최초 검사에서 합격한 수량 ÷ 최초 검사 수량"],
  ["DPPM", "불량품 수 ÷ 검사 수량 × 1,000,000"],
  ["Retest recovery", "최초 fail 후 재검에서 pass한 수량 ÷ 최초 fail 수량"],
  ["Risk ratio", "특정 조건의 불량률 ÷ 비교 기준 불량률"],
];

export type TestFlowStageKey = "wafer-sort" | "package-test" | "burn-in" | "final-test" | "reliability";

export type TestFlowStage = {
  key: TestFlowStageKey;
  label: string;
  subtitle: string;
  input: number;
  tested: number;
  fpy: number;
  retestRecovery: number;
  dppm: number;
  testTime: number;
  uph: number;
  utilization: number;
  status: "stable" | "watch" | "hold";
  loss: string;
  owner: string;
  note: string;
};

export type TestBin = {
  code: string;
  label: string;
  family: string;
  firstFail: number;
  retestPass: number;
  share: number;
  disposition: "RETEST" | "FA" | "HOLD" | "PASS";
  note: string;
};

export type TestAsset = {
  id: string;
  type: string;
  program: string;
  socket: string;
  cycles: number;
  contact: number;
  pmDue: string;
  utilization: number;
  status: "정상" | "주의" | "점검";
};

export type TestOperations = {
  focus: string;
  window: string;
  sample: string;
  stages: TestFlowStage[];
  bins: TestBin[];
  assets: TestAsset[];
  handoff: Array<{ label: string; value: string; detail: string; tone: "good" | "warn" | "alert" }>;
};

export type QualificationGateState = "pass" | "watch" | "fail";

export type TestProgramQualification = {
  baselineRev: string;
  qualificationLot: string;
  disposition: string;
  dispositionTone: "good" | "warn" | "alert";
  rationale: string;
  gates: Array<{
    label: string;
    value: string;
    limit: string;
    state: QualificationGateState;
  }>;
  baselineTestTime: number;
  candidateTestTime: number;
  baselineUph: number;
  candidateUph: number;
  siteYields: Array<{ site: string; yield: number }>;
};

export type DispositionAction = "hold" | "release" | "fa";

export type LotDisposition = {
  id: string;
  scenario: ScenarioKey;
  lot_id: string;
  action: DispositionAction;
  reason: string;
  owner: string;
  author_name: string;
  created_at: string;
};

export type TestControlPlan = {
  product: string;
  testStage: string;
  programRev: string;
  specProfile: string;
  tatTarget: string;
  flow: string;
  gates: Array<{ label: string; value: string; state: "pass" | "watch" | "pending" }>;
};

export const TEST_CONTROL_PLANS: Record<ScenarioKey, TestControlPlan> = {
  stacker: {
    product: "Stacked-M8 / HBM-inspired",
    testStage: "Package + Final Test",
    programRev: "FT-M8-042",
    specProfile: "DB-M8-2026.08",
    tatTarget: "≤ 18 h",
    flow: "EPM → WBI → WT / Repair → Package Test → Module Test",
    gates: [
      { label: "Databook / margin", value: "DB-M8-2026.08", state: "pass" },
      { label: "Golden sample", value: "30 pcs / shift", state: "pass" },
      { label: "Tester correlation", value: "94% reproduce", state: "pass" },
      { label: "Release approval", value: "Test QE sign-off", state: "watch" },
    ],
  },
  socket: {
    product: "HBM-Socket evaluation lot",
    testStage: "Final Test",
    programRev: "FT-HBM-118",
    specProfile: "DB-HBM-2026.07",
    tatTarget: "≤ 12 h",
    flow: "EPM → WBI → WT / Repair → Package Test → Module Test",
    gates: [
      { label: "DC / AC / Function", value: "3-bin coverage", state: "pass" },
      { label: "Socket contact", value: "≤ 30 mΩ", state: "watch" },
      { label: "Retest policy", value: "B41 1-cycle", state: "pass" },
      { label: "Release approval", value: "PM sign-off", state: "pending" },
    ],
  },
  muf: {
    product: "Stacked-M12 / MUF qualification",
    testStage: "Package + Reliability Test",
    programRev: "FT-M12-205",
    specProfile: "DB-M12-2026.08",
    tatTarget: "≤ 24 h",
    flow: "EPM → WBI → WT / Repair → Package Test → Module Test",
    gates: [
      { label: "Databook / margin", value: "DB-M12-2026.08", state: "pass" },
      { label: "SAM correlation", value: "B55 ↔ delam", state: "watch" },
      { label: "Cross-section", value: "4 / 5 confirmed", state: "pass" },
      { label: "Material release", value: "MUF-24B hold", state: "pending" },
    ],
  },
};

export const TEST_PROGRAM_QUALIFICATIONS: Record<ScenarioKey, TestProgramQualification> = {
  stacker: {
    baselineRev: "FT-M8-041",
    qualificationLot: "Q-M8-0817 · 12,480 pcs",
    disposition: "PROGRAM PASS · PRODUCT HOLD",
    dispositionTone: "warn",
    rationale: "Program delta는 손실 원인에서 제외했습니다. Candidate rev는 유지하고 Package 증거가 닫힐 때까지 제품 투입만 보류합니다.",
    gates: [
      { label: "Golden correlation", value: "99.82%", limit: "≥ 99.70%", state: "pass" },
      { label: "False reject Δ", value: "+0.04%p", limit: "≤ 0.10%p", state: "pass" },
      { label: "Guardband coverage", value: "6.2σ", limit: "≥ 6.0σ", state: "pass" },
      { label: "Multisite max Δ", value: "0.19%p", limit: "≤ 0.25%p", state: "pass" },
    ],
    baselineTestTime: 2.46,
    candidateTestTime: 2.18,
    baselineUph: 1460,
    candidateUph: 1650,
    siteYields: [
      { site: "S1", yield: 98.12 }, { site: "S2", yield: 98.06 }, { site: "S3", yield: 98.18 }, { site: "S4", yield: 98.02 },
      { site: "S5", yield: 98.15 }, { site: "S6", yield: 98.08 }, { site: "S7", yield: 97.99 }, { site: "S8", yield: 98.10 },
    ],
  },
  socket: {
    baselineRev: "FT-HBM-117",
    qualificationLot: "Q-HBM-0803 · 10,240 pcs",
    disposition: "HOLD · SOCKET RE-QUAL",
    dispositionTone: "alert",
    rationale: "Candidate test time은 개선됐지만 S7 site 편차와 false reject가 기준을 초과했습니다. Socket 교체 후 correlation을 다시 잠급니다.",
    gates: [
      { label: "Golden correlation", value: "98.91%", limit: "≥ 99.70%", state: "fail" },
      { label: "False reject Δ", value: "+0.76%p", limit: "≤ 0.10%p", state: "fail" },
      { label: "Guardband coverage", value: "6.1σ", limit: "≥ 6.0σ", state: "pass" },
      { label: "Multisite max Δ", value: "1.42%p", limit: "≤ 0.25%p", state: "fail" },
    ],
    baselineTestTime: 2.12,
    candidateTestTime: 1.94,
    baselineUph: 1700,
    candidateUph: 1860,
    siteYields: [
      { site: "S1", yield: 97.61 }, { site: "S2", yield: 97.55 }, { site: "S3", yield: 97.67 }, { site: "S4", yield: 97.51 },
      { site: "S5", yield: 97.58 }, { site: "S6", yield: 97.62 }, { site: "S7", yield: 96.25 }, { site: "S8", yield: 97.54 },
    ],
  },
  muf: {
    baselineRev: "FT-M12-204",
    qualificationLot: "Q-M12-0701 · 11,520 pcs",
    disposition: "PROGRAM PASS · MATERIAL HOLD",
    dispositionTone: "warn",
    rationale: "전기 Test program은 release 기준을 충족했습니다. MUF-24B material과 Package reliability 승인만 별도 hold로 유지합니다.",
    gates: [
      { label: "Golden correlation", value: "99.74%", limit: "≥ 99.70%", state: "pass" },
      { label: "False reject Δ", value: "+0.08%p", limit: "≤ 0.10%p", state: "pass" },
      { label: "Guardband coverage", value: "6.0σ", limit: "≥ 6.0σ", state: "pass" },
      { label: "Multisite max Δ", value: "0.23%p", limit: "≤ 0.25%p", state: "watch" },
    ],
    baselineTestTime: 2.27,
    candidateTestTime: 2.06,
    baselineUph: 1590,
    candidateUph: 1750,
    siteYields: [
      { site: "S1", yield: 98.71 }, { site: "S2", yield: 98.66 }, { site: "S3", yield: 98.74 }, { site: "S4", yield: 98.62 },
      { site: "S5", yield: 98.69 }, { site: "S6", yield: 98.57 }, { site: "S7", yield: 98.80 }, { site: "S8", yield: 98.64 },
    ],
  },
};

const FLOW_LABELS: Record<TestFlowStageKey, string> = {
  "wafer-sort": "Wafer Sort",
  "package-test": "Package Test",
  "burn-in": "Burn-in",
  "final-test": "Final Test",
  reliability: "Reliability",
};

export const TEST_OPERATIONS: Record<ScenarioKey, TestOperations> = {
  stacker: {
    focus: "Open / High-R가 Final Test에서 감지되지만, Package Test의 접합 품질과 교차 확인해야 하는 케이스",
    window: "08.05—08.18 · 32,840 units",
    sample: "Golden 30 pcs / LOT · 교대별 1회",
    stages: [
      { key: "wafer-sort", label: FLOW_LABELS["wafer-sort"], subtitle: "Wafer map", input: 41200, tested: 41180, fpy: 99.41, retestRecovery: 42, dppm: 5900, testTime: 0.82, uph: 4380, utilization: 78, status: "stable", loss: "−0.12%p", owner: "WS-02", note: "wafer map와 package fail 위치의 상관을 주간 단위로 확인" },
      { key: "package-test", label: FLOW_LABELS["package-test"], subtitle: "Interconnect", input: 41180, tested: 41180, fpy: 98.72, retestRecovery: 58, dppm: 12800, testTime: 1.46, uph: 2460, utilization: 72, status: "watch", loss: "−0.69%p", owner: "PKG-FT-02", note: "X-ray offset +2.5 μm 표본과 Open bin 위치를 매칭" },
      { key: "burn-in", label: FLOW_LABELS["burn-in"], subtitle: "Stress screen", input: 40653, tested: 40653, fpy: 99.08, retestRecovery: 31, dppm: 9200, testTime: 18.4, uph: 196, utilization: 84, status: "stable", loss: "−0.31%p", owner: "BI-01", note: "stress 이후 재발하는 latent fail 여부만 분리 추적" },
      { key: "final-test", label: FLOW_LABELS["final-test"], subtitle: "DC / AC / Func", input: 40280, tested: 40280, fpy: 98.07, retestRecovery: 63, dppm: 19300, testTime: 2.18, uph: 1650, utilization: 81, status: "watch", loss: "−0.86%p", owner: "TST-04", note: "alternate tester 94% 재현으로 testability보다 package 원인 우선" },
      { key: "reliability", label: FLOW_LABELS.reliability, subtitle: "HTOL / temp", input: 39802, tested: 1200, fpy: 99.84, retestRecovery: 18, dppm: 1600, testTime: 42.0, uph: 68, utilization: 63, status: "stable", loss: "−0.04%p", owner: "REL-03", note: "교정 후 10 LOT의 reliability escape 신호 없음" },
    ],
    bins: [
      { code: "B07", label: "Open / High-R", family: "CONTACT / FUNC", firstFail: 382, retestPass: 18, share: 47, disposition: "FA", note: "alternate tester에서도 94% 재현" },
      { code: "B12", label: "Misalignment", family: "PACKAGE", firstFail: 154, retestPass: 12, share: 19, disposition: "FA", note: "X-ray offset와 동일 위치" },
      { code: "B03", label: "Bridge / Short", family: "DC", firstFail: 98, retestPass: 44, share: 12, disposition: "RETEST", note: "probe mark 확인 후 재검" },
      { code: "B21", label: "Die crack", family: "RELIABILITY", firstFail: 73, retestPass: 6, share: 9, disposition: "HOLD", note: "단면 분석 표본 선정" },
      { code: "B99", label: "Other", family: "ETC", firstFail: 106, retestPass: 52, share: 13, disposition: "PASS", note: "Golden sample과 분리 모니터링" },
    ],
    assets: [
      { id: "TST-04", type: "Final tester", program: "FT-M8-042", socket: "SCK-12A", cycles: 18420, contact: 28.4, pmDue: "D-3", utilization: 81, status: "주의" },
      { id: "TST-06", type: "Final tester", program: "FT-M8-042", socket: "SCK-12B", cycles: 9210, contact: 21.1, pmDue: "D-18", utilization: 68, status: "정상" },
      { id: "PKG-FT-02", type: "Package tester", program: "PK-M8-117", socket: "SCK-09C", cycles: 14280, contact: 24.7, pmDue: "D-7", utilization: 72, status: "정상" },
    ],
    handoff: [
      { label: "Containment", value: "STK-03 hold", detail: "영향 4 LOT 격리 · TST-04 우회 투입", tone: "alert" },
      { label: "Next check", value: "Golden 30 pcs", detail: "야간 첫 LOT에서 Open bin 재현 확인", tone: "warn" },
      { label: "Exit criteria", value: "10 LOT stable", detail: "FPY 98% 이상 · contact 30 mΩ 이하", tone: "good" },
    ],
  },
  socket: {
    focus: "Final Test의 false reject를 retest recovery와 socket contact trend로 분리하는 케이스",
    window: "08.09—08.20 · 28,460 units",
    sample: "Retest 100% · socket별 3 LOT stratify",
    stages: [
      { key: "wafer-sort", label: FLOW_LABELS["wafer-sort"], subtitle: "Wafer map", input: 35800, tested: 35760, fpy: 99.62, retestRecovery: 24, dppm: 4100, testTime: 0.78, uph: 4610, utilization: 74, status: "stable", loss: "−0.08%p", owner: "WS-03", note: "wafer-level fail은 baseline 범위" },
      { key: "package-test", label: FLOW_LABELS["package-test"], subtitle: "Electrical screen", input: 35760, tested: 35760, fpy: 99.12, retestRecovery: 49, dppm: 8800, testTime: 1.32, uph: 2720, utilization: 70, status: "stable", loss: "−0.50%p", owner: "PKG-FT-04", note: "package continuity는 정상, final test와 분리" },
      { key: "burn-in", label: FLOW_LABELS["burn-in"], subtitle: "Stress screen", input: 35445, tested: 35445, fpy: 99.36, retestRecovery: 28, dppm: 6400, testTime: 16.8, uph: 214, utilization: 79, status: "stable", loss: "−0.24%p", owner: "BI-02", note: "stress 조건에서 fail 증가 없음" },
      { key: "final-test", label: FLOW_LABELS["final-test"], subtitle: "DC / AC / Func", input: 35218, tested: 35218, fpy: 97.44, retestRecovery: 76, dppm: 25600, testTime: 1.94, uph: 1860, utilization: 86, status: "hold", loss: "−1.92%p", owner: "TST-07", note: "contact +38 mΩ, retest pass가 높아 testability 의심" },
      { key: "reliability", label: FLOW_LABELS.reliability, subtitle: "Temp cycle", input: 34318, tested: 960, fpy: 99.79, retestRecovery: 11, dppm: 2100, testTime: 38.0, uph: 75, utilization: 58, status: "stable", loss: "−0.05%p", owner: "REL-01", note: "socket 교체 전후 escape 차이 없음" },
    ],
    bins: [
      { code: "B41", label: "Contact open", family: "TESTABILITY", firstFail: 468, retestPass: 76, share: 51, disposition: "RETEST", note: "socket 교체 시 81% pass" },
      { code: "B18", label: "DC leakage", family: "DC", firstFail: 174, retestPass: 38, share: 19, disposition: "FA", note: "온도 corner에서도 동일" },
      { code: "B22", label: "AC timing", family: "AC", firstFail: 124, retestPass: 45, share: 14, disposition: "RETEST", note: "program rev 차이 확인" },
      { code: "B31", label: "Functional", family: "FUNC", firstFail: 83, retestPass: 22, share: 9, disposition: "FA", note: "fail signature 3종 분리" },
      { code: "B99", label: "Other", family: "ETC", firstFail: 65, retestPass: 41, share: 7, disposition: "PASS", note: "관리 한계 내" },
    ],
    assets: [
      { id: "TST-07", type: "Final tester", program: "FT-HBM-118", socket: "SCK-07D", cycles: 24680, contact: 68.2, pmDue: "D-1", utilization: 86, status: "점검" },
      { id: "TST-08", type: "Final tester", program: "FT-HBM-118", socket: "SCK-07E", cycles: 10240, contact: 23.6, pmDue: "D-12", utilization: 74, status: "정상" },
      { id: "PKG-FT-04", type: "Package tester", program: "PK-HBM-071", socket: "SCK-04A", cycles: 11860, contact: 25.2, pmDue: "D-9", utilization: 70, status: "정상" },
    ],
    handoff: [
      { label: "Containment", value: "SCK-07D 교체", detail: "TST-07 신규 socket 투입 후 3 LOT 확인", tone: "alert" },
      { label: "Next check", value: "B41 recovery", detail: "retest pass 80% 이상이면 testability 분리", tone: "warn" },
      { label: "Exit criteria", value: "Contact ≤30 mΩ", detail: "PM sign-off 및 program rev lock", tone: "good" },
    ],
  },
  muf: {
    focus: "Package delamination의 electrical escape를 Final Test·SAM·material 이력으로 연결하는 케이스",
    window: "08.01—08.18 · 34,820 units",
    sample: "SAM 100% screen · material lot별 5 pcs cross-section",
    stages: [
      { key: "wafer-sort", label: FLOW_LABELS["wafer-sort"], subtitle: "Wafer map", input: 42600, tested: 42580, fpy: 99.55, retestRecovery: 35, dppm: 5200, testTime: 0.81, uph: 4430, utilization: 76, status: "stable", loss: "−0.11%p", owner: "WS-01", note: "wafer-level defect는 MUF lot과 독립" },
      { key: "package-test", label: FLOW_LABELS["package-test"], subtitle: "Mold / Cure", input: 42580, tested: 42580, fpy: 98.24, retestRecovery: 28, dppm: 17600, testTime: 1.62, uph: 2220, utilization: 83, status: "hold", loss: "−1.31%p", owner: "MUF-03", note: "MUF-24B floor time과 SAM area 동반 증가" },
      { key: "burn-in", label: FLOW_LABELS["burn-in"], subtitle: "Stress screen", input: 41831, tested: 41831, fpy: 98.91, retestRecovery: 19, dppm: 10900, testTime: 19.2, uph: 188, utilization: 87, status: "watch", loss: "−0.67%p", owner: "BI-03", note: "latent delam이 thermal stress에서 확대되는지 확인" },
      { key: "final-test", label: FLOW_LABELS["final-test"], subtitle: "DC / AC / Func", input: 41375, tested: 41375, fpy: 98.63, retestRecovery: 22, dppm: 13700, testTime: 2.06, uph: 1750, utilization: 79, status: "watch", loss: "−0.28%p", owner: "TST-03", note: "전기적 bin과 SAM 면적을 lot 단위로 correlate" },
      { key: "reliability", label: FLOW_LABELS.reliability, subtitle: "HTOL / temp", input: 40808, tested: 1040, fpy: 99.52, retestRecovery: 9, dppm: 4800, testTime: 44.0, uph: 64, utilization: 61, status: "watch", loss: "−0.31%p", owner: "REL-04", note: "material 조건 복원 후 reliability sample 확대" },
    ],
    bins: [
      { code: "B55", label: "Leakage drift", family: "DC", firstFail: 288, retestPass: 22, share: 34, disposition: "FA", note: "SAM delam area와 양의 상관" },
      { code: "B63", label: "Open / intermittent", family: "FUNC", firstFail: 212, retestPass: 18, share: 25, disposition: "HOLD", note: "thermal cycle 전후 재현" },
      { code: "B72", label: "AC timing", family: "AC", firstFail: 156, retestPass: 31, share: 18, disposition: "RETEST", note: "Cure ramp 조건과 split" },
      { code: "B14", label: "Package crack", family: "PACKAGE", firstFail: 124, retestPass: 8, share: 14, disposition: "FA", note: "cross-section 4/5 확인" },
      { code: "B99", label: "Other", family: "ETC", firstFail: 73, retestPass: 36, share: 9, disposition: "PASS", note: "기준 sample과 비교" },
    ],
    assets: [
      { id: "TST-03", type: "Final tester", program: "FT-M12-205", socket: "SCK-11B", cycles: 13840, contact: 26.8, pmDue: "D-10", utilization: 79, status: "정상" },
      { id: "MUF-03", type: "Mold tool", program: "MUF-24B", socket: "VAC-03", cycles: 8240, contact: 0, pmDue: "D-2", utilization: 88, status: "점검" },
      { id: "SAM-02", type: "SAM inspection", program: "SAM-STACK-09", socket: "N/A", cycles: 6420, contact: 0, pmDue: "D-21", utilization: 64, status: "정상" },
    ],
    handoff: [
      { label: "Containment", value: "MUF-24B hold", detail: "floor time 상단 material 2 lot 출하 보류", tone: "alert" },
      { label: "Next check", value: "SAM ↔ B55", detail: "전기 bin과 delam area의 lot-level 일치 확인", tone: "warn" },
      { label: "Exit criteria", value: "8 LOT split", detail: "SAM 0.20% 이하 · cross-section gap 0/5", tone: "good" },
    ],
  },
};
