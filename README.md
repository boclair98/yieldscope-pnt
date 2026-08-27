<div align="center">

<img src="frontend/public/og.png" width="760" alt="YieldScope P&T 품질 인텔리전스" />

# YieldScope P&T

### 반도체 P&T Test의 불량을 양산 판정과 개선 검증으로 연결하는 품질 운영 워크벤치

`Test release → 수율·Bin 분석 → LOT disposition → FA/RCA → CAPA validation`

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
| 핵심 결과물 | Role lens 기반 Decision Brief, Release readiness, Test flow, Bin triage, LOT disposition, RCA, CAPA validation |
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
신호 감지 → 영향 LOT 격리 → Testability / Package 원인 분리
       → 교차 재현 → FA 증거 체인 → 조치 전후 검증 → 다음 교대 인계
```

## 프로젝트 전체 구조

```text
공개 Case / 제품군 선택
        ↓
EPM → Wafer Burn-in → Wafer Test / Repair → Package Test → Module Test
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

### 0. P&T Decision Brief

화면 상단에서 `P&T Test / Quality·QE / Manufacturing` 관점을 전환하면 같은 Case를 역할별 의사결정 순서로 재정렬합니다. `현재 신호 → 지금 결정 → 다음 담당자`를 한 줄로 읽고, 해당 업무 화면으로 바로 이동할 수 있어 교대 리뷰와 면접 데모에서 핵심 판단을 빠르게 설명할 수 있습니다.

### 1. Test Release Control

양산 투입 전 Test Plan을 고정하고 `Databook / Margin → Golden sample → Tester correlation → Release approval` 순으로 gate를 확인합니다.

`GO / CONDITIONAL / HOLD` readiness 판정은 gate 상태, stage HOLD, tester·socket health를 함께 계산해 다음 확인 항목을 제안합니다. 이 점수는 합성 데모의 의사결정 보조 기능이며 출하 승인을 대신하지 않습니다.

### 2. Mass Production Test Flow

`Wafer Sort → Package Test → Burn-in → Final Test → Reliability`를 선택하면서 단계별 FPY, DPPM, retest recovery, test time, UPH, utilization을 비교합니다.

### 3. Bin & Retest Triage

DC·AC·Function·Contact·Package 계열 Bin을 first fail, retest pass, share로 분리합니다. Retest recovery가 높으면 contact·program testability를 먼저 확인하고, 낮으면 package·die FA 대상으로 승격합니다.

### 4. Tester / Socket Health

Program revision, socket cycle, contact resistance, PM due, utilization을 같은 화면에서 교차 확인해 장비 집중도와 불량 신호의 상관을 탐색합니다.

### 5. LOT Disposition & Audit Log

LOT Watchlist에서 `HOLD / RELEASE / FA`를 선택하면 로그인 사용자 기준으로 action, reason, owner, author, created_at을 PostgreSQL에 저장합니다. 읽기는 공개하되 결정 기록과 검토 노트는 coders.kr identity gate 뒤에 둡니다.

### 6. RCA Workbench

`Stratify → Reproduce → Corroborate` 순서로 가설 신뢰도를 올립니다. 전기적 재현, 비파괴 분석, 물리 분석, 개선 검증이 같은 방향으로 맞을 때만 Confirmed로 해석합니다.

### 7. CAPA & Shift Handoff

Containment, Corrective, Preventive action의 전후 효과를 비교하고, 다음 교대가 Containment·Next check·Exit criteria를 항목별로 확인할 수 있도록 했습니다.

## 프로젝트 중점사항

