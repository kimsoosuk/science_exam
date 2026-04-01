# 김수석 과학 해설 — 모듈 구조

## 파일 구조 (6개)

```
프론트엔드 (4개)
├── index.html       셸: 폰트·CDN·importmap + <div id="root">
├── book-ui.css      📖 재사용 가능한 책 UI 스타일 (반응형 비율 로직 포함)
├── book-ui.jsx      📖 재사용 가능한 BookLayout + CoverLayout 컴포넌트
├── app.css          이 앱 전용 스타일 (teacher-box 등)
├── app.jsx          이 앱 전체 (데이터 + 유틸 + 뷰 + 상태관리)

서버 (1개)
└── worker/index.js  Cloudflare Worker (프롬프트·스키마·Gemini 호출·JSON파싱)
```

## 다른 프로젝트에 책 UI를 복제하려면

**`book-ui.css` + `book-ui.jsx` 2개만 복사.**

```jsx
import { BookLayout, CoverLayout } from './book-ui.jsx';

// 펼친 책
<BookLayout leftPage={<MyLeft />} rightPage={<MyRight />} />

// 표지
<CoverLayout>내 콘텐츠</CoverLayout>
```

Tailwind 색상(`paper`, `cover`, `spine`, `gold`)만 자기 테마로 교체하면 끝.

## 반응형 비율 유지 원리

`book-ui.css` 안에 집중:

| 레이아웃 | 비율 | 공식 |
|---------|------|------|
| 펼친 책 | 1.3:1 | `max-width: calc((100vh - 50px) × 1.3)` |
| 표지    | 0.715:1 | `max-width: calc((100vh - 80px) × 0.715)` |

768px 미만에서는 aspect-ratio 해제 → 세로 스크롤.

## 모바일/데스크톱 분기 위치

**`book-ui.jsx` 파일에만 집중.** 분기 패턴 6가지:

1. 패딩: `p-3` → `md:p-5`, `px-6` → `md:px-10`
2. Spine(책등): `hidden` → `md:block`
3. Gutter(제본홈): `hidden` → `md:block`
4. Edge(단면): `hidden` → `md:block`
5. 페이지 배치: `flex-col` → `md:flex-row`
6. 페이지 너비: `w-full` → `md:w-1/2`

뷰 컴포넌트(`app.jsx`)에는 `p-4 md:p-5` 정도 사소한 차이만 있음.

## Worker 역할 (프론트에서 옮긴 것들)

| 기존 (프론트) | 현재 (Worker) |
|--------------|---------------|
| EXPLANATION_SCHEMA, CONCEPT_SCHEMA, SUMMARY_SCHEMA | `worker/index.js` |
| EXPLANATION_FEW_SHOT, CONCEPT_FEW_SHOT 프롬프트 | `worker/index.js` |
| callGeminiAPI (fetch + JSON 파싱 + 재시도) | `worker/index.js`의 `callGemini()` |

프론트는 `callWorker('explain', { correctAnswer, imageBase64 })` 같은 간단한 요청만 보냄.
하위 호환: action 없이 기존 raw payload를 보내면 그대로 Gemini에 전달.
