<div align="center">

<img src="frontend/public/og.png" width="760" alt="YieldScope P&T 품질 인텔리전스" />

# YieldScope P&T

### Test Program release부터 불량 격리·RCA·생산성 검증까지 연결하는 P&T Mass Production Engineering OS

`Program qualification → Test release → LOT disposition → FA/RCA → CAPA validation`

<p>
  <a href="https://yieldscope-pnt.coders.kr">
    <img src="https://img.shields.io/badge/LIVE-yieldscope--pnt.coders.kr-0B8F78?style=for-the-badge&logo=googlechrome&logoColor=white" alt="운영 서비스" />
  </a>
  <a href="https://github.com/boclair98/yieldscope-pnt">
    <img src="https://img.shields.io/badge/GitHub-Source_Code-181717?style=for-the-badge&logo=github" alt="GitHub 저장소" />
  </a>
</p>

<p>
  <img src="https://img.shields.io/badge/Next.js-16.2.2-111827?style=flat-square&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/PostgreSQL-Audit_Log-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Test_Flow-EPM_to_Module-55B8F6?style=flat-square" alt="Test flow" />
  <img src="https://img.shields.io/badge/Data-Synthetic_Demo-F2B84B?style=flat-square" alt="Synthetic data" />
</p>

**[운영 서비스 바로가기 →](https://yieldscope-pnt.coders.kr)**

</div>

> [!IMPORTANT]
> 이 프로젝트는 공개 자료를 참고해 만든 **100% 합성 데이터 기반 포트폴리오**입니다. 실제 SK hynix의 내부 시스템·Databook·MES·TMS·FA 데이터나 공식 서비스가 아닙니다. 다만 실제 현장에 연결할 수 있도록 데이터 입력, 판정, 승인, 감사 로그의 경계를 분리했습니다.

## 프로젝트 목표

SK hynix P&T Test 직무의 핵심 목표인 `수율·품질·생산성`을 한 화면의 숫자에 가두지 않고, 다음 교대와 유관 부서가 실행할 수 있는 판정 흐름으로 만드는 것을 목표로 했습니다.

- Test release 전에 Databook, golden sample, tester correlation을 확인합니다.
- Baseline/Candidate program의 correlation, false reject, guardband, multisite 편차와 test time 개선을 함께 검증합니다.
- First fail과 retest recovery를 분리해 testability 문제와 제품 불량을 구분합니다.
- LOT 단위의 HOLD / RELEASE / FA 결정을 사유·담당자·시각과 함께 남깁니다.
- 전기적 재현, X-ray·SAM·단면 분석, 개선 후 LOT 검증을 하나의 증거 체인으로 관리합니다.
- FPY·DPPM뿐 아니라 test time, UPH, utilization, TAT까지 함께 확인합니다.

## 프로젝트 개요

| 항목 | 내용 |
| --- | --- |
| 프로젝트명 | YieldScope P&T |
| 도메인 | 반도체 Package & Test / 양산기술(P&T) |
| 핵심 사용자 | P&T Test Engineer, 제조·양산기술, Package/Process, FA·Quality, Test QE |
| 대표 시나리오 | Stacker 정렬 편차, Socket false reject, MUF delamination |
| 핵심 결과물 | Shift Command Center, Test Program Qualification, Decision Brief, Data Studio, Release readiness, Test flow, Bin triage, LOT disposition, RCA, CAPA validation |
| 서비스 | [yieldscope-pnt.coders.kr](https://yieldscope-pnt.coders.kr) |
| 저장소 | [github.com/boclair98/yieldscope-pnt](https://github.com/boclair98/yieldscope-pnt) |

## 문제를 어떻게 정의했나요?

P&T Test에서 “수율이 낮다”는 현상만으로는 다음 조치를 결정하기 어렵습니다.

1. 어느 Test stage·제품·LOT에서 신호가 시작되었는가?
2. First fail은 실제 제품 불량인가, socket·contact·program에 의한 testability 문제인가?
3. Alternate tester/socket 재검 결과가 원인 가설을 지지하는가?
4. 출하를 HOLD할 것인가, 재검할 것인가, FA로 넘길 것인가?
5. 조치 이후 수율·품질·생산성·TAT가 동시에 안정되었는가?

따라서 이 프로젝트는 분석 화면을 여러 개 나열하는 대신 아래 순서를 하나의 사용자 여정으로 설계했습니다.

```text
Program qualification → 신호 감지 → 영향 LOT 격리 → Testability / Package 원인 분리
       → 교차 재현 → FA 증거 체인 → 조치 전후 검증 → 다음 교대 인계
```

## 프로젝트 전체 구조

```text
공개 Case / 제품군 선택
        ↓
EPM → Wafer Burn-in → Wafer Test / Repair → Package Test → Module Test
        ↓
Baseline / Candidate → Correlation·False reject·Guardband·Multisite → Program release
        ↓
FPY·DPPM·Retest recovery·Test time·UPH·TAT 확인
        ↓
Bin·Tester·Socket·Program·Shift 층화 분석
        ↓
Alternate tester / socket 교차 재현
        ↓
LOT HOLD / RELEASE / FA 결정 + 감사 로그
        ↓
X-ray·SAM·Cross-section 증거 체인
        ↓
Containment → Corrective → Preventive → 개선 후 LOT 검증
```

## 주요 기능

### 0. Shift Command Center

첫 화면은 소개 문구 대신 실제 운영 대시보드로 시작합니다. 사용자는 Stacker·Socket·MUF Case를 바로 전환하고, 제품·공정·Program 개정·시나리오 기간과 데이터 출처를 확인한 다음 `Release · Loss · Exposure · Owner · SLA`를 판단합니다.

- `GO / CONDITIONAL / HOLD`, PASS/WATCH/미완료 Gate 수, 다음 필수 확인 항목을 기준과 함께 제시합니다. 근거가 정의되지 않은 임의 readiness 점수는 표시하지 않습니다.
- Yield gap, DPPM gap, 미해제 LOT·노출 수량을 기준값과 함께 표시합니다.
- Retest recovery와 alternate tester/socket·물리 분석 증거를 함께 보며 `Testability 선확인`과 `Product / Package FA 선확인` 방향을 분리합니다.
- Containment → Next check → Exit criteria를 `NOW / +60분 / +120분` Action queue로 배치합니다.
- `Detect → Contain → Reproduce → Decide → Verify` Control loop에서 현재 단계와 다음 근거 화면을 연결합니다.
- KPI 정의를 hover에 숨기지 않고 항상 표시해 터치 환경에서도 확인할 수 있도록 했습니다. 실제 제품·공정별 Case 전환은 첫 화면에서 바로 조작합니다.
- 실시간 공장 시스템과 연결되지 않았음을 대시보드 상단에서 명시합니다. 업로드 CSV는 현재 브라우저 범위에서 처리되며 실제 사내 승인·MES 처분 동작을 하지 않습니다.

이 UI는 단순 모니터링보다 **교대 시작 시 무엇을 멈추고, 누가 확인하며, 어떤 기준으로 다시 투입할지**를 빠르게 합의하는 데 초점을 맞췄습니다.

### 0-1. Test Program Qualification

양산기술 P&T의 실제 업무 중 `test program 변경 영향 검증`을 다루는 workbench입니다. 기존 화면의 사례 수치와 flow card는 설명용 합성 Case이며, 원자료를 분석하는 흐름은 아래 CSV workbench에서 별도로 수행합니다. 어느 결과도 제품 release, 출하, MES disposition을 승인하지 않습니다.

- Baseline/Candidate의 동일 UUT를 LOT·test stage·corner·site·tester가 일치하는 paired cohort로 비교합니다. 한 study는 한 stage와 한 condition만 허용하고, 다른 corner는 별도 study로 나눕니다.
- Paired coverage·전체/LOT별 표본 수·LOT/site 수, first-pass yield 변화, 관측 final-fail DPPM 변화, 양방향 first-pass 전이, retest recovery, P95 test time, golden set 판정 일치율, site spread 및 최악 LOT의 FPY 변화를 계산합니다. LOT 수·LOT별 최소 paired unit·최악 LOT FPY 하락 한계도 사용자가 plan에 맞게 설정합니다.
- 모든 pass/fail gate의 limit은 빈칸으로 시작합니다. 담당자가 승인된 qualification plan의 기준을 입력해야 하며, `ENGINEERING REVIEW 가능`은 수치 gate 통과일 뿐 사람의 승인·제품 release가 아닙니다.
- CSV 필수 헤더: `unit_id, lot_id, test_stage, test_condition, program_revision, site, tester_id, first_pass, final_pass, retest_count, first_bin, final_bin, golden_expected, test_time_sec`.
- `first_pass`는 최초 검사, `final_pass`는 승인된 retest까지 마친 최종 상태입니다. `retest_count`는 최초 검사 이후 재시험 횟수, `first_bin`/`final_bin`은 최초/최종 FAIL bin, `golden_expected`는 승인 Golden set의 기대 PASS/FAIL(비 Golden은 공란)입니다. revision당 unit은 한 행이어야 하며, 두 revision의 paired unit은 LOT·stage·condition·site·tester 식별자가 일치해야 합니다. 분석 전에 Baseline/Candidate revision을 사용자가 직접 선택합니다.
- 비교는 동일 unit 교집합만 사용합니다. Candidate의 paired coverage가 승인 기준보다 낮거나 LOT별 최소 표본이 부족하면 gate가 통과하지 않습니다. UI는 열화 기준으로 정렬한 최악 LOT 20개까지만 보여주고 JSON에도 익명 alias로 최대 20개만 포함합니다.
- 결과는 브라우저 메모리에서 계산합니다. JSON 보고서에는 원본 unit/LOT/site ID나 행 데이터를 포함하지 않고 source SHA-256, 사용자 traceability alias, 익명 LOT/site 집계, 계산 결과와 gate 근거를 넣습니다. 파일명은 내보내지 않습니다.
- `observed final-fail DPPM = paired final FAIL / paired units × 1,000,000`; 표본의 관측 비율을 환산한 것이며 생산 DPPM 추정치가 아닙니다. Retest recovery는 `first FAIL 후 final PASS / first FAIL`, golden set 지표는 correlation이 아닌 판정 일치율입니다. P95는 CSV의 unit test time만 사용하며 handler/index 포함 UPH·TAT가 아닙니다.
- 첫 FAIL에는 `first_bin`, 최종 FAIL에는 `final_bin`, first FAIL 후 final PASS에는 `retest_count ≥ 1`을 요구합니다. 한 CSV는 8 MiB·100,000행·128 sites까지 받으며 단일 test stage/condition에 한정합니다. 이 요약 파일은 전체 retest sequence, guardband/margin, timing coverage, tester correlation을 입증하지 않으므로 해당 항목은 승인 plan의 별도 근거로 검토해야 합니다.
- 합성 예시와 기본 기준은 동작 확인용이며 현장 기준이 아닙니다. 공개 데모에는 실제 제품·고객·LOT·serial·program/spec 정보나 기밀 파일을 입력하지 마세요.

### 0-2. P&T Decision Brief

화면 상단에서 `P&T Test / Quality·QE / Manufacturing` 관점을 전환하면 같은 Case를 역할별 의사결정 순서로 재정렬합니다. `현재 신호 → 지금 결정 → 다음 담당자`를 한 줄로 읽고, 해당 업무 화면으로 바로 이동할 수 있어 교대 리뷰와 면접 데모에서 핵심 판단을 빠르게 설명할 수 있습니다.

### 0-3. Data Studio — Case 설정·공유

고정 문구와 기준값을 코드에 직접 수정하지 않고, `데이터 설정` 패널에서 팀이 Case를 직접 구성할 수 있습니다.

- 제품군·공정·Program Rev·TAT·분석 기간
- Case 이름·품질 신호·신호 상세(집중 LOT·장비·교대 조건)
- Yield 목표·Final Test DPPM 한계·Retest 목표
- 최신 Yield·Final Test FPY/DPPM·Retest recovery·Top defect 비중
- LOT Watchlist CSV 교체 업로드(기존 CSV 내보내기 포맷 재사용)
- 브라우저 저장(localStorage), 현재 Case 기본값 복원, 전체 Case 설정 JSON 내보내기/불러오기

### 0-4. Package Test Matrix — 패키지별 테스트 계획

`Test Operations`에서 패키지 구조를 선택하면 양산 선별 검사와 샘플 기반 신뢰성 검증을 분리한 체크리스트를 엽니다.

| 프로파일 | 중심 검증 흐름 |
| --- | --- |
| HBM 적층 패키지 | KGSD/wafer 이력 → DC continuity/open·short → memory function·I/O timing → thermal corner → 별도 reliability qualification |
| 2.5D HBM SiP | HBM·logic·interposer genealogy → 경로 open/short → HBM↔logic function → SiP 열·기계 검증 |
| 3DS / DDR5 RDIMM | 모듈 구성·rank 이력 → address/data function → speed·timing margin → module/system characterization |
| UTV · WLP / LAR | wafer map → WLP 전기 검사 → 구조에 맞는 외관/X-ray/SAM → test vehicle 및 look-ahead reliability |

- 각 항목에 `미실행 / PASS / WATCH / FAIL / N/A`, 결과·표본 수, 기준 출처 또는 증거 ID를 기록할 수 있습니다.
- 실행 추적정보에 제품/P/N, package revision, LOT/run ID, test program revision, Databook/spec revision, qualification ID·계획 개정 및 담당 조직 별칭을 기록합니다. 양산 lane은 제품·package·LOT·program·spec·담당자 식별자를, qualification lane은 제품·package·qual ID·계획 개정·spec·담당자 식별자를 각각 요구합니다.
- 필수 gate 결과와 증거 ID, lane별 추적정보가 모두 있어야 `PLAN COMPLETE`로 닫힙니다. FAIL은 양산 `REVIEW HOLD`, qualification `ISSUE`로 표시합니다. 현재 실행값 초기화는 해당 프로파일의 결과·추적정보만 비우고 사용자 정의 항목은 보존합니다.
- Engineering Review 카드가 FAIL, 누락된 제품·LOT·Program·Qual 식별자, 필수 검사 결과·증거의 누락을 양산/qualification 별로 우선순위에 따라 보여줍니다. `PLAN COMPLETE`는 입력 완결성 표시이며 실제 출하 승인이나 규격 적합성 검증 결과가 아닙니다.
- 팀별 검사 항목을 양산 또는 qualification lane에 추가하고, stage·측정 형식·목적·필수 gate 여부를 정의할 수 있습니다. 사용자 정의 항목 제거 시 연결된 결과도 함께 삭제하며 확인을 받습니다. 팀 항목은 승인된 recipe가 아니므로 해당 조직의 기준·승인을 별도로 확인해야 합니다.
- 예시 결과 불러오기 기능은 명시적으로 합성 샘플을 채우며 실제 SK hynix 생산 데이터가 아닙니다.
- 실행 컨텍스트, 사용자 정의 항목, 결과는 현재 브라우저의 localStorage에 저장하며 CSV 내보내기에 프로파일, 식별정보, 상태, 결과 및 증거 ID가 포함됩니다. CSV 수식 실행 위험을 줄이기 위해 수식 접두 문자를 텍스트로 처리합니다. 서버 전송, 계정 간 동기화, 권한 분리, 변경 이력 및 승인 워크플로는 구현되어 있지 않습니다. 운영 데이터나 고객·개인 식별 정보를 공개 데모에 입력하지 마세요.
- 시험 항목은 공개 자료를 바탕으로 만든 예시 계획입니다. 실제 양산에서는 제품 Databook, 고객 요구, 승인된 표준 개정판 및 사내 승인 계획이 판정 기준입니다. 화면의 항목은 SK hynix의 내부 recipe를 나타내지 않습니다.

LOT CSV는 다음 헤더를 사용합니다: `lot_id, product, tool, units, yield_pct, top_defect, shift, status`. `status`는 `격리`, `확인 중`, `모니터링`, `해제` 중 하나여야 합니다.

저장한 설정은 차트·KPI·Release readiness·Decision Brief에 즉시 반영됩니다. 공개 데모의 입력 편의를 위한 기능이며, 사내 운영에서는 MES/TMS/Tester/Databook adapter와 승인 권한을 함께 연결하는 것을 전제로 합니다.

### 1. Test Release Control

양산 투입 전 Test Plan을 고정하고 `Databook / Margin → Golden sample → Tester correlation → Release approval` 순으로 gate를 확인합니다.

`GO / CONDITIONAL / HOLD` readiness 판정은 gate 상태, stage HOLD, tester·socket health를 함께 계산해 다음 확인 항목을 제안합니다. 이 점수는 합성 데모의 의사결정 보조 기능이며 출하 승인을 대신하지 않습니다.

### 2. Mass Production Test Flow

`Wafer Sort → Package Test → Burn-in → Final Test → Reliability`를 선택하면서 단계별 FPY, DPPM, retest recovery, test time, UPH, utilization을 비교합니다.

패키지별 테스트 Matrix에서는 제품/LOT 양산 screen과 표본 기반 신뢰성 qualification을 별도 lane으로 관리합니다. HBM의 MR-MUF 및 UTV/WLP/LAR 흐름, HBM이 로직 다이와 결합되는 2.5D SiP, TSV 기반 3DS 메모리 모듈처럼 구조가 다른 패키지의 공개된 차이를 반영하되, 세부 limit은 사용자가 해당 제품의 승인 자료를 기준으로 입력합니다.

### 3. Bin & Retest Triage

DC·AC·Function·Contact·Package 계열 Bin을 first fail, retest pass, share로 분리합니다. Retest recovery가 높으면 contact·program testability를 먼저 확인하고, 낮으면 package·die FA 대상으로 승격합니다.

### 4. Tester / Socket Health

Program revision, socket cycle, contact resistance, PM due, utilization을 같은 화면에서 교차 확인해 장비 집중도와 불량 신호의 상관을 탐색합니다.

### 5. LOT Disposition & Audit Log

LOT Watchlist의 `HOLD / RELEASE / FA`는 실제 처분 명령이 아니라 **검토 요청**입니다. 요청에는 근거, 증거 ID, Test Program 개정, 승인 규격 개정, 담당 조직을 필수로 남깁니다. 다른 로그인 사용자가 근거 메모와 함께 승인 또는 반려해야 하며, 자기 요청은 스스로 승인할 수 없습니다. 이전 원클릭 기록은 `legacy`로 표시해 승인된 기록으로 승격하지 않습니다. 실제 LOT 상태, MES, 출하는 어느 단계에서도 변경되지 않습니다. 검토 요청 조회는 로그인 후 가능하지만, 사내 역할·조직별 격리는 아직 없어 기밀 데이터를 입력해서는 안 됩니다.

### 6. RCA Workbench

`Stratify → Reproduce → Corroborate` 순서로 가설 신뢰도를 올립니다. 전기적 재현, 비파괴 분석, 물리 분석, 개선 검증이 같은 방향으로 맞을 때만 Confirmed로 해석합니다.

### 7. CAPA & Shift Handoff

Containment, Corrective, Preventive action의 전후 효과를 비교하고, 다음 교대가 Containment·Next check·Exit criteria를 항목별로 확인할 수 있도록 했습니다.

## 프로젝트 중점사항

- **역할별로 같은 데이터를 다르게 읽기**: Test는 testability·retest, QE는 gate·disposition·evidence, Manufacturing은 FPY·UPH·TAT·handoff를 먼저 보도록 Decision Brief를 제공합니다.
- **Program과 제품 원인을 분리하기**: Candidate program qualification이 통과해도 Package·material blocker가 남으면 제품 release는 별도로 HOLD합니다.
- **수율만으로 결론 내리지 않기**: FPY·DPPM과 함께 Test time, UPH, utilization, TAT를 확인합니다.
- **First fail과 실제 불량 분리하기**: retest recovery와 alternate tester/socket 재현을 함께 봅니다.
- **상관과 인과 구분하기**: Risk ratio는 우선순위를 정하는 지표일 뿐 원인 확정값으로 표시하지 않습니다.
- **판정 요청과 실제 조치를 구분하기**: LOT 검토 요청은 증거·Program·Spec 개정을 묶고 독립 검토를 요구하되, 실제 MES/출하 상태에는 반영하지 않습니다.
- **운영 경계를 분리하기**: 합성 Case·Trend 데이터와 로그인 필요한 review/disposition API를 분리했습니다.
- **실제 연결 지점을 명시하기**: MES/TMS/Tester export, Databook, FA 결과, 역할 기반 승인선을 향후 adapter 대상으로 정의했습니다.

## 기술적 이슈와 해결 방향

| 이슈 | 판단 기준 | 구현 방향 |
| --- | --- | --- |
| 양산 투입 여부를 수율 하나로 판단하기 어려움 | Gate·stage·장비 상태 동시 확인 | Release readiness 계산 및 다음 조치 제안 |
| First fail이 제품 불량인지 testability인지 모호함 | Retest recovery·alternate tester/socket 재현 | Bin triage와 evidence chain 연결 |
| 근거 없는 원클릭 Release가 실제 승인처럼 보임 | 증거·개정·독립 검토 요구 | PostgreSQL 검토 요청 및 2인 검토 경계 |
| 조치 후 효과가 일시적인지 확인하기 어려움 | Before/after LOT, 감소율, exit criteria | CAPA validation과 shift handoff |
| 공개 데모에서 사내 데이터를 오해할 수 있음 | 합성 데이터·실제 연결 필요사항 명시 | README·화면·API에서 운영 경계 고지 |

## 데이터 모델과 API

```text
users
  ├─ quality_reviews       # 엔지니어 검토 노트
  └─ lot_dispositions      # 데모 LOT 검토 요청·독립 검토 결과
```

| Method | Endpoint | 인증 | 목적 |
| --- | --- | --- | --- |
| GET | `/api/health` | 공개 | DB 연결 포함 readiness |
| GET | `/api/health/live` | 공개 | 프로세스 liveness |
| GET | `/api/me` | 로그인 | 현재 사용자 확인 |
| GET | `/api/quality/reviews` | 공개 | Case별 검토 노트 조회 |
| POST | `/api/quality/reviews` | 로그인 | 검토 노트 저장 |
| GET | `/api/quality/dispositions` | 로그인 | Case별 검토 요청 조회 |
| POST | `/api/quality/dispositions` | 로그인 | 근거·증거·개정이 있는 HOLD / RELEASE / FA 검토 요청 |
| POST | `/api/quality/dispositions/{id}/review` | 로그인·작성자 외 | 요청 승인/반려 (데모 검토일 뿐 실제 조치 아님) |

주요 구현 파일:

- [YieldDashboard.tsx](frontend/components/YieldDashboard.tsx) — 운영 화면·readiness·handoff 상호작용
- [quality.ts](frontend/lib/quality.ts) — 합성 Case·Test flow·control plan 모델
- [quality.py](backend/app/routes/quality.py) — review/disposition API
- [identity.py](backend/app/core/identity.py) — coders.kr identity gate
- [0003_lot_dispositions.py](backend/alembic/versions/0003_lot_dispositions.py) — disposition migration

## 사용 기술 및 환경

| 구분 | 기술 |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, Lucide |
| Backend | FastAPI, SQLAlchemy async, Pydantic |
| Database | PostgreSQL, Alembic |
| Identity | coders.kr native gate, `X-Coders-User` |
| Runtime | nginx static service + API service + PostgreSQL |
| Deploy | `coders.yaml` multi-service manifest |

## 공개 기술 참고자료

- [SK hynix Newsroom — HBM 패키지 MR-MUF, UTV/WLP 및 look-ahead reliability](https://news.skhynix.com/en/rulebreaker-revolutions-mr-muf-unlocks-hbm-heat-control/)
- [SK hynix Newsroom — HBM·3DS·2.5D SiP 패키지 구조](https://news.skhynix.com/en/semiconductor-back-end-process-episode-4-packages-part-2/)
- [SK hynix Newsroom — 패키지 신뢰성 평가, burn-in 및 환경 stress 시험](https://news.skhynix.com/en/semiconductor-back-end-process-episode-11-reliability-tests-and-standards-for-semiconductor-packages/)
- [SK hynix Newsroom — HBM SiP 품질·신뢰성과 열·기계 검증 협업](https://news.skhynix.com/en/sk-hynix-spotlights-ai-memory-solutions-industry-collaboration-at-tsmc-oip-ecosystem-forum-2024/)

## 화면 설계

| 화면 | 확인할 수 있는 내용 |
| --- | --- |
| [Shift Command](https://yieldscope-pnt.coders.kr#overview) | Release·Loss·Exposure·Owner·SLA, 역할별 Decision Brief, Data Studio |
| [Test Operations](https://yieldscope-pnt.coders.kr#test-ops) | Program qualification, site yield map, Test Plan, FPY·DPPM·UPH·TAT, Bin, tester health |
| [Defect Explorer](https://yieldscope-pnt.coders.kr#defects) | Pareto, risk ratio, LOT Watchlist, CSV export |
| [RCA Workbench](https://yieldscope-pnt.coders.kr#rca) | 가설 신뢰도와 전기적·물리적 증거 체인 |
| [Action Validation](https://yieldscope-pnt.coders.kr#validation) | Before/after, CAPA, 엔지니어 검토 노트 |

## 로컬 실행

### 전체 스택

```bash
docker compose up --build
```

- Web: `http://localhost:3000`
- API docs: `http://localhost:3000/api/docs`
- PostgreSQL: `localhost:5432`

### Frontend만 실행

```bash
cd frontend
corepack pnpm install
corepack pnpm dev
```

### Backend만 실행

```bash
cd backend
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000
```

PostgreSQL 연결은 `DATABASE_URL`로 지정합니다.

```text
postgresql+asyncpg://app:app@localhost:5432/app
```

로컬에서는 `DEV_FAKE_USER`를 사용해 개발용 인증 사용자를 고정할 수 있습니다. 운영에서는 coders.kr native identity만 사용합니다.

### 환경 변수

| 이름 | 용도 | 필수 여부 | 값의 출처 |
| --- | --- | --- | --- |
| `DATABASE_URL` | FastAPI의 PostgreSQL 연결 | 로컬 DB 사용 시 필수 · 운영에서는 자동 주입 | 로컬 PostgreSQL/Compose 설정 또는 `coders.yaml`의 db 서비스 참조 |
| `DEV_FAKE_USER` | 플랫폼 인증 없이 로컬 API를 시험할 UUID | 선택 · 운영 설정 금지 | 로컬에서 생성한 테스트 UUID (`backend/.env.example` 참고) |
| `BACKEND_URL` | 정적 웹 nginx가 API 서비스로 프록시할 내부 주소 | 운영에서 자동 주입 | `coders.yaml`의 `${api.internal_url}` |

`.env`와 `.coders/token`은 Git에서 제외합니다. 실제 인증값은 README나 커밋에 넣지 않습니다. 이 데모는 외부 제조 API 키가 필요하지 않으며, MES·TMS·Tester·FA·Databook 연동은 구현되지 않았습니다.

## 테스트와 검증

```bash
# frontend
cd frontend
corepack pnpm lint
corepack pnpm build

# backend
cd ../backend
uv run ruff check app tests alembic
uv run ruff format --check app tests alembic
uv run python -m compileall -q app tests alembic
uv run pytest unit_tests -q # PostgreSQL 없이 판정 규칙 검증
uv run pytest --collect-only -q
```

PostgreSQL이 실행된 환경에서는 전체 API 테스트를 실행할 수 있습니다.

```bash
cd backend
uv run pytest
```

현재 운영 smoke test 기준:

- `/` → `200`
- `/api/health` → `200`, `{"status":"ok"}`
- 익명 `/api/quality/dispositions?scenario=stacker` → `401` (플랫폼 게이트에서는 로그인 안내 가능)
- 익명 disposition POST → coders.kr 로그인 화면
- `/api/openapi.json`에 disposition 및 독립 검토 route 포함

## CI / CD와 배포

```text
GitHub main
   ↓
coders.kr deployment
   ├─ web  → Next.js static export + nginx
   ├─ api  → FastAPI + Alembic
   └─ db   → PostgreSQL
```

`coders.yaml`은 web, api, db 세 서비스를 선언합니다. 배포 아카이브에는 `.coders/token` 같은 인증 파일을 포함하지 않습니다.

공개 운영 주소: [https://yieldscope-pnt.coders.kr](https://yieldscope-pnt.coders.kr)

### 저장소와 재배포 순서

1. 정본은 [`boclair98/yieldscope-pnt`](https://github.com/boclair98/yieldscope-pnt)의 `main`입니다. [`coders-kr/yieldscope-pnt`](https://github.com/coders-kr/yieldscope-pnt)는 정본에서 생성한 실제 GitHub 포크이며, 개발과 배포의 소스가 아닙니다.
2. 로컬에서 테스트·빌드하고 민감정보 및 변경 파일을 확인한 뒤 정본에 먼저 커밋·푸시합니다.
3. GitHub의 **Sync fork** 또는 권한이 있는 CLI의 `gh repo sync coders-kr/yieldscope-pnt -b main`으로 포크를 동기화합니다. 두 저장소 `main`의 전체 SHA가 같아야 합니다.
4. [coders.kr 배포 지침](https://coders.kr/llms.txt)의 최신 내용을 확인하고 기존 `yieldscope-pnt` 프로젝트를 정본 저장소 URL로 재배포합니다. 에이전트 API를 쓸 경우 `POST /v1/agent/deploys`에 `repo=https://github.com/boclair98/yieldscope-pnt`, `name=yieldscope-pnt`를 전달하고 `GET /v1/agent/projects/yieldscope-pnt`에서 terminal status를 확인합니다. 토큰은 승인된 로컬 저장소 또는 환경 변수에서만 읽습니다.
5. `ready` 후 운영 `/`, `/api/health`, 주요 화면과 360·390·768·1440px 레이아웃을 확인합니다. API 요청 성공만으로 배포 완료를 선언하지 않습니다.

패키지 Test Matrix의 실행 컨텍스트·검사항목은 브라우저에만 저장되므로 계정 간 공유, 승인 이력, 접근 권한이 필요한 운영 워크플로에 사용할 수 없습니다. 제조 식별자나 고객 자료를 공개 데모에 입력하지 마세요.

Program Qualification CSV 분석도 브라우저 메모리에서만 수행하며 사용자 기기나 서버에 study를 저장하지 않습니다. 사내 인증·권한 분리·감사로그·보존정책·원본 파일 통제와 ATE/MES/TMS/Databook 연동이 없으므로, 이 공개 사이트를 실제 양산 운영 시스템으로 사용하면 안 됩니다. 실제 P&T 데이터로 검증할 수 있는 내부망 파일럿을 만들려면 별도 보안·IT·품질 승인을 먼저 받아야 합니다.

## 공개 기술 참고

- [SK hynix — P&T 직무 인터뷰](https://talent.skhynix.com/hub/en/job/interview/76)
- [SK hynix — 양산기술(P&T) 직무 소개](https://talent.skhynix.com/hub/ko/job/introduce)
- [SK hynix — D-TEST Technology](https://news.skhynix.com/en/people-who-create-the-value-of-dram-products-with-high-technical-competitiveness-d-test-technology/)
- [SK hynix — Semiconductor Testing](https://news.skhynix.com/en/semiconductor-back-end-process-episode-1-understanding-semiconductor-testing/)
- [SK hynix — MR-MUF and HBM heat control](https://news.skhynix.com/en/rulebreaker-revolutions-mr-muf-unlocks-hbm-heat-control/)
- [NIST — Control charts](https://www.itl.nist.gov/div898/handbook/pmc/section3/pmc31.htm)
- [TI — Failure analysis FAQ](https://www.ti.com/quality-reliability/faqs/failure-analysis.html)

## 로드맵

- [ ] MES/TMS/Tester CSV schema adapter와 업로드 검증
- [ ] Product·Program·Socket master version 관리
- [ ] 역할 기반 Test QE / PE / FA / 승인자 권한
- [ ] 실제 현업 파일럿 전 사내 SSO·조직별 데이터 격리·승인 권한·MES 연동·규격 원본 대조·감사/보존 정책 검증
- [ ] SPC control chart와 alarm rule configuration
- [ ] Unit-level traceability 및 FA 결과 attachment
- [ ] k6 기반 API·조회 부하 테스트와 관측성 대시보드
- [ ] 사내 SSO·망분리·보존기간 정책에 맞는 운영 배포

## 라이선스 및 고지

Portfolio demonstration project입니다. 화면의 수치·장비명·LOT ID·임계값은 평가와 학습을 위한 합성 값입니다.

현재 저장소에는 별도 오픈소스 라이선스가 명시되어 있지 않습니다. 사용·재배포 권한은 저장소 소유자에게 문의하세요.

이 프로젝트는 SK hynix의 내부 시스템, 사양, 데이터, 공식 제품 또는 공식 제휴를 나타내지 않습니다. 실제 생산·출하 판단에 사용하려면 조직의 품질 승인, 데이터 계약, 보안 검토와 시스템 연동이 선행되어야 합니다.
