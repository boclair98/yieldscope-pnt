<div align="center">

<img src="frontend/public/og.png" width="760" alt="YieldScope P&T 품질 인텔리전스" />

# YieldScope P&T

### 불량 신호를 양산 Test 판정으로 연결합니다.

반도체 후공정의 `Test release → 수율·Bin 분석 → LOT disposition → FA/RCA → CAPA 검증`을 한 흐름으로 묶은 P&T Test 운영형 포트폴리오입니다.

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
  <img src="https://img.shields.io/badge/Data-Synthetic%20Demo-F2B84B?style=flat-square" alt="Synthetic data" />
</p>

**[YieldScope P&T 바로 사용하기 →](https://yieldscope-pnt.coders.kr)**

<p>
  <a href="#왜-만들었나요">문제 정의</a> ·
  <a href="#전체-업무-흐름">업무 흐름</a> ·
  <a href="#전체-기능-지도">기능 지도</a> ·
  <a href="#서비스-구조">서비스 구조</a> ·
  <a href="#로컬에서-실행하기">로컬 실행</a>
</p>

</div>

> [!IMPORTANT]
> 이 저장소는 공개 기술 자료를 참고한 **100% 합성 데이터 기반 포트폴리오**입니다. 실제 SK hynix의 내부 시스템·Databook·MES·TMS·FA 데이터가 아니며, 특정 기업의 공식 시스템이나 제휴 서비스를 의미하지 않습니다. 다만 실제 현장에 연결할 수 있도록 입력·판정·승인·감사 로그의 경계를 분리해 설계했습니다.

---

## 왜 만들었나요?

P&T Test 엔지니어의 판단은 단순히 “수율이 낮다”를 확인하는 데서 끝나지 않습니다.

1. 어떤 Test stage·제품·LOT에서 신호가 시작됐는가?
2. First fail이 실제 제품 불량인가, contact·socket·program에 의한 testability 문제인가?
3. 재검 결과와 alternate tester 결과가 원인 가설을 지지하는가?
4. 출하를 Hold할 것인가, 재검할 것인가, FA로 넘길 것인가?
5. 조치 이후 수율·품질·생산성·TAT가 함께 안정됐는가?

YieldScope P&T는 이 질문을 하나의 운영 흐름으로 남기기 위해 만들었습니다. 공개된 SK hynix P&T 자료가 설명하는 `수율·품질·생산성`, Test time/TAT, 불량 분석과 유관 부서 피드백을 제품의 기준으로 삼았습니다.

---

## 현재 운영 버전 핵심 업데이트

| 업데이트 | 적용 내용 |
| --- | --- |
| Test release control | Databook / Margin Test, Golden sample, Tester correlation, Release approval gate를 한 화면에서 확인 |
| Release readiness score | Gate·stage hold·tester/socket health를 묶어 `GO / CONDITIONAL / HOLD`와 다음 조치를 자동 제안 |
| 실제형 Test flow | `EPM → Wafer Burn-in → Wafer Test / Repair → Package Test → Module Test` 단계와 Package·Final·Reliability 지표 연결 |
| 생산성 지표 | FPY, DPPM, Retest recovery, Test time, UPH, Tester utilization, TAT target을 함께 비교 |
| Bin / Retest triage | DC·AC·Function·Contact·Package 계열 Bin을 First fail과 Retest pass로 분리 |
| Tester·Socket health | Program revision, Socket cycle, Contact resistance, PM due, utilization을 동시에 확인 |
| LOT disposition | Watchlist에서 `HOLD / RELEASE / FA` 결정을 기록하고 사유·담당자·시각을 감사 로그로 저장 |
| Shift handoff | Containment, Next check, Exit criteria를 다음 교대가 바로 실행하고 항목별 확인 상태를 남길 수 있도록 제공 |
| RCA Workbench | Stratify → Reproduce → Corroborate 순서로 testability와 package/die 원인을 분리 |
| CAPA validation | 개선 전·후 불량률, LOT 수, 감소율과 Containment / Corrective / Preventive action 추적 |
| 인증 경계 | 읽기는 공개, 결정 기록과 엔지니어 노트는 coders.kr 로그인 사용자만 기록 |
| 배포 구조 | Next.js static export + nginx + FastAPI + PostgreSQL을 coders.kr multi-service로 배포 |

> [!NOTE]
> LOT 결정은 화면에서 바로 저장되지만, 실제 도입 시에는 사내 권한·전자서명·변경 승인·MES/TMS/FA 인터페이스를 조직 기준에 맞춰 추가해야 합니다.
> Release readiness 점수와 교대 확인 상태는 현재 합성 데모의 의사결정 보조 기능이며, 실제 출하 승인을 대체하지 않습니다.

### 서비스 바로가기

| 화면 | 링크 | 할 수 있는 일 |
| --- | --- | --- |
| P&T 품질 인텔리전스 | [열기](https://yieldscope-pnt.coders.kr) | Case 전환, Test flow, Bin, LOT, RCA, CAPA 확인 |
| Test release control | [메인 화면의 Test Operations](https://yieldscope-pnt.coders.kr#test-ops) | Program·Databook·Golden sample·Correlation gate 확인 |
| LOT disposition | [메인 화면의 LOT Watchlist](https://yieldscope-pnt.coders.kr#defects) | Hold / Release / FA 기록과 CSV export |
| RCA Workbench | [메인 화면의 RCA](https://yieldscope-pnt.coders.kr#rca) | 가설·재현·물리 분석 증거 체인 확인 |
| Action Validation | [메인 화면의 Validation](https://yieldscope-pnt.coders.kr#validation) | CAPA 전후 효과와 엔지니어 검토 노트 확인 |

---

## 전체 업무 흐름

```text
공개 Case / 제품군 선택
        ↓
EPM → Wafer Burn-in → Wafer Test / Repair → Package Test → Module Test
        ↓
DC / AC / Function / Margin Test 결과와 FPY·DPPM·TAT 확인
        ↓
Bin·Tester·Socket·Program·Shift 층화 분석
        ↓
First fail ↔ Retest recovery ↔ Alternate tester / socket 교차 재현
        ↓
LOT HOLD / RELEASE / FA 결정 + 사유·담당자·시각 감사 기록
        ↓
X-ray·SAM·Cross-section 등 FA 증거 체인
        ↓
Containment → Corrective → Preventive → 개선 후 LOT 검증
```

### 역할별로 얻는 정보

| 역할 | 바로 필요한 판단 | YieldScope P&T에서 보는 영역 |
| --- | --- | --- |
| P&T Test Engineer | Test program·socket·Bin 원인과 양산 release 여부 | Test release control, Bin triage, Tester health |
| 양산기술 / 제조 | 영향 LOT, 생산성 손실, 다음 교대 조치 | LOT watchlist, UPH, utilization, shift handoff |
| Package / Process Engineer | Test fail이 package/process 원인으로 연결되는지 | Tool risk, RCA evidence, FA chain |
| FA / Quality Engineer | 어떤 표본을 어떤 방법으로 분석할지 | HOLD·FA decision, evidence chain, CAPA |
| Test QE / 승인자 | 조치 전후 기준이 닫혔는지 | Exit criteria, before/after, audit log |

---

## 전체 기능 지도

| 영역 | 기능 | 운영 목적 |
| --- | --- | --- |
| Release | Test Plan metadata | Product, stage, program revision, spec profile, TAT target을 기준선으로 고정 |
| Release | Databook / Margin gate | 제품 사양과 margin test 확인 없이는 release 판단을 서두르지 않도록 지원 |
| Release | Golden sample gate | 교대·LOT별 golden sample 확인 기준을 명시 |
| Release | Tester correlation gate | 다른 tester/socket에서 fail이 재현되는지 확인 |
| Flow | EPM → Module Test | Wafer·Package·Module을 잇는 실제형 후공정 흐름 |
| Flow | Stage drill-down | Wafer Sort, Package Test, Burn-in, Final Test, Reliability 단계별 지표 |
| Yield | FPY / DPPM | 최초 합격과 백만 개당 불량을 같은 기준으로 비교 |
| Yield | Retest recovery | First fail이 testability 문제인지 제품 불량인지 분리 |
| Productivity | UPH / utilization | 수율 개선이 생산성 손실로 이어지는지 확인 |
| Productivity | Test time / TAT | 품질을 유지하면서 검사 시간과 turnaround를 줄이는 방향 검토 |
| Triage | Bin Pareto | DC·AC·Function·Contact·Package 계열의 손실 우선순위 확인 |
| Triage | Tester / socket health | cycle, contact resistance, PM due, program revision을 교차 확인 |
| Disposition | HOLD | 원인 재현·교차 확인 전 영향 LOT 출하 보류 |
| Disposition | RELEASE | 기준 충족 후 출하 가능 판단을 기록 |
| Disposition | FA | package·die·material 원인 분석 표본을 의뢰 |
| Audit | 결정 로그 | action, reason, owner, author, created_at을 PostgreSQL에 저장 |
| Analysis | Trend / Pareto | 관리 한계 이탈과 손실 80% 구간을 빠르게 탐색 |
| Analysis | Risk ratio | 공정·장비 집중도를 비교하되 인과 확정과 구분 |
| RCA | Hypothesis ranking | Suspected → Corroborated → Confirmed 신뢰도 단계 |
| RCA | Evidence chain | 전기적 재현 → 비파괴 분석 → 물리 분석 → 개선 검증 |
| CAPA | Before / after | 조치 전후 불량률과 감소율을 LOT 단위로 검증 |
| CAPA | Engineer review | 로그인 사용자가 판단과 다음 확인 항목을 남김 |
| Export | LOT CSV | 후속 분석·보고서 작성을 위한 현재 Watchlist 다운로드 |

---

## 화면 미리보기

README에서 실제 운영 화면을 바로 열 수 있습니다.

<table>
  <tr>
    <td align="center" width="50%">
      <a href="https://yieldscope-pnt.coders.kr#test-ops">
        <img src="frontend/public/og.png" width="360" alt="YieldScope P&T Test Operations" />
      </a>
      <br />
      <b>Test Operations</b>
      <br />
      <sub>Release gate, stage별 FPY·DPPM·UPH·TAT, tester health</sub>
    </td>
    <td align="center" width="50%">
      <a href="https://yieldscope-pnt.coders.kr#defects">
        <img src="frontend/public/og.png" width="360" alt="YieldScope P&T LOT disposition" />
      </a>
      <br />
      <b>LOT Disposition</b>
      <br />
      <sub>HOLD / RELEASE / FA 결정과 감사 로그</sub>
    </td>
  </tr>
</table>

---

## 데이터와 운영 경계

### 현재 저장되는 데이터

| 데이터 | 저장 위치 | 인증 |
| --- | --- | --- |
| Case·Trend·Pareto·Test flow | 프런트 정적 합성 데이터 | 공개 읽기 |
| LOT disposition | PostgreSQL `lot_dispositions` | coders.kr 로그인 필요 |
| 엔지니어 검토 노트 | PostgreSQL `quality_reviews` | coders.kr 로그인 필요 |
| 사용자 식별자 | PostgreSQL `users` | coders.kr `X-Coders-User` |

### 실제 시스템 연결 시 필요한 것

1. MES/TMS/Tester export의 공식 데이터 계약과 field dictionary
2. Product·Program·Socket·Tester·LOT master의 키 규칙
3. Databook spec, margin test limit, retest policy의 버전 관리
4. Hold/Release/FA/전자서명의 역할 기반 권한과 승인선
5. FA 결과(X-ray, SAM, Cross-section)와 LOT·Unit traceability
6. 사내 보안망·망분리·보존기간·감사 추적 요구사항

현재 프로젝트는 이 연결 지점을 정적 화면과 API 경계로 분리해 두었으며, 사내 데이터를 임의로 추정하거나 실제 수치처럼 표시하지 않습니다.

---

## 서비스 구조

```text
Next.js 16 static export
  → nginx public service
    ├─ Test Operations / RCA / CAPA UI
    ├─ LOT CSV export
    └─ /api/* proxy
          → FastAPI
              ├─ coders.kr identity gate
              ├─ quality review API
              └─ lot disposition API
                    → PostgreSQL
                        ├─ users
                        ├─ quality_reviews
                        └─ lot_dispositions
```

### 기술 스택

| 계층 | 선택 |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, Lucide |
| Backend | FastAPI, SQLAlchemy async, Pydantic |
| Database | PostgreSQL, Alembic migrations |
| Identity | coders.kr native gate의 `X-Coders-User` |
| Deploy | `coders.yaml` multi-service manifest |
| Runtime | nginx static service + API service + PostgreSQL |

### API surface

| Method | Endpoint | 인증 | 목적 |
| --- | --- | --- | --- |
| GET | `/api/health` | 공개 | DB 연결 포함 readiness 확인 |
| GET | `/api/health/live` | 공개 | 프로세스 liveness 확인 |
| GET | `/api/me` | 로그인 | 현재 local user 확인 |
| GET | `/api/quality/reviews` | 공개 | Case별 엔지니어 노트 조회 |
| POST | `/api/quality/reviews` | 로그인 | 검토 노트 저장 |
| GET | `/api/quality/dispositions` | 공개 | Case별 LOT 결정 로그 조회 |
| POST | `/api/quality/dispositions` | 로그인 | HOLD / RELEASE / FA 결정 저장 |

---

## 로컬에서 실행하기

### 전체 스택

Docker가 있다면 프로젝트 루트에서 실행합니다.

```bash
docker compose up --build
```

- Web: `http://localhost:3000`
- API docs: `http://localhost:3000/api/docs`
- PostgreSQL: `localhost:5432`

로컬에서는 `DEV_FAKE_USER`를 사용해 개발용 인증 사용자를 고정할 수 있습니다. 운영에서는 coders.kr native identity만 사용합니다.

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

---

## 검증

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

현재 배포 smoke test 기준:

- `/` → `200`
- `/api/health` → `200`, `{"status":"ok"}`
- `/api/quality/dispositions?scenario=stacker` → `200`
- 익명 disposition POST → coders.kr 로그인 화면
- `/api/openapi.json`에 disposition route 포함

---

## 배포

`coders.yaml`은 다음 세 서비스를 선언합니다.

```text
web  → Next.js export를 nginx로 제공
api  → FastAPI + Alembic
db   → PostgreSQL
```

배포 아카이브에는 `.coders/token` 같은 인증 파일을 포함하지 않습니다. 최신 소스를 Git commit 기준으로 묶고, coders.kr 업로드 세션을 통해 배포합니다.

공개 운영 주소:

> https://yieldscope-pnt.coders.kr

---

## 공개 기술 참고

- [SK hynix — P&T 직무 소개](https://talent.skhynix.com/hub/en/job/interview/8)
- [SK hynix — 직무소개: 양산기술(P&T)](https://talent.skhynix.com/hub/ko/job/introduce)
- [SK hynix — D-TEST Technology](https://news.skhynix.com/en/people-who-create-the-value-of-dram-products-with-high-technical-competitiveness-d-test-technology/)
- [SK hynix — Understanding Semiconductor Testing](https://news.skhynix.com/en/semiconductor-back-end-process-episode-1-understanding-semiconductor-testing/)
- [SK hynix — MR-MUF and HBM heat control](https://news.skhynix.com/en/rulebreaker-revolutions-mr-muf-unlocks-hbm-heat-control/)
- [NIST — Control charts](https://www.itl.nist.gov/div898/handbook/pmc/section3/pmc31.htm)
- [TI — Failure analysis workflow](https://www.ti.com/quality-reliability/faqs/failure-analysis.html)

---

## 로드맵

- [ ] MES/TMS/Tester CSV schema adapter와 업로드 검증
- [ ] Product·Program·Socket master version 관리
- [ ] 역할 기반 Test QE / PE / FA / 승인자 권한
- [ ] SPC control chart와 alarm rule configuration
- [ ] Unit-level traceability 및 FA 결과 attachment
- [ ] 사내 SSO·망분리·보존기간 정책에 맞는 운영 배포
- [ ] 실제 데이터 도입 전 보안·개인정보·품질 시스템 검토

---

## 라이선스 및 고지

Portfolio demonstration project입니다. 샘플 데이터와 화면의 수치·장비명·LOT ID·임계값은 평가와 학습을 위한 합성 값입니다.

이 프로젝트는 SK hynix의 내부 시스템, 사양, 데이터, 공식 제품 또는 공식 제휴를 나타내지 않습니다. 실제 생산 판단·출하 판단에 사용하려면 조직의 품질 승인, 데이터 계약, 보안 검토와 시스템 연동이 선행되어야 합니다.