- **역할별로 같은 데이터를 다르게 읽기**: Test는 testability·retest, QE는 gate·disposition·evidence, Manufacturing은 FPY·UPH·TAT·handoff를 먼저 보도록 Decision Brief를 제공합니다.
- **수율만으로 결론 내리지 않기**: FPY·DPPM과 함께 Test time, UPH, utilization, TAT를 확인합니다.
- **First fail과 실제 불량 분리하기**: retest recovery와 alternate tester/socket 재현을 함께 봅니다.
- **상관과 인과 구분하기**: Risk ratio는 우선순위를 정하는 지표일 뿐 원인 확정값으로 표시하지 않습니다.
- **판정을 기록 가능한 형태로 만들기**: LOT 결정은 사유·담당자·시각을 남겨 다음 교대와 유관 부서가 같은 기준을 공유합니다.
- **운영 경계를 분리하기**: 합성 Case·Trend 데이터와 로그인 필요한 review/disposition API를 분리했습니다.
- **실제 연결 지점을 명시하기**: MES/TMS/Tester export, Databook, FA 결과, 역할 기반 승인선을 향후 adapter 대상으로 정의했습니다.

## 기술적 이슈와 해결 방향

| 이슈 | 판단 기준 | 구현 방향 |
| --- | --- | --- |
| 양산 투입 여부를 수율 하나로 판단하기 어려움 | Gate·stage·장비 상태 동시 확인 | Release readiness 계산 및 다음 조치 제안 |
| First fail이 제품 불량인지 testability인지 모호함 | Retest recovery·alternate tester/socket 재현 | Bin triage와 evidence chain 연결 |
| 원인 분석이 개인의 메모로 끝남 | LOT·action·reason·owner·timestamp 추적 | PostgreSQL audit log와 로그인 경계 |
| 조치 후 효과가 일시적인지 확인하기 어려움 | Before/after LOT, 감소율, exit criteria | CAPA validation과 shift handoff |
| 공개 데모에서 사내 데이터를 오해할 수 있음 | 합성 데이터·실제 연결 필요사항 명시 | README·화면·API에서 운영 경계 고지 |

## 데이터 모델과 API

```text
users
  ├─ quality_reviews       # 엔지니어 검토 노트
  └─ lot_dispositions      # LOT HOLD / RELEASE / FA 감사 로그
```

| Method | Endpoint | 인증 | 목적 |
| --- | --- | --- | --- |
| GET | `/api/health` | 공개 | DB 연결 포함 readiness |
| GET | `/api/health/live` | 공개 | 프로세스 liveness |
| GET | `/api/me` | 로그인 | 현재 사용자 확인 |
| GET | `/api/quality/reviews` | 공개 | Case별 검토 노트 조회 |
| POST | `/api/quality/reviews` | 로그인 | 검토 노트 저장 |
| GET | `/api/quality/dispositions` | 공개 | Case별 LOT 결정 조회 |
| POST | `/api/quality/dispositions` | 로그인 | HOLD / RELEASE / FA 저장 |

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

## 화면 설계

| 화면 | 확인할 수 있는 내용 |
| --- | --- |
| [Overview](https://yieldscope-pnt.coders.kr#overview) | 역할별 Decision Brief, Case 신호, Final yield, Release readiness |
| [Test Operations](https://yieldscope-pnt.coders.kr#test-ops) | Test Plan, stage별 FPY·DPPM·UPH·TAT, Bin, tester health |
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
- `/api/quality/dispositions?scenario=stacker` → `200`
- 익명 disposition POST → coders.kr 로그인 화면
- `/api/openapi.json`에 disposition route 포함

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

## 공개 기술 참고

- [SK hynix — P&T 직무 인터뷰](https://talent.skhynix.com/hub/en/job/interview/8)
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
- [ ] SPC control chart와 alarm rule configuration
- [ ] Unit-level traceability 및 FA 결과 attachment
- [ ] k6 기반 API·조회 부하 테스트와 관측성 대시보드
- [ ] 사내 SSO·망분리·보존기간 정책에 맞는 운영 배포

## 라이선스 및 고지

Portfolio demonstration project입니다. 화면의 수치·장비명·LOT ID·임계값은 평가와 학습을 위한 합성 값입니다.

이 프로젝트는 SK hynix의 내부 시스템, 사양, 데이터, 공식 제품 또는 공식 제휴를 나타내지 않습니다. 실제 생산·출하 판단에 사용하려면 조직의 품질 승인, 데이터 계약, 보안 검토와 시스템 연동이 선행되어야 합니다.
