# Tame 개발 작업 체크리스트

## 📋 Phase 1: 기반 구축 (1-2주)

### 데이터베이스 구현

- [x] SQLite 의존성 설치 (`better-sqlite3`, `@types/better-sqlite3`)
- [x] `renderer/lib/database.ts` - SQLite 연결 및 스키마 생성
- [x] `renderer/lib/types.ts` - TypeScript 타입 정의
- [x] 데이터베이스 테이블 생성 (tabs, notifications, settings)
- [x] 기본 CRUD 함수 구현

### UI 환경 설정

- [x] Tailwind CSS 설치 및 설정
- [x] shadcn/ui 초기화 및 기본 컴포넌트 설치
- [x] Lucide React 아이콘 라이브러리 설치
- [x] 기본 테마 및 색상 시스템 설정
- [x] 공통 컴포넌트 (Button, Input, Dialog 등) 설정

### 상태 관리 설정

- [x] Zustand 의존성 설치
- [x] `renderer/store/tab-store.ts` - 탭 상태 관리
- [x] `renderer/store/notification-store.ts` - 알림 상태 관리
- [x] `renderer/store/settings-store.ts` - 앱 설정 관리

### 기본 레이아웃

- [x] `renderer/components/TabBar.tsx` - 탭 네비게이션 컴포넌트 (shadcn/ui Tabs 활용)
- [x] `renderer/components/Layout.tsx` - 메인 레이아웃 수정
- [x] 탭 기반 레이아웃 구조 구현
- [x] 반응형 디자인 적용 (Tailwind CSS)
- [x] 다크/라이트 모드 지원

---

## 🖥️ Phase 2: 핵심 기능 (2-3주)

### 웹뷰 시스템

- [ ] `renderer/components/WebViewTab.tsx` - 개별 웹뷰 탭
- [ ] `renderer/components/TabManager.tsx` - 탭 상태 관리
- [ ] `renderer/components/AddTabModal.tsx` - 새 탭 추가 모달
- [ ] 탭 추가/삭제 기능
- [ ] 탭 순서 변경 (드래그 앤 드롭)
- [ ] 웹뷰 세션 유지

### 알림 수집 시스템

- [ ] `electron-src/notification-handler.ts` - 알림 수집 로직
- [ ] `electron-src/webview-manager.ts` - 웹뷰 관리
- [ ] Notification API 가로채기
- [ ] 알림 데이터베이스 저장
- [ ] OS 알림 비활성화

### 알림 센터 UI

- [ ] `renderer/components/NotificationCenter.tsx` - 메인 알림 센터 (shadcn/ui Card, Badge 활용)
- [ ] `renderer/components/NotificationItem.tsx` - 개별 알림 아이템 (Lucide 아이콘 활용)
- [ ] `renderer/components/NotificationGroup.tsx` - 서비스별 그룹
- [ ] All/Grouped 뷰 모드 (shadcn/ui ToggleGroup 활용)
- [ ] 읽음/읽지 않음 상태 관리
- [ ] 알림 필터링 UI (shadcn/ui Select, Input 활용)
- [ ] 알림 토스트 알림 (shadcn/ui Toast 활용)

---

## 🔗 Phase 3: 고급 기능 (1-2주)

### 딥링킹 시스템

- [ ] `electron-src/deep-link-handler.ts` - 딥링킹 처리
- [ ] `renderer/lib/navigation-service.ts` - 네비게이션 관리
- [ ] 알림 클릭 시 탭 이동
- [ ] URL 스키마 메시지 전달
- [ ] 웹뷰 내 콘텐츠 포커스

### 보관함 기능

- [ ] `renderer/components/Archive.tsx` - 보관함 UI (shadcn/ui Table, Pagination 활용)
- [ ] `renderer/components/ArchiveItem.tsx` - 보관된 알림 아이템
- [ ] `renderer/components/ArchiveFilters.tsx` - 보관함 필터 (shadcn/ui DatePicker, Select 활용)
- [ ] 읽음 처리된 알림 조회
- [ ] 날짜별/서비스별 필터링
- [ ] 검색 기능 (shadcn/ui Input, Search 아이콘 활용)

### 고급 기능

- [ ] 드래그 앤 드롭 탭 순서 변경 (react-beautiful-dnd + Tailwind 애니메이션)
- [ ] 고급 알림 필터링 (shadcn/ui MultiSelect, Slider 활용)
- [ ] 알림 검색 기능 (Lucide Search 아이콘 + shadcn/ui Input)
- [ ] 알림 설정 (음소거, 우선순위 등) (shadcn/ui Switch, RadioGroup 활용)
- [ ] 설정 모달 (shadcn/ui Dialog, Form 활용)

---

## ⚡ Phase 4: 최적화 및 테스트 (1주)

### 성능 최적화

- [ ] 웹뷰 메모리 사용량 최적화
- [ ] 데이터베이스 쿼리 최적화
- [ ] 컴포넌트 렌더링 최적화
- [ ] 앱 시작 시간 개선

### 에러 처리

- [ ] 전역 에러 핸들러 구현
- [ ] 로깅 시스템 구축
- [ ] 사용자 친화적 에러 메시지
- [ ] 복구 메커니즘 구현

### 테스트 및 안정화

- [ ] 단위 테스트 작성
- [ ] 통합 테스트
- [ ] 사용자 테스트
- [ ] 버그 수정 및 안정화

---

## 🎯 성공 지표 체크

### 기능 완성도

- [ ] 모든 PRD 요구사항 구현 완료
- [ ] 탭 기반 웹뷰 시스템 완성
- [ ] 알림 수집 및 관리 시스템 완성
- [ ] 딥링킹 기능 구현 완료
- [ ] 보관함 기능 구현 완료

### 성능 지표

- [ ] 앱 시작 시간 < 3초 달성
- [ ] 메모리 사용량 < 500MB (5개 탭 기준)
- [ ] 알림 수집 지연 < 1초
- [ ] 웹뷰 전환 시간 < 0.5초

### 사용성 지표

- [ ] 직관적인 UI/UX 구현
- [ ] 안정적인 웹뷰 동작
- [ ] 빠른 알림 응답성
- [ ] 사용자 피드백 수집 및 반영

---

## 📝 개발 노트

### 현재 진행 상황

- **시작일:** 2025-01-XX
- **현재 단계:** Phase 1 - 기반 구축
- **다음 마일스톤:** 데이터베이스 스키마 구현

### 주요 결정사항

- [ ] 기술 스택 확정 (Electron + Next.js + SQLite + Zustand)
- [ ] 데이터베이스 스키마 설계
- [ ] 컴포넌트 구조 설계
- [ ] 상태 관리 전략 수립

### 이슈 및 해결방안

- [ ] 웹뷰 메모리 관리 전략
- [ ] 알림 수집 방법 (Notification API vs 페이지 변경 감지)
- [ ] 딥링킹 구현 방법
- [ ] 성능 최적화 방안

---

## 🔄 업데이트 로그

### 2025-01-XX

- [x] 개발 계획 수립
- [x] 데이터베이스 스키마 설계
- [x] 기술 스택 확정
- [ ] Phase 1 시작

### 다음 업데이트 예정

- 데이터베이스 구현 완료
- 기본 레이아웃 구현
- 웹뷰 컴포넌트 개발

---

_이 체크리스트는 개발 진행에 따라 지속적으로 업데이트됩니다._
