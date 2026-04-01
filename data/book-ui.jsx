// ═══════════════════════════════════════════════════════════════
// book-ui.jsx
// 📖 재사용 가능한 레이아웃 컴포넌트 (BookLayout + CoverLayout)
//
// 다른 프로젝트에 book-ui.css와 함께 복사해서 사용 가능.
// 모바일 ↔ 데스크톱 UI 분기가 이 파일에 집중되어 있음.
//
// [모바일/데스크톱 분기 정리]
// 1. 패딩: p-3 → md:p-5, px-6 → md:px-10 (여유 공간)
// 2. Spine(책등): hidden → md:block (모바일에서 숨김)
// 3. Gutter(제본홈): hidden → md:block (모바일에서 숨김)
// 4. Edge(단면): hidden → md:block (모바일에서 숨김)
// 5. 페이지 배치: flex-col → md:flex-row (세로→가로)
// 6. 페이지 너비: w-full → md:w-1/2
//
// 수정할 때 이 6가지 분기만 확인하면 양쪽 해상도 모두 커버됨.
// ═══════════════════════════════════════════════════════════════

import React from 'react';
import { Home } from 'lucide-react';

// ─── 펼친 책 레이아웃 ───────────────────────────────────────
export const BookLayout = ({
  leftPage, rightPage, onGoHome,
  pageNumLeft, pageNumRight,
  headerLeft = '2025 고1 3월 학력평가 · 과학',
  headerRight = '예비고1 바이블 · 통합과학편',
  footerText = '© 수석의방 · 2025 고1 3월 학력평가 과학',
}) => (
  <div className="h-full flex flex-col items-center justify-center p-3 md:p-5">
    {/* Book Shell — 비율은 book-ui.css의 .book-aspect가 제어 */}
    <div className="w-full book-shell book-aspect relative flex rounded-r-[10px] rounded-l-[4px] flex-1"
         style={{ padding: '6px 6px 6px 0', background: '#1e3a28', maxHeight: 'calc(100vh - 50px)', minHeight: 0 }}>

      {/* Spine — 모바일에서 hidden */}
      <div className="hidden md:block book-spine-bg rounded-l-[4px] relative" style={{ width: '22px', minWidth: '22px' }}>
        <div className="spine-gold-line absolute top-[8%] bottom-[8%] left-1/2 w-px opacity-40"></div>
      </div>

      {/* Pages — 모바일: 세로 스택 / 데스크톱: 좌우 배치 */}
      <div className="flex-1 flex md:flex-row flex-col bg-paper rounded-r-[6px] md:rounded-l-none relative"
           style={{ boxShadow: 'inset 2px 0 8px rgba(0,0,0,.06)', overflow: 'hidden' }}>

        {/* Gutter — 모바일에서 hidden */}
        <div className="hidden md:block absolute pointer-events-none"
             style={{ top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '50px', zIndex: 10,
                      background: 'linear-gradient(90deg, transparent, rgba(30,24,15,.04) 15%, rgba(30,24,15,.09) 35%, rgba(30,24,15,.16) 50%, rgba(30,24,15,.09) 65%, rgba(30,24,15,.04) 85%, transparent)' }}>
          <div className="absolute" style={{ top: 0, bottom: 0, left: '50%', width: '1px', background: 'rgba(30,24,15,.1)' }}></div>
        </div>

        {/* Edge — 모바일에서 hidden */}
        <div className="hidden md:block book-edge-right absolute top-1 bottom-1 -right-[3px] w-[3px] rounded-r-sm" style={{ zIndex: -1 }}></div>

        {/* Left Page — 모바일: w-full / 데스크톱: w-1/2 */}
        <div className="w-full md:w-1/2 flex flex-col page-left-bg relative" style={{ zIndex: 5, minHeight: 0, height: '100%' }}>
          <div className="px-6 md:px-10 pt-4 pb-0 shrink-0">
            <div className="flex items-center justify-between mb-1">
              {onGoHome ? (
                <button onClick={onGoHome} className="font-sans-kr text-ink-faint hover:text-accent transition-colors flex items-center gap-1 text-xs font-medium">
                  <Home size={12} /> 홈
                </button>
              ) : <div></div>}
              <div className="font-sans-kr text-ink-faint text-[0.58rem] tracking-[0.12em] text-right">{headerLeft}</div>
            </div>
            <div className="header-line w-full h-px opacity-20 mb-3"></div>
          </div>
          <div className="flex-1 overflow-y-auto book-scroll px-6 md:px-10" style={{ minHeight: 0 }}>{leftPage}</div>
          <div className="page-num-bg shrink-0 text-left px-6 md:px-10 py-1.5" style={{ zIndex: 3 }}>
            <span className="font-serif-kr text-ink-faint text-[0.7rem]">{pageNumLeft}</span>
          </div>
        </div>

        {/* Right Page — 모바일: w-full / 데스크톱: w-1/2 */}
        <div className="w-full md:w-1/2 flex flex-col page-right-bg relative" style={{ zIndex: 5, minHeight: 0, height: '100%' }}>
          <div className="px-6 md:px-10 pt-4 pb-0 shrink-0">
            <div className="flex items-center justify-end mb-1">
              <div className="font-sans-kr text-ink-faint text-[0.58rem] tracking-[0.12em]">{headerRight}</div>
            </div>
            <div className="header-line w-full h-px opacity-20 mb-3"></div>
          </div>
          <div className="flex-1 overflow-y-auto book-scroll px-6 md:px-10" style={{ minHeight: 0 }}>{rightPage}</div>
          <div className="page-num-bg shrink-0 text-right px-6 md:px-10 py-1.5" style={{ zIndex: 3 }}>
            <span className="font-serif-kr text-ink-faint text-[0.7rem]">{pageNumRight}</span>
          </div>
        </div>
      </div>
    </div>
    <div className="mt-1.5 font-sans-kr text-[0.58rem] text-white/25 text-center tracking-wider shrink-0">{footerText}</div>
  </div>
);


