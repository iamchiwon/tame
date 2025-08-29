# Tame 앱 개발 계획

## 📋 프로젝트 개요

**프로젝트명:** Tame  
**목표:** 로컬 우선 알림 워크스페이스 데스크탑 앱  
**기술 스택:** Electron + Next.js + SQLite + Zustand  
**개발 기간:** 6-8주 (예상)

---

## 🎯 핵심 기능 요구사항

### 1. 통합 웹뷰 인터페이스

- 탭 기반 서비스 관리 (추가/삭제/순서 변경)
- 앱 재시작 시 탭 구성 유지
- 각 탭 독립적 세션 유지

### 2. 지능형 알림 센터

- 웹뷰 알림 수집 및 로컬 저장
- All/Grouped 뷰 모드
- 읽음/읽지 않음 상태 관리
- 딥링킹 (알림 클릭 시 해당 탭으로 이동)
- 보관함 (읽음 처리된 알림 관리)

### 3. 로컬 우선 데이터 저장

- 모든 데이터 로컬 SQLite 저장
- 완벽한 개인정보 보호

---

## 🗄️ 1단계: 데이터베이스 설계 및 구현

### 데이터베이스 스키마

```sql
-- 탭 구성 저장
CREATE TABLE tabs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 알림 데이터
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tab_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tab_id) REFERENCES tabs(id)
);

-- 앱 설정
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 구현 파일

- `renderer/lib/database.ts` - SQLite 연결 및 스키마
- `renderer/lib/types.ts` - TypeScript 타입 정의
- `renderer/lib/tab-service.ts` - 탭 데이터 관리
- `renderer/lib/notification-service.ts` - 알림 데이터 관리

---

## 🖥️ 2단계: 탭 기반 웹뷰 인터페이스

### 핵심 컴포넌트

- `renderer/components/TabBar.tsx` - 탭 네비게이션
- `renderer/components/WebViewTab.tsx` - 개별 웹뷰 탭
- `renderer/components/TabManager.tsx` - 탭 상태 관리
- `renderer/components/AddTabModal.tsx` - 새 탭 추가 모달

### 기능 구현

- 탭 추가/삭제/순서 변경 (드래그 앤 드롭)
- 웹뷰 세션 유지
- 로컬 DB에 탭 구성 저장
- 탭별 독립적 쿠키/캐시 관리

---

## 🔔 3단계: 알림 수집 시스템

### 구현 방법

- Electron의 `webContents.on('page-title-updated')` 활용
- Notification API 가로채기
- 각 웹뷰에서 발생하는 알림을 앱 내부 DB에 저장
- OS 알림은 표시하지 않음

### 파일 구조

- `electron-src/notification-handler.ts` - 알림 수집 로직
- `electron-src/webview-manager.ts` - 웹뷰 관리
- `renderer/lib/notification-service.ts` - 알림 데이터 관리

---

## 📱 4단계: 알림 센터 UI

### 컴포넌트 구조

- `renderer/components/NotificationCenter.tsx` - 메인 알림 센터
- `renderer/components/NotificationItem.tsx` - 개별 알림 아이템
- `renderer/components/NotificationGroup.tsx` - 서비스별 그룹
- `renderer/components/NotificationFilters.tsx` - 필터링 옵션

### 기능

- All/Grouped 뷰 모드 전환
- 읽음/읽지 않음 상태 관리
- 실시간 알림 업데이트
- 알림 개별/그룹 읽음 처리

---

## 🔗 5단계: 딥링킹 시스템

### 구현 방법

- 알림 클릭 시 해당 탭으로 자동 이동
- URL 스키마를 통한 메시지 전달
- 웹뷰 내 특정 콘텐츠로 포커스
- 탭 활성화 및 스크롤 위치 조정

### 파일

- `electron-src/deep-link-handler.ts` - 딥링킹 처리
- `renderer/lib/navigation-service.ts` - 네비게이션 관리

---

## 📦 6단계: 보관함 기능

### 컴포넌트

- `renderer/components/Archive.tsx` - 보관함 UI
- `renderer/components/ArchiveItem.tsx` - 보관된 알림 아이템
- `renderer/components/ArchiveFilters.tsx` - 보관함 필터

### 기능

- 읽음 처리된 알림 조회
- 날짜별/서비스별 필터링
- 보관함에서 알림 복원

---

## 🛠️ 기술 스택 상세

### 추가 필요 의존성

```json
{
  "better-sqlite3": "^9.0.0",
  "zustand": "^4.4.0",
  "@types/better-sqlite3": "^7.6.0",
  "react-beautiful-dnd": "^13.1.1",
  "@types/react-beautiful-dnd": "^13.1.4",
  "tailwindcss": "^3.4.0",
  "@tailwindcss/forms": "^0.5.7",
  "lucide-react": "^0.294.0",
  "@radix-ui/react-dialog": "^1.0.5",
  "@radix-ui/react-dropdown-menu": "^2.0.6",
  "@radix-ui/react-tabs": "^1.0.4",
  "@radix-ui/react-toast": "^1.1.5",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.0.0",
  "tailwind-merge": "^2.2.0"
}
```

### 상태 관리 (Zustand)

- `renderer/store/tab-store.ts` - 탭 상태 관리
- `renderer/store/notification-store.ts` - 알림 상태 관리
- `renderer/store/settings-store.ts` - 앱 설정 관리

### UI 라이브러리

- **Tailwind CSS**: 스타일링 프레임워크
- **shadcn/ui**: 재사용 가능한 컴포넌트 라이브러리
- **Lucide React**: 아이콘 라이브러리
- **Radix UI**: 접근성 기반 프리미티브 컴포넌트

---

## 📅 개발 일정

### Phase 1: 기반 구축 (1-2주)

- [ ] 데이터베이스 스키마 구현
- [ ] 기본 상태 관리 설정
- [ ] 탭 레이아웃 구조
- [ ] 기본 웹뷰 컴포넌트

### Phase 2: 핵심 기능 (2-3주)

- [ ] 웹뷰 탭 시스템 완성
- [ ] 알림 수집 시스템 구현
- [ ] 기본 알림 센터 UI
- [ ] 탭 추가/삭제 기능

### Phase 3: 고급 기능 (1-2주)

- [ ] 딥링킹 시스템 구현
- [ ] 보관함 기능
- [ ] 고급 알림 필터링
- [ ] 드래그 앤 드롭 탭 순서 변경

### Phase 4: 최적화 및 테스트 (1주)

- [ ] 성능 최적화
- [ ] 에러 처리 및 로깅
- [ ] 사용자 테스트
- [ ] 버그 수정 및 안정화

---

## 🎯 성공 지표

### 기능 완성도

- [ ] 모든 PRD 요구사항 구현
- [ ] 탭 기반 웹뷰 시스템 완성
- [ ] 알림 수집 및 관리 시스템 완성
- [ ] 딥링킹 기능 구현

### 성능 지표

- [ ] 앱 시작 시간 < 3초
- [ ] 메모리 사용량 < 500MB (5개 탭 기준)
- [ ] 알림 수집 지연 < 1초

### 사용성 지표

- [ ] 직관적인 UI/UX
- [ ] 안정적인 웹뷰 동작
- [ ] 빠른 알림 응답성

---

## 📝 개발 노트

### 주의사항

- 모든 데이터는 로컬에만 저장
- OS 알림은 표시하지 않음
- 웹뷰 세션 독립성 유지
- 성능 최적화 지속적 고려

### 기술적 고려사항

- Electron 보안 정책 준수
- 웹뷰 메모리 관리
- SQLite 동시 접근 처리
- 상태 관리 최적화

---

## 🔄 업데이트 로그

- **2025-01-XX**: 개발 계획 초안 작성
- **2025-01-XX**: 데이터베이스 스키마 설계
- **2025-01-XX**: Phase 1 시작

---

_이 문서는 개발 과정에서 지속적으로 업데이트됩니다._
