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