// ─── 표지(닫힌 책) 레이아웃 ─────────────────────────────────
export const CoverLayout = ({
  children,
  footerText = '© 수석의방 · 2025 고1 3월 학력평가 과학',
}) => (
  <div className="h-full w-full flex flex-col items-center justify-center p-3 md:p-5">
    <div className="w-full book-shell relative flex rounded-r-[10px] rounded-l-[4px]"
         style={{ maxWidth: 'calc((100vh - 80px) * 0.715)', aspectRatio: '0.715 / 1', padding: '6px 6px 6px 0', background: '#1e3a28', margin: '0 auto' }}>

      {/* Spine — 모바일에서 hidden */}
      <div className="hidden md:block book-spine-bg rounded-l-[4px] relative" style={{ width: '22px', minWidth: '22px' }}>
        <div className="absolute top-[8%] bottom-[8%] left-1/2 w-px opacity-40" style={{ background: 'linear-gradient(180deg, transparent, #c4a44a, transparent)' }}></div>
      </div>

      <div className="flex-1 flex flex-col rounded-r-[6px] relative overflow-hidden"
           style={{ background: 'linear-gradient(160deg, #2e3d2a 0%, #23301e 30%, #1e2818 60%, #1a2214 100%)' }}>

        {/* Edge — 모바일에서 hidden */}
        <div className="hidden md:block book-edge-right absolute top-1 bottom-1 -right-[3px] w-[3px] rounded-r-sm"></div>

        <div className="flex-1 overflow-y-auto book-scroll px-8 md:px-10 py-8 flex flex-col relative z-10">
          {children}
          <div className="flex-1"></div>
        </div>
        <div className="shrink-0 px-8 md:px-10 py-1.5 absolute bottom-0 left-0 right-0 pointer-events-none"
             style={{ background: 'linear-gradient(transparent, rgba(26,37,22,.5) 40%)', height: '40px', zIndex: 15 }}></div>
      </div>
    </div>
    <div className="mt-1.5 font-sans-kr text-[0.58rem] text-white/25 text-center tracking-wider shrink-0">{footerText}</div>
  </div>
);
