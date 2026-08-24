# YieldScope P&T

> 불량 신호에서 개선 검증까지 — Package & Test 품질 인텔리전스 포트폴리오

YieldScope P&T는 반도체 패키지·테스트 데이터를 하나의 분석 흐름으로
연결하는 인터랙티브 품질 워크벤치입니다. 단순 KPI 대시보드가 아니라
`Detect → Isolate → Confirm → Improve` 순서로 이상 감지, 기여 요인 분리,
FA 증거, CAPA 개선 효과를 설명하도록 설계했습니다.

## 주요 기능

- 세 가지 품질 케이스 전환
  - Stacker 정렬 드리프트와 Open / High-R
  - Socket 접촉 열화와 false reject
  - MUF material/process excursion과 delamination
- 일별 final-yield p-chart와 관리 한계 이탈 드릴다운
- Wafer Sort → Package Test → Burn-in → Final Test → Reliability 단계별 FPY·DPPM·Retest recovery·UPH·utilization 흐름
- Bin / Retest triage, tester·socket cycle/contact·program revision·PM 상태, 교대 인수인계 exit criteria
- 결함 발생 건수 Pareto, 누적 기여도, 공정·장비 risk ratio
- 검색 가능한 LOT watchlist, 최대 3개 LOT 비교, CSV 내보내기
- `Suspected → Corroborated → Confirmed` 상태를 갖는 RCA 근거 체인
- 개선 전·후 불량률과 containment / corrective / preventive action 검증
- coders.kr 로그인 사용자의 엔지니어 검토 노트 영구 저장
- 키보드 탐색, 명확한 포커스 상태, 반응형 모바일 레이아웃

## 데이터 고지

이 프로젝트의 LOT, 장비, 수치, 임계값, 제품명은 모두 포트폴리오용
합성 데이터입니다. 공개 기술 설명을 참고한 HBM-inspired 단순화 공정이며,
실제 기업의 사양·내부 데이터·공식 시스템이 아닙니다. 특정 기업과의 제휴나
공식성을 나타내지 않습니다.

## 기술 구성

```text
Next.js 16 static export
  → nginx public service
    ├─ responsive analytics UI
    └─ /api/* proxy
          → FastAPI
              → PostgreSQL (signed-in review notes)
```

- Frontend: Next.js, React, TypeScript, Tailwind CSS, Lucide icons
- Backend: FastAPI, SQLAlchemy async, Alembic, PostgreSQL
- Identity: coders.kr native gate의 `X-Coders-User` 계약
- Deploy: `coders.yaml` multi-service manifest

## 로컬 실행

Docker가 있다면 프로젝트 루트에서 다음 한 줄로 전체 스택을 실행합니다.

```bash
docker compose up
```

웹앱은 `http://localhost:3000`, API 문서는 `http://localhost:3000/api/docs`에서
확인할 수 있습니다. 로컬에서는 `DEV_FAKE_USER`가 고정 개발 사용자를 제공합니다.

프런트엔드만 실행하려면:

```bash
cd frontend
corepack pnpm install
corepack pnpm dev
```

## 검증

```bash
cd frontend
corepack pnpm lint
corepack pnpm build

cd ../backend
ruff check app tests alembic
ruff format --check app tests alembic
pytest
```

백엔드 통합 테스트는 PostgreSQL이 필요하며 기본 연결은
`postgresql+asyncpg://app:app@localhost:5432/app`입니다.

## 공개 기술 참고

- [SK hynix — Understanding Semiconductor Testing](https://news.skhynix.com/en/semiconductor-back-end-process-episode-1-understanding-semiconductor-testing/)
- [SK hynix — D-TEST Technology](https://news.skhynix.com/en/people-who-create-the-value-of-dram-products-with-high-technical-competitiveness-d-test-technology/)
- [SK hynix — MR-MUF and HBM heat control](https://news.skhynix.com/en/rulebreaker-revolutions-mr-muf-unlocks-hbm-heat-control/)
- [NIST — Control charts](https://www.itl.nist.gov/div898/handbook/pmc/section3/pmc31.htm)
- [TI — Failure analysis workflow](https://www.ti.com/quality-reliability/faqs/failure-analysis.html)

## License

Portfolio demonstration project. The generated sample data and app source are
provided for evaluation and learning purposes.
