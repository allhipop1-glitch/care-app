# 사고케어 (SagoCare) — 앱 디자인 기획 (IR 기반 최종)

## 브랜드 아이덴티티
- **앱 이름:** 사고케어 (SagoCare)
- **슬로건:** 사고 났을 때, 당황하지 마세요
- **색상 팔레트:**
  - Primary (딥 블루): #1A56DB — 신뢰, 전문성
  - Accent (오렌지): #F97316 — 긴급·행동 유도
  - Background: #F8FAFC
  - Surface: #FFFFFF
  - Foreground: #0F172A
  - Muted: #64748B
  - Success: #22C55E
  - Error: #EF4444
  - Warning: #F59E0B

---

## 화면 목록 (Screen List)

### 온보딩
1. **OnboardingScreen** — 3장 슬라이드 (핵심 기능 소개) + 차량/보험 등록

### 메인 탭 (하단 탭바 5개)
2. **HomeScreen** — 대시보드 (SOS 긴급 버튼, 내 차 시세, 꿀팁 피드, 위험 구간 알림)
3. **CareScreen** — 사고 처리 허브 (진행 중 사고 타임라인, 이력)
4. **FeedScreen** — 블랙박스 AI 과실 분석 피드 + 데일리 꿀팁
5. **MapScreen** — 내 주변 파트너 지도 (공업사/병원/렌트카/변호사)
6. **MyScreen** — 마이페이지 (포인트, 보험료 절약, 차량 관리)

### 사고 처리 플로우 (모달/스택)
7. **AccidentReportScreen** — FNOL 원클릭 사고 신고
8. **EvidenceGuideScreen** — 증거 확보 4단계 가이드
9. **CameraGuideScreen** — AI 촬영 가이드 (실선 오버레이)
10. **AccidentProgressScreen** — 사고 진행 상황 추적

### 전문가 매칭
11. **MatchListScreen** — 카테고리별 업체 목록 (렉카/공업사/병원/변호사/손해사정사/렌트카)
12. **MatchDetailScreen** — 업체 상세 + 연결

### DAU 기능
13. **CarValueScreen** — 내 차 예상 시세 대시보드
14. **InsuranceSaveScreen** — 보험료 절약 알리미
15. **RewardScreen** — 안전운전 포인트 적립 현황

---

## 핵심 사용자 플로우

### 사고 발생 시 (핵심 플로우)
홈 SOS 버튼 → FNOL 자동 접수 (23초) → 증거 확보 4단계 가이드 → 전문가 매칭 → 진행 추적

### 평상시 DAU 플로우
홈 진입 → 내 차 시세 확인 → 꿀팁 피드 읽기 → 블랙박스 피드 구경 → 포인트 확인

### 전문가 찾기
매칭 탭 → 카테고리 선택 → 목록 필터/정렬 → 업체 상세 → 연결

---

## 탭 바 구성
1. 홈 (house.fill)
2. 사고처리 (car.fill)
3. 피드 (play.rectangle.fill)
4. 내 주변 (map.fill)
5. 마이 (person.fill)

---

## 레이아웃 원칙
- SOS 긴급 버튼은 홈 최상단 항상 노출 (긴급 접근성 최우선)
- 사고 플로우는 전체 화면 모달로 집중도 유지
- 카드 기반 UI로 정보 스캔 용이성 확보
- 오렌지 CTA 버튼으로 행동 유도
- 다크 네이비 헤더로 신뢰감 형성
