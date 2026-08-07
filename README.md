# RiceManager AI — 정미소 관리 프로그램

> 쌀 경영에 조금이나마 도움이 되는 프로그램입니다.

장부와 개인 엑셀 파일로 흩어져 있던 정미소의 거래 기록을 한곳에 모아,
**판매 · 재고 · 거래처 미수금을 함께 관리**하는 Windows 데스크톱 프로그램입니다.
설치형(Electron)으로 동작하며 별도의 서버 없이 로컬에서 모든 데이터를 관리합니다.

<br>

## 화면

### 대시보드
당일 매출, 미수금, 신규 주문, 재고 부족 품종을 한 화면에서 확인합니다.

<img width="595" height="392" alt="image" src="https://github.com/user-attachments/assets/b5fd89dc-89f4-4301-b710-9c9d309b76b5" />


### 판매기록
기간 · 상태 · 거래처로 조건을 좁히면 상단 요약(건수 · 합계 · 미결제)이 함께 따라 바뀝니다.

<img width="597" height="394" alt="image" src="https://github.com/user-attachments/assets/47599ae6-578d-4e33-844b-a460938aff44" />


> 화면의 거래처 · 금액은 기능 설명을 위한 예시 데이터입니다.

<br>

## 주요 기능

### 판매 관리
- 단일 품종 / **다품종 주문**(한 거래에 여러 품목) 등록
- 기간 · 결제 상태 · 거래처 조건별 조회, 4가지 정렬(최신순 / 오래된순 / 금액순)
- 조회 조건에 연동되는 **실시간 요약** — 오늘 건수, 조회 건수, 합계, 미결제 금액
- 미결제 건은 목록에서 색상으로 구분해 확인 누락 방지

### 재고 관리
- 판매 등록 시 **재고 자동 차감** 및 출고 이력 자동 생성
- 재고보다 많은 수량은 등록 자체를 차단
- 안전재고 미만으로 떨어지면 경고 표시

### 거래처 · 미수금
- 거래처 자동 등록 (신규 거래처명 입력 시 생성)
- 미결제 건 발생 시 **미수금 자동 누적**, 수납 시 차감
- 거래처별 주문 건수 · 매출 집계

### 엑셀 연동
- 판매 내역 · 거래처 · 재고를 **엑셀로 내보내기** (전체 통합 내보내기 포함)
- 기존 엑셀 파일을 **그대로 가져오기**
- 열 이름이 통일되지 않은 파일도 자동 매핑
  ```
  거래처 / 거래처명 / 고객명 / customer   →  거래처
  품종  / 품종명  / 제품명 / product      →  품종
  수량  / quantity                        →  수량
  단가  / 가격    / unit_price            →  단가
  ```

### 인쇄
- 화면에서 조회한 결과를 **그대로 인쇄**
- 인쇄물 상단에 조회 기간 · 출력 일시 · 총 건수 · 합계 · 미결제 금액을 함께 표기해
  문서만 보아도 어떤 조건으로 뽑은 자료인지 확인 가능
- 숨김 iframe으로 출력해 인쇄 중에도 작업 화면이 유지됨

### AI 보조 (선택)
- 자연어로 판매 기록 입력 — `"대박식당 고시히카리 5포 50000원 결제완료"`
- 매출 · 미수금 요약 질의
- Google Gemini API 키를 직접 등록해 사용 (미등록 시 나머지 기능은 정상 동작)

### 데이터 보호
- 앱 시작 시 **자동 백업**
- 모든 데이터는 로컬에만 저장 — 외부 전송 없음

<br>

## 기술 스택

| 구분 | 사용 기술 |
|------|-----------|
| 프레임워크 | React 19, TypeScript 5.8 |
| 빌드 | Vite 6 |
| 데스크톱 | Electron 39, electron-builder (NSIS 설치본) |
| 데이터 | IndexedDB (`RiceShopDB` v3) |
| 차트 | Recharts 3 |
| 엑셀 | SheetJS (xlsx) |
| AI | Google Gemini (`@google/genai`) |
| 아이콘 · 날짜 | lucide-react, date-fns |

### 데이터 구조

서버 없이 브라우저 내장 DB(IndexedDB)에 6개 저장소로 정규화했습니다.

| 저장소 | 역할 | 주요 인덱스 |
|--------|------|------------|
| `customers` | 거래처, 미수금 잔액 | `name` (unique) |
| `products` | 품종, 재고, 단가, 안전재고 | `name` (unique) |
| `sales` | 판매 기록 (다품종 포함) | `date`, `customer_id` |
| `inventory_transactions` | 입출고 이력 | `product_id`, `date`, `type` |
| `payment_history` | 수납 이력 | `sale_id`, `customer_id`, `date` |
| `user_profile` | 사업장 정보 | — |

판매 1건이 등록되면 `sales` 추가 → `products` 재고 차감 →
`inventory_transactions` 출고 이력 생성 → (미결제 시) `customers` 미수금 갱신이
하나의 흐름으로 이어집니다.

<br>

## 실행 방법

### 요구 사항
- Node.js 18 이상
- Windows 10 / 11

### 설치
```bash
npm install
```

### 개발 모드 (Electron 창으로 실행)
```bash
npm run electron:dev
```

### 브라우저에서만 확인
```bash
npm run dev
```
> 알림창 처리 등 일부 동작은 Electron 환경에서만 적용됩니다. 아래 *개발 노트* 참고.

### 설치 파일(.exe) 빌드
```bash
npm run electron:build:win
```
`dist` 폴더에 NSIS 설치본이 생성됩니다.

<br>

## 프로젝트 구조

```
├── App.tsx                  # 최상위 화면 구성, 탭 전환, 데이터 로딩
├── electron.js              # Electron 메인 프로세스, 네이티브 대화상자 IPC
├── index.tsx                # 진입점, alert/confirm 전역 대체
├── types.ts                 # 공통 타입, OrderStatus
├── components/
│   ├── DataTable.tsx        # 판매 목록 — 검색·필터·정렬·요약·인쇄·엑셀
│   ├── InventoryPage.tsx    # 재고 관리
│   ├── CustomersPage.tsx    # 거래처 · 미수금
│   ├── ReportsPage.tsx      # AI 분석 보고서
│   ├── AIPanel.tsx          # 우측 AI 어시스턴트
│   └── ...                  # 등록 · 수정 모달
├── services/
│   ├── database.ts          # IndexedDB 전체 접근 계층
│   ├── excelService.ts      # 엑셀 가져오기 · 내보내기
│   └── geminiService.ts     # AI 연동
└── utils/
    ├── printService.ts      # 인쇄 문서 생성
    └── focusHelper.ts       # 모달 종료 후 포커스 복원
```





