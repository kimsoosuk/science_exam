// ═══════════════════════════════════════════════════════════════
// app.jsx — 김수석 과학 해설 앱
//
// 구성: 데이터 → 유틸 → 공통 컴포넌트 → 뷰 → App(상태관리)
//
// API 스키마·프롬프트는 worker/index.js로 이동됨.
// 프론트는 간단한 요청(문제ID, 정답, 질문 등)만 보내고
// worker가 프롬프트 조립 + Gemini 호출 + JSON 파싱을 모두 처리.
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { BookOpen, CheckCircle, ChevronRight, ChevronLeft, ArrowRight, RotateCcw, Brain, Globe, Loader2, AlertCircle, Sparkles, Lightbulb, Target, RefreshCw, Home, Send } from 'lucide-react';
import { BookLayout, CoverLayout } from './book-ui.jsx';

// ═══════════════════════════════════════════
// 1. 상수 & 데이터
// ═══════════════════════════════════════════

const WORKER_URL = "https://science-exam.kimsoosuk1.workers.dev/";
const TEACHER_ICON = "https://res.cloudinary.com/dms5vyofw/image/upload/v1766382489/%E1%84%80%E1%85%B5%E1%86%B7%E1%84%89%E1%85%AE%E1%84%89%E1%85%A5%E1%86%A8%E1%84%8B%E1%85%A1%E1%84%8B%E1%85%B5%E1%84%8F%E1%85%A9%E1%86%AB_%E1%84%85%E1%85%A1%E1%84%8B%E1%85%B5%E1%86%AB_%E1%84%8F%E1%85%A5%E1%86%AF%E1%84%85%E1%85%A51_snx7la.png";

const MOCK_IMAGE_URLS = [
  "https://res.cloudinary.com/dms5vyofw/image/upload/v1771816925/2025_%E1%84%80%E1%85%A91_3%E1%84%86%E1%85%A9_%E1%84%80%E1%85%AA%E1%84%92%E1%85%A1%E1%86%A8_01_nmij9y.png",
  "https://res.cloudinary.com/dms5vyofw/image/upload/v1771816925/2025_%E1%84%80%E1%85%A91_3%E1%84%86%E1%85%A9_%E1%84%80%E1%85%AA%E1%84%92%E1%85%A1%E1%86%A8_02_krzmpb.png",
  "https://res.cloudinary.com/dms5vyofw/image/upload/v1771816927/2025_%E1%84%80%E1%85%A91_3%E1%84%86%E1%85%A9_%E1%84%80%E1%85%AA%E1%84%92%E1%85%A1%E1%86%A8_03_hl43ek.png",
  "https://res.cloudinary.com/dms5vyofw/image/upload/v1771816928/2025_%E1%84%80%E1%85%A91_3%E1%84%86%E1%85%A9_%E1%84%80%E1%85%AA%E1%84%92%E1%85%A1%E1%86%A8_04_xok8vp.png",
  "https://res.cloudinary.com/dms5vyofw/image/upload/v1771816930/2025_%E1%84%80%E1%85%A91_3%E1%84%86%E1%85%A9_%E1%84%80%E1%85%AA%E1%84%92%E1%85%A1%E1%86%A8_05_xoe7tv.png",
  "https://res.cloudinary.com/dms5vyofw/image/upload/v1771816931/2025_%E1%84%80%E1%85%A91_3%E1%84%86%E1%85%A9_%E1%84%80%E1%85%AA%E1%84%92%E1%85%A1%E1%86%A8_06_wzat4r.png",
  "https://res.cloudinary.com/dms5vyofw/image/upload/v1771816933/2025_%E1%84%80%E1%85%A91_3%E1%84%86%E1%85%A9_%E1%84%80%E1%85%AA%E1%84%92%E1%85%A1%E1%86%A8_07_uvw8lb.png",
  "https://res.cloudinary.com/dms5vyofw/image/upload/v1771816936/2025_%E1%84%80%E1%85%A91_3%E1%84%86%E1%85%A9_%E1%84%80%E1%85%AA%E1%84%92%E1%85%A1%E1%86%A8_08_xffamf.png",
  "https://res.cloudinary.com/dms5vyofw/image/upload/v1771816937/2025_%E1%84%80%E1%85%A91_3%E1%84%86%E1%85%A9_%E1%84%80%E1%85%AA%E1%84%92%E1%85%A1%E1%86%A8_09_krpsvp.png",
  "https://res.cloudinary.com/dms5vyofw/image/upload/v1771816938/2025_%E1%84%80%E1%85%A91_3%E1%84%86%E1%85%A9_%E1%84%80%E1%85%AA%E1%84%92%E1%85%A1%E1%86%A8_10_ce2jpa.png",
  "https://res.cloudinary.com/dms5vyofw/image/upload/v1771816940/2025_%E1%84%80%E1%85%A91_3%E1%84%86%E1%85%A9_%E1%84%80%E1%85%AA%E1%84%92%E1%85%A1%E1%86%A8_11_xsp6zl.png",
  "https://res.cloudinary.com/dms5vyofw/image/upload/v1771816942/2025_%E1%84%80%E1%85%A91_3%E1%84%86%E1%85%A9_%E1%84%80%E1%85%AA%E1%84%92%E1%85%A1%E1%86%A8_12_rf8wsh.png",
  "https://res.cloudinary.com/dms5vyofw/image/upload/v1771816944/2025_%E1%84%80%E1%85%A91_3%E1%84%86%E1%85%A9_%E1%84%80%E1%85%AA%E1%84%92%E1%85%A1%E1%86%A8_13_kdvymz.png",
  "https://res.cloudinary.com/dms5vyofw/image/upload/v1771816946/2025_%E1%84%80%E1%85%A91_3%E1%84%86%E1%85%A9_%E1%84%80%E1%85%AA%E1%84%92%E1%85%A1%E1%86%A8_14_nmmnjh.png",
  "https://res.cloudinary.com/dms5vyofw/image/upload/v1771816946/2025_%E1%84%80%E1%85%A91_3%E1%84%86%E1%85%A9_%E1%84%80%E1%85%AA%E1%84%92%E1%85%A1%E1%86%A8_15_fv0572.png",
  "https://res.cloudinary.com/dms5vyofw/image/upload/v1771816948/2025_%E1%84%80%E1%85%A91_3%E1%84%86%E1%85%A9_%E1%84%80%E1%85%AA%E1%84%92%E1%85%A1%E1%86%A8_16_h39doz.png",
  "https://res.cloudinary.com/dms5vyofw/image/upload/v1771816950/2025_%E1%84%80%E1%85%A91_3%E1%84%86%E1%85%A9_%E1%84%80%E1%85%AA%E1%84%92%E1%85%A1%E1%86%A8_17_nn8yas.png",
  "https://res.cloudinary.com/dms5vyofw/image/upload/v1771816955/2025_%E1%84%80%E1%85%A91_3%E1%84%86%E1%85%A9_%E1%84%80%E1%85%AA%E1%84%92%E1%85%A1%E1%86%A8_18_vdnfjw.png",
  "https://res.cloudinary.com/dms5vyofw/image/upload/v1771816951/2025_%E1%84%80%E1%85%A91_3%E1%84%86%E1%85%A9_%E1%84%80%E1%85%AA%E1%84%92%E1%85%A1%E1%86%A8_19_ccetjn.png",
  "https://res.cloudinary.com/dms5vyofw/image/upload/v1771816953/2025_%E1%84%80%E1%85%A91_3%E1%84%86%E1%85%A9_%E1%84%80%E1%85%AA%E1%84%92%E1%85%A1%E1%86%A8_20_mqrqwc.png",
];

const SUBJECT_MAPPING = ['지구과학','지구과학','생명과학','화학','생명과학','물리','화학','생명과학','물리','지구과학','생명과학','지구과학','물리','물리','생명과학','지구과학','물리','생명과학','화학','지구과학'];
const CORRECT_ANSWERS = [4,4,3,4,5,5,4,5,2,1,3,2,1,1,3,3,2,2,3,5];

const INITIAL_PROBLEMS = MOCK_IMAGE_URLS.map((url, i) => ({
  id: `p${i+1}`, number: i+1, subject: SUBJECT_MAPPING[i], imageUrl: url, correctAnswer: CORRECT_ANSWERS[i],
}));


// ═══════════════════════════════════════════
// 2. 유틸리티
// ═══════════════════════════════════════════

const extractString = (val) => { if (!val) return ''; if (typeof val === 'string') return val; if (typeof val === 'object') return val.name || val.term || val.title || JSON.stringify(val); return String(val); };
const cleanTextStr = (val) => { let s = extractString(val); s = s.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{1FAB0}-\u{1FABF}\u{1FAC0}-\u{1FAFF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, ''); s = s.replace(/#/g, ''); return s.trim(); };
const cleanTitleStr = (val) => cleanTextStr(val).replace(/\*/g, '').replace(/_/g, '');

const renderWithBold = (text) => {
  if (!text) return null;
  return extractString(text).split(/(\*\*.*?\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} className="font-bold" style={{ color: '#1e3a28', background: 'linear-gradient(180deg, transparent 58%, rgba(74,158,92,.18) 58%)', padding: '0 2px' }}>{part.slice(2,-2)}</strong>
      : <span key={i}>{part}</span>
  );
};

const imageUrlToBase64 = async (url) => {
  try {
    const r = await fetch(url, { mode: 'cors' }); const b = await r.blob();
    return new Promise(res => { const rd = new FileReader(); rd.onloadend = () => res(rd.result.split(',')[1]); rd.readAsDataURL(b); });
  } catch { return null; }
};

// Worker API 호출 — action 기반 라우팅
const callWorker = async (action, data = {}) => {
  let attempt = 0; const delays = [1000, 2000, 4000, 8000];
  while (attempt < 4) {
    try {
      const res = await fetch(WORKER_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data }),
      });
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.result;
    } catch (e) { attempt++; if (attempt >= 4) throw e; await new Promise(r => setTimeout(r, delays[attempt-1])); }
  }
};


// ═══════════════════════════════════════════
// 3. 공통 컴포넌트
// ═══════════════════════════════════════════

const FormattedParagraphs = ({ text, className }) => {
  if (!text) return null;
  let cleaned = cleanTextStr(text).replace(/\\n/g, '\n');
  const paragraphs = cleaned.split('\n').filter(p => p.trim());
  if (!paragraphs.length) return <span className="text-ink-faint italic">설명이 누락되었어.</span>;
  return (
    <div className={`space-y-3 ${className}`}>
      {paragraphs.map((p, i) => <p key={i} className="leading-[1.85] whitespace-pre-wrap" style={{ textAlign: 'justify', wordBreak: 'keep-all' }}>{renderWithBold(p.trim())}</p>)}
    </div>
  );
};

const ChatInput = ({ onSubmit, placeholder, className }) => {
  const [input, setInput] = useState('');
  return (
    <form onSubmit={e => { e.preventDefault(); if (input.trim()) { onSubmit(input.trim()); setInput(''); } }}
          className={`flex items-center gap-2 w-full max-w-lg mx-auto bg-white p-2 pl-4 rounded-full border font-sans-kr ${className || ''}`} style={{ borderColor: 'rgba(44,36,22,.12)' }}>
      <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder={placeholder || "궁금한 게 더 있으면 물어봐!"} className="flex-1 bg-transparent py-1.5 outline-none text-ink font-medium placeholder:text-ink-faint text-sm font-sans-kr" />
      <button type="submit" disabled={!input.trim()} className="bg-accent text-white p-2 rounded-full hover:bg-cover disabled:opacity-40 transition-colors flex items-center justify-center shrink-0"><Send size={14} className="ml-0.5" /></button>
    </form>
  );
};

const HanjaTable = ({ chars }) => {
  if (!chars?.length) return null;
  return (
    <table className="w-full border-collapse rounded-lg overflow-hidden mb-2" style={{ boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
      <thead><tr>
        <th className="font-sans-kr text-[0.66rem] font-medium text-paper py-1.5 px-3 text-center" style={{ background: '#1e3a28' }}>한자</th>
        <th className="font-sans-kr text-[0.66rem] font-medium text-paper py-1.5 px-3 text-center" style={{ background: '#1e3a28' }}>음</th>
        <th className="font-sans-kr text-[0.66rem] font-medium text-paper py-1.5 px-3 text-left"   style={{ background: '#1e3a28' }}>뜻</th>
      </tr></thead>
      <tbody>{chars.map((c, i) => (
        <tr key={i} style={{ borderBottom: i < chars.length-1 ? '1px solid rgba(44,36,22,.06)' : 'none' }}>
          <td className="font-serif-kr text-lg text-ink text-center py-2 px-3 bg-white">{cleanTitleStr(c.char)}</td>
          <td className="font-sans-kr text-[0.8rem] text-accent font-bold text-center py-2 px-3 bg-white">{cleanTitleStr(c.reading)}</td>
          <td className="font-sans-kr text-[0.8rem] text-ink py-2 px-3 bg-white">{cleanTitleStr(c.meaning)}</td>
        </tr>
      ))}</tbody>
    </table>
  );
};


// ═══════════════════════════════════════════
// 4. 뷰 컴포넌트
// ═══════════════════════════════════════════

const HomeView = ({ onStart }) => {
  const [selectedSubject, setSelectedSubject] = useState('물리');
  return (
    <CoverLayout>
      <div className="mb-8 animate-fade-in relative z-20">
        <div className="w-8 h-0.5 mb-5" style={{ background: '#c4a44a' }}></div>
        <p className="font-sans-kr text-[0.68rem] tracking-[0.15em] mb-3" style={{ color: '#c4a44a' }}>예비고1 바이블 과학편</p>
        <h1 className="text-[1.6rem] font-bold leading-[1.4] mb-3 font-sans-kr" style={{ color: '#f8f3e8', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>2025 고1 3월<br/>학력평가 해설</h1>
        <p className="text-[0.82rem] leading-[1.85] mt-4 font-sans-kr" style={{ color: 'rgba(248,243,232,.75)', wordBreak: 'keep-all' }}>새로운 시작의 순간,<br/>흔들림 없는 기준이 되어줄 김수석 선생님의 통합과학</p>
      </div>
      <div className="w-full h-px mb-6 shrink-0 relative z-20 animate-fade-in" style={{ background: 'linear-gradient(90deg, #c4a44a, rgba(196,164,74,.2))' }}></div>
      <div className="flex flex-col gap-4 relative z-20 animate-fade-in">
        <div className="p-4 md:p-5 rounded-lg" style={{ background: '#f8f3e8', boxShadow: '0 4px 20px rgba(0,0,0,.15)' }}>
          <h3 className="font-sans-kr font-bold text-[0.88rem] mb-2" style={{ color: '#1a2214' }}>전체 문항 차근차근 풀기</h3>
          <p className="text-[0.76rem] mb-3 leading-[1.85]" style={{ color: 'rgba(26,34,20,.7)', wordBreak: 'keep-all' }}>1번부터 20번까지 순서대로 진행합니다. 문제마다 꼼꼼한 해설과 필수 개념을 바로 확인하세요.</p>
          <button onClick={() => onStart('full')} className="w-full text-white py-2.5 rounded-lg font-sans-kr font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm shadow-sm" style={{ background: '#3d7a4a' }}>전체 문항 시작하기 <ArrowRight size={14} /></button>
        </div>
        <div className="p-4 md:p-5 rounded-lg" style={{ background: '#f8f3e8', boxShadow: '0 4px 20px rgba(0,0,0,.15)' }}>
          <h3 className="font-sans-kr font-bold text-[0.88rem] mb-2" style={{ color: '#1a2214' }}>과목별 집중 학습</h3>
          <p className="text-[0.76rem] mb-3 leading-[1.85]" style={{ color: 'rgba(26,34,20,.7)', wordBreak: 'keep-all' }}>어디서부터 손대야 할지 망설여질 땐, 과목을 선택하여 부담 없이 시작해 보세요.</p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {['물리','화학','생명과학','지구과학'].map(sub => (
              <button key={sub} onClick={() => setSelectedSubject(sub)}
                className={`py-2 px-2 rounded-lg text-[0.78rem] font-sans-kr font-medium transition-all ${selectedSubject === sub ? 'shadow-inner' : 'bg-transparent border hover:bg-black/5'}`}
                style={selectedSubject === sub ? { background: '#3d7a4a', color: '#fff', border: '1px solid #3d7a4a' } : { color: '#1a2214', border: '1px solid rgba(26,34,20,.2)' }}>
                {sub}
              </button>
            ))}
          </div>
          <button onClick={() => onStart('subject', { subject: selectedSubject })} className="w-full text-white py-2.5 rounded-lg font-sans-kr font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm shadow-sm" style={{ background: '#3d7a4a' }}>{selectedSubject} 시작하기 <ArrowRight size={14} /></button>
        </div>
      </div>
    </CoverLayout>
  );
};

const SolveView = ({ problem, onSubmit, isSubmitting, onPrev, onNext, isFirst, isLast, currentIndex, totalProblems, onGoHome, pageNumLeft, pageNumRight }) => {
  const [answer, setAnswer] = useState('');
  useEffect(() => { setAnswer(''); }, [problem.id]);

  const leftContent = (
    <div className="flex flex-col h-full animate-fade-in pb-4">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="font-bold text-xl text-ink font-serif-kr">{problem.number}번</h2>
        <span className="font-sans-kr text-[0.68rem] font-medium px-2 py-0.5 rounded" style={{ background: 'rgba(74,158,92,.1)', color: '#3d7a4a', border: '1px solid rgba(74,158,92,.2)' }}>{problem.subject}</span>
      </div>
      <div className="flex-1 flex items-start justify-center">
        {problem.imageUrl ? <img src={problem.imageUrl} alt={`${problem.number}번 문제`} className="w-full max-w-full h-auto object-contain" style={{ mixBlendMode: 'multiply' }} />
          : <div className="text-center p-8 text-ink-faint"><AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-50" /><p className="font-sans-kr font-medium text-sm">이미지를 불러올 수 없습니다.</p></div>}
      </div>
    </div>
  );

  const rightContent = (
    <div className="flex flex-col h-full animate-fade-in justify-between pb-4">
      <div>
        <div className="flex items-center justify-between mb-5 pb-3" style={{ borderBottom: '1px solid rgba(44,36,22,.08)' }}>
          <span className="font-sans-kr font-medium text-ink-faint text-[0.76rem]">진행도 {currentIndex+1} / {totalProblems}</span>
          <div className="flex gap-1">
            <button onClick={onPrev} disabled={isFirst} className="p-1.5 rounded hover:bg-paper-edge/50 disabled:opacity-30 text-ink-faint transition-colors"><ChevronLeft size={16} /></button>
            <button onClick={onNext} disabled={isLast} className="p-1.5 rounded hover:bg-paper-edge/50 disabled:opacity-30 text-ink-faint transition-colors"><ChevronRight size={16} /></button>
          </div>
        </div>
        <div className="bg-white p-5 rounded-lg border relative mt-4" style={{ borderColor: 'rgba(44,36,22,.08)', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
          {isSubmitting && <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center z-20 rounded-lg"><Loader2 className="w-7 h-7 text-accent animate-spin mb-3" /><h3 className="font-sans-kr font-medium text-sm text-ink-light">해설 준비 중...</h3></div>}
          <h4 className="font-sans-kr font-bold text-accent mb-4 text-center text-sm">이 문제의 정답은?</h4>
          <div className="flex flex-col gap-3">
            <div className="flex bg-paper rounded-lg border overflow-hidden" style={{ borderColor: 'rgba(44,36,22,.12)' }}>
              <span className="font-sans-kr text-ink-light font-medium px-4 flex items-center justify-center text-[0.76rem]" style={{ background: '#f0ebe0', borderRight: '1px solid rgba(44,36,22,.1)' }}>입력</span>
              <input type="number" min="1" max="5" value={answer} onChange={e => setAnswer(e.target.value)} placeholder="1~5 숫자 입력" disabled={isSubmitting} className="flex-1 p-2.5 text-center outline-none font-bold text-ink text-sm bg-transparent font-serif-kr" />
            </div>
            <button onClick={() => { if (answer) onSubmit(answer); }} disabled={!answer || isSubmitting} className="w-full bg-accent disabled:bg-ink-faint/30 text-white py-2.5 rounded-lg font-sans-kr font-medium transition-all hover:bg-cover text-sm mt-1" style={{ boxShadow: '0 2px 8px rgba(61,122,74,.2)' }}>채점하고 해설 보기</button>
          </div>
        </div>
      </div>
    </div>
  );

  return <BookLayout leftPage={leftContent} rightPage={rightContent} onGoHome={onGoHome} pageNumLeft={pageNumLeft} pageNumRight={pageNumRight} />;
};

const ExplainView = ({ explanation, problem, userAnswer, onConceptClick, onAskQuestion, onNextProblem, isLastProblem, onGoHome, pageNumLeft, pageNumRight }) => {
  const isCorrect = parseInt(userAnswer) === problem.correctAnswer;
  const chatHistory = explanation.chatHistory || [];
  const optionsList = Array.isArray(explanation.options) ? explanation.options : [];
  const conceptsList = Array.isArray(explanation.concepts) ? explanation.concepts : [];

  const leftContent = (
    <div className="flex flex-col h-full animate-fade-in pb-4">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="font-bold text-xl text-ink font-serif-kr">{problem.number}번</h2>
        <span className="font-sans-kr text-[0.68rem] font-medium px-2 py-0.5 rounded" style={{ background: 'rgba(74,158,92,.1)', color: '#3d7a4a', border: '1px solid rgba(74,158,92,.2)' }}>{problem.subject}</span>
      </div>
      <div className="flex-1 mt-2"><img src={problem.imageUrl} alt={`${problem.number}번 문제`} className="w-full max-w-full h-auto object-contain" style={{ mixBlendMode: 'multiply' }} /></div>
    </div>
  );

  const rightContent = (
    <div className="flex flex-col gap-5 animate-fade-in pb-6">
      <div className="p-3 rounded-lg flex items-center gap-3 bg-white border" style={{ borderColor: isCorrect ? 'rgba(74,158,92,.3)' : 'rgba(166,61,47,.2)', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
        {isCorrect ? <CheckCircle className="w-5 h-5 shrink-0 text-accent" /> : <RotateCcw className="w-5 h-5 shrink-0 text-red-soft" />}
        <div className="font-sans-kr"><h2 className={`font-bold text-sm ${isCorrect ? 'text-accent' : 'text-red-soft'}`}>{isCorrect ? '정답이야! 훌륭해.' : '아쉽네, 오답이야.'}</h2><p className="text-[0.76rem] mt-0.5 text-ink-light">제출: {cleanTitleStr(userAnswer)} / 정답: {problem.correctAnswer}</p></div>
      </div>

      <div className="teacher-box rounded-lg p-4"><div className="flex items-start gap-2.5">
        <img src={TEACHER_ICON} alt="선생님" className="w-8 h-8 shrink-0 rounded-full border border-paper-edge bg-white shadow-sm" />
        <div className="flex-1 min-w-0 pt-0.5"><h3 className="font-sans-kr font-bold text-accent mb-1 text-[0.7rem]">김수석 선생님</h3><FormattedParagraphs text={explanation.intro} className="text-ink text-[0.82rem]" /></div>
      </div></div>

      {optionsList.length > 0 && <div className="space-y-3">{optionsList.map((opt, idx) => {
        const isSummary = opt?.label?.includes('정답') || opt?.label?.includes('결론') || opt?.label?.includes('도출');
        return (
          <div key={idx} className={`p-4 rounded-lg bg-white border ${isSummary ? 'quote-box' : ''}`} style={{ borderColor: isSummary ? 'rgba(74,158,92,.3)' : 'rgba(44,36,22,.06)', boxShadow: isSummary ? 'none' : '0 1px 3px rgba(0,0,0,.03)' }}>
            <div className="flex items-start gap-2 mb-1.5">
              <span className={`font-sans-kr font-medium px-2 py-0.5 rounded text-[0.68rem] shrink-0 ${isSummary ? 'bg-cover text-paper' : (opt?.isCorrect ? 'bg-accent text-white' : 'bg-paper-edge text-ink-light')}`}>{cleanTitleStr(opt?.label)} {isSummary ? '' : (opt?.isCorrect ? '(O)' : '(X)')}</span>
              {opt?.text && <p className="font-bold text-[0.82rem] text-ink leading-snug">{renderWithBold(opt?.text)}</p>}
            </div>
            <div className="pl-1 mt-1.5 text-[0.8rem] text-ink leading-relaxed"><FormattedParagraphs text={opt?.detail || opt?.explanation} /></div>
          </div>
        );
      })}</div>}

      {explanation.coreConcept?.content && (
        <div className="pt-5 mt-1" style={{ borderTop: '1px solid rgba(44,36,22,.08)' }}>
          <h3 className="font-sans-kr font-bold text-ink mb-2 text-sm flex items-center gap-1.5"><Lightbulb className="w-4 h-4 text-gold" />{cleanTitleStr(explanation.coreConcept.title)}</h3>
          <div className="text-ink text-[0.82rem] leading-relaxed bg-white p-4 rounded-lg border" style={{ borderColor: 'rgba(44,36,22,.06)', boxShadow: '0 1px 3px rgba(0,0,0,.03)' }}><FormattedParagraphs text={explanation.coreConcept.content} /></div>
        </div>
      )}

      <div className="pt-5 mt-1" style={{ borderTop: '1px solid rgba(44,36,22,.08)' }}>
        <p className="font-sans-kr text-[0.7rem] font-medium text-ink-faint mb-3 text-center tracking-wider">모르는 개념이 있다면 눌러봐!</p>
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {conceptsList.map((c, idx) => { const n = cleanTitleStr(typeof c === 'object' ? c.name : c); return <button key={idx} onClick={() => onConceptClick(n)} className="font-sans-kr px-3 py-1.5 bg-white border border-paper-edge hover:border-accent hover:text-accent text-ink-light rounded text-[0.76rem] font-medium transition-colors" style={{ boxShadow: '0 1px 2px rgba(0,0,0,.04)' }}>{n}</button>; })}
        </div>
        {chatHistory.length > 0 && <div className="space-y-3 mb-4">{chatHistory.map((chat, idx) => (
          <div key={idx} className={`flex gap-2 ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {chat.role === 'assistant' && <img src={TEACHER_ICON} alt="선생님" className="w-8 h-8 shrink-0 rounded-full border border-paper-edge bg-white shadow-sm mt-0.5" />}
            <div className={`p-3 rounded-lg text-[0.82rem] font-sans-kr leading-relaxed ${chat.role === 'user' ? 'bg-accent/10 text-ink-light ml-8 rounded-tr-none' : 'bg-white border w-full rounded-tl-none'} ${chat.isLoading ? 'animate-pulse text-ink-faint' : 'text-ink'}`} style={chat.role === 'assistant' ? { borderColor: 'rgba(44,36,22,.06)', boxShadow: '0 1px 3px rgba(0,0,0,.03)' } : {}}>
              {chat.isLoading ? '답변을 작성하고 있어...' : <FormattedParagraphs text={chat.content} />}
            </div>
          </div>
        ))}</div>}
        <ChatInput onSubmit={onAskQuestion} className="mb-6" placeholder="이 문제에 대해 더 궁금한 점 물어보기!" />
        <div className="pt-5 mt-1" style={{ borderTop: '1px dotted rgba(44,36,22,.15)' }}>
          <button onClick={onNextProblem} className="w-full bg-accent text-white py-3 rounded-lg font-sans-kr font-medium hover:bg-cover transition-colors flex items-center justify-center gap-2 text-sm" style={{ boxShadow: '0 2px 8px rgba(61,122,74,.2)' }}>{isLastProblem ? '결과 확인하기' : '다음 문제로'} <ChevronRight size={14} /></button>
        </div>
      </div>
    </div>
  );

  return <BookLayout leftPage={leftContent} rightPage={rightContent} onGoHome={onGoHome} pageNumLeft={pageNumLeft} pageNumRight={pageNumRight} />;
};

const ConceptView = ({ concept, originalConcepts, newConcepts, returnText, onNextConcept, onNextProblem, onGoHome, pageNumLeft, pageNumRight }) => {
  const ety = concept?.etymology || {};
  const hasHanja = ety.hasHanja && ety.hanjaChars?.length > 0;
  const hasLoanword = ety.hasLoanword && ety.loanwordTerm;

  const leftContent = (
    <div className="flex flex-col gap-5 animate-fade-in pb-6">
      <h2 className="text-xl font-bold text-ink font-serif-kr pb-3" style={{ borderBottom: '1px solid rgba(44,36,22,.15)' }}>{cleanTitleStr(concept.title)}</h2>
      {(hasHanja || hasLoanword) && <div className="mt-1 space-y-4">
        <h3 className="font-sans-kr text-sm font-bold text-ink-faint flex items-center gap-1.5"><Globe size={14} /> 어원 분석</h3>
        {hasHanja && <div><HanjaTable chars={ety.hanjaChars} />{ety.hanjaSummary && <p className="text-[0.82rem] text-ink leading-[1.85] mt-2 pl-1" style={{ wordBreak: 'keep-all' }}>{renderWithBold(cleanTextStr(ety.hanjaSummary))}</p>}</div>}
        {hasLoanword && <div className="bg-white p-4 rounded-lg border" style={{ borderColor: 'rgba(44,36,22,.06)', boxShadow: '0 1px 3px rgba(0,0,0,.03)' }}><div className="font-serif-kr text-lg tracking-wide text-accent mb-2">{cleanTitleStr(ety.loanwordTerm)}</div><FormattedParagraphs text={ety.loanwordMeaning} className="text-[0.82rem] text-ink leading-relaxed" /></div>}
      </div>}
      <div className="mt-2">
        <h3 className="font-sans-kr text-sm font-bold text-ink-faint flex items-center gap-1.5 mb-2.5"><BookOpen size={14} /> 개념 정의</h3>
        <p className="font-bold text-sm text-accent p-3.5 rounded-lg border" style={{ borderColor: 'rgba(74,158,92,.15)', background: 'rgba(74,158,92,.06)' }}>{renderWithBold(cleanTextStr(concept?.definition?.summary))}</p>
        <div className="text-[0.82rem] text-ink pl-3 mt-3 leading-[1.85]" style={{ borderLeft: '2px solid #4a9e5c', wordBreak: 'keep-all' }}><FormattedParagraphs text={concept?.definition?.detail} /></div>
      </div>
    </div>
  );

  const rightContent = (
    <div className="flex flex-col gap-5 animate-fade-in h-full justify-between pb-6">
      <div>
        {concept?.analogyAndStory?.content && <div className="p-5 rounded-lg mb-6 border" style={{ background: '#fff9f0', borderColor: '#f5ead5', boxShadow: '0 1px 3px rgba(0,0,0,.03)' }}>
          <h3 className="font-sans-kr text-sm font-bold mb-2.5 flex items-center gap-1.5" style={{ color: '#a67c3d' }}><Sparkles size={14} /> 비유로 이해하기</h3>
          <h4 className="font-bold text-ink text-[0.82rem] mb-1.5">{cleanTitleStr(concept.analogyAndStory.title)}</h4>
          <FormattedParagraphs text={concept.analogyAndStory.content} className="text-[0.82rem] text-ink leading-[1.85]" />
        </div>}
        <div className="pt-5" style={{ borderTop: '1px solid rgba(44,36,22,.08)' }}>
          <p className="font-sans-kr text-ink-faint mb-3 text-[0.7rem] text-center tracking-wider font-medium">질문하거나 관련 개념을 더 학습해보세요.</p>
          <div className="flex flex-wrap gap-2 justify-center mb-5">
            {[...originalConcepts, ...newConcepts].map((n, i) => <button key={i} onClick={() => onNextConcept(n)} className="font-sans-kr px-3 py-1 bg-white border border-paper-edge hover:border-accent hover:text-accent text-ink-light rounded text-[0.76rem] font-medium transition-colors" style={{ boxShadow: '0 1px 2px rgba(0,0,0,.04)' }}>{n}</button>)}
          </div>
          <ChatInput onSubmit={onNextConcept} placeholder="질문 입력하기" />
        </div>
      </div>
      <button onClick={onNextProblem} className="w-full bg-accent text-white py-3 rounded-lg font-sans-kr font-medium hover:bg-cover transition-colors flex items-center justify-center gap-2 mt-6 text-sm" style={{ boxShadow: '0 2px 8px rgba(61,122,74,.2)' }}>{returnText} <ChevronRight size={14} /></button>
    </div>
  );

  return <BookLayout leftPage={leftContent} rightPage={rightContent} onGoHome={onGoHome} pageNumLeft={pageNumLeft} pageNumRight={pageNumRight} />;
};

const SummaryView = ({ sessionData, summaryFeedback, isGeneratingSummary, onReviewIncorrect, onGoHome, pageNumLeft, pageNumRight }) => {
  const { queue, answers } = sessionData;
  const total = queue.length;
  const incorrectIds = queue.filter(id => parseInt(answers[id]) !== INITIAL_PROBLEMS.find(p => p.id === id).correctAnswer);
  const correctCount = total - incorrectIds.length;
  const score = Math.round((correctCount / total) * 100);

  const leftContent = (
    <div className="flex flex-col h-full animate-fade-in justify-center items-center py-6">
      <div className="w-8 h-0.5 bg-accent mb-5"></div>
      <Target size={36} className="text-accent mb-3" />
      <h2 className="text-xl font-bold text-ink mb-6 font-serif-kr tracking-tight">학습 총평</h2>
      <div className="flex justify-center items-center gap-6 bg-white p-6 rounded-lg border w-full max-w-[280px]" style={{ borderColor: 'rgba(44,36,22,.06)', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
        <div className="text-center"><div className="text-2xl font-black text-ink font-serif-kr">{correctCount}<span className="text-sm text-ink-faint">/{total}</span></div><div className="font-sans-kr text-[0.68rem] font-medium text-ink-faint mt-1">정답 수</div></div>
        <div className="h-10 w-px bg-paper-edge"></div>
        <div className="text-center"><div className={`text-2xl font-black font-serif-kr ${score >= 80 ? 'text-accent' : score >= 50 ? 'text-gold' : 'text-red-soft'}`}>{score}<span className="text-sm">점</span></div><div className="font-sans-kr text-[0.68rem] font-medium text-ink-faint mt-1">달성률</div></div>
      </div>
    </div>
  );

  const rightContent = (
    <div className="flex flex-col gap-5 animate-fade-in pb-6">
      <div className="teacher-box rounded-lg p-4"><div className="flex items-start gap-2.5">
        <img src={TEACHER_ICON} alt="선생님" className="w-8 h-8 shrink-0 rounded-full border border-paper-edge bg-white shadow-sm" />
        <div className="flex-1 min-w-0 pt-0.5">
          <h3 className="font-sans-kr font-bold text-accent mb-1.5 text-sm">김수석 선생님의 피드백</h3>
          {isGeneratingSummary ? <div className="flex items-center gap-2 text-ink-light text-sm font-sans-kr"><Loader2 className="w-4 h-4 animate-spin" /> 따뜻한 분석을 작성 중이야...</div>
           : summaryFeedback ? <div><h4 className="font-bold text-ink mb-1 text-[0.82rem]">{cleanTitleStr(summaryFeedback.title)}</h4><FormattedParagraphs text={summaryFeedback.content} className="text-ink text-[0.82rem]" /></div> : null}
        </div>
      </div></div>
      {incorrectIds.length > 0 && <div className="bg-white p-4 rounded-lg border mt-1" style={{ borderColor: 'rgba(166,61,47,.15)', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
        <h3 className="font-sans-kr text-sm font-bold flex items-center gap-1.5 mb-1.5 text-ink"><RotateCcw size={14} className="text-red-soft" /> 오답 노트</h3>
        <p className="font-sans-kr text-ink-light text-[0.76rem] mb-3">틀린 문제를 다시 풀어보며 약점을 보완하세요.</p>
        <button onClick={() => onReviewIncorrect(incorrectIds)} className="w-full py-2.5 rounded-lg font-sans-kr font-medium transition-colors flex items-center justify-center gap-1.5 text-[0.82rem]" style={{ background: 'rgba(166,61,47,.06)', color: '#a63d2f', border: '1px solid rgba(166,61,47,.2)' }}><RefreshCw size={13} /> 틀린 문제만 다시 풀기</button>
      </div>}
      <button onClick={onGoHome} className="w-full bg-accent text-white py-3 rounded-lg font-sans-kr font-medium hover:bg-cover transition-colors mt-auto text-sm" style={{ boxShadow: '0 2px 8px rgba(61,122,74,.2)' }}>처음으로 돌아가기</button>
    </div>
  );

  return <BookLayout leftPage={leftContent} rightPage={rightContent} onGoHome={onGoHome} pageNumLeft={pageNumLeft} pageNumRight={pageNumRight} />;
};


// ═══════════════════════════════════════════
// 5. App (상태 관리 + 라우팅)
// ═══════════════════════════════════════════

function App() {
  const [appState, setAppState] = useState('HOME');
  const [sessionData, setSessionData] = useState({ mode: null, queue: [], currentIndex: 0, answers: {} });
  const [generatedExplanations, setGeneratedExplanations] = useState({});
  const [generatedConcepts, setGeneratedConcepts] = useState({});
  const [summaryFeedback, setSummaryFeedback] = useState(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [prefetchStatus, setPrefetchStatus] = useState({});
  const [isWaitingForExplanation, setIsWaitingForExplanation] = useState(false);
  const prefetchRef = useRef({});
  const [viewingConceptName, setViewingConceptName] = useState(null);

  const handleGoHome = () => { setAppState('HOME'); setSessionData({ mode: null, queue: [], currentIndex: 0, answers: {} }); setIsWaitingForExplanation(false); setSummaryFeedback(null); };

  const startSession = (mode, options = {}) => {
    let queue = [];
    if (mode === 'full') queue = INITIAL_PROBLEMS.map(p => p.id);
    else queue = INITIAL_PROBLEMS.filter(p => p.subject === options.subject).map(p => p.id);
    if (!queue.length) return alert("해당 조건의 문제가 없어.");
    setSessionData({ mode, queue, currentIndex: 0, answers: {} }); setIsWaitingForExplanation(false); setSummaryFeedback(null); setAppState('SOLVE');
  };

  const startReviewSession = (ids) => { setSessionData({ mode: 'review', queue: ids, currentIndex: 0, answers: {} }); setIsWaitingForExplanation(false); setSummaryFeedback(null); setAppState('SOLVE'); };
  const handleNextProblem = () => { if (sessionData.currentIndex >= sessionData.queue.length - 1) setAppState('SUMMARY'); else { setSessionData(prev => ({ ...prev, currentIndex: prev.currentIndex + 1 })); setIsWaitingForExplanation(false); setAppState('SOLVE'); } };
  const handlePrevProblem = () => { if (sessionData.currentIndex > 0) { setSessionData(prev => ({ ...prev, currentIndex: prev.currentIndex - 1 })); setIsWaitingForExplanation(false); setAppState('SOLVE'); } };

  const currentProblemId = sessionData.queue[sessionData.currentIndex];
  const currentProblem = INITIAL_PROBLEMS.find(p => p.id === currentProblemId);

  // Prefetch explanation via worker
  useEffect(() => {
    if (appState === 'SOLVE' && currentProblem) {
      const pId = currentProblem.id;
      if (generatedExplanations[pId] || prefetchRef.current[pId]) return;
      prefetchRef.current[pId] = true;
      setPrefetchStatus(prev => ({ ...prev, [pId]: 'loading' }));
      (async () => {
        try {
          const base64Img = await imageUrlToBase64(currentProblem.imageUrl);
          const result = await callWorker('explain', {
            correctAnswer: currentProblem.correctAnswer,
            subject: currentProblem.subject,
            imageBase64: base64Img,
          });
          setGeneratedExplanations(prev => ({ ...prev, [pId]: result }));
          setPrefetchStatus(prev => ({ ...prev, [pId]: 'done' }));
        } catch { setPrefetchStatus(prev => ({ ...prev, [pId]: 'error' })); }
      })();
    }
  }, [appState, currentProblem]);

  // Summary generation
  useEffect(() => {
    if (appState === 'SUMMARY' && !summaryFeedback && !isGeneratingSummary) {
      setIsGeneratingSummary(true);
      (async () => {
        const total = sessionData.queue.length;
        const incorrectIds = sessionData.queue.filter(id => parseInt(sessionData.answers[id]) !== INITIAL_PROBLEMS.find(p => p.id === id).correctAnswer);
        const correctCount = total - incorrectIds.length;
        const score = Math.round((correctCount / total) * 100);
        const incorrectSubjects = Array.from(new Set(incorrectIds.map(id => INITIAL_PROBLEMS.find(p => p.id === id).subject)));
        try {
          const result = await callWorker('summary', { total, correctCount, score, incorrectSubjects });
          setSummaryFeedback(result);
        } catch { setSummaryFeedback({ title: '학습 완료!', content: '수고 정말 많았어! 결과 데이터를 확인하고 약점을 천천히 보완해보자.' }); }
        finally { setIsGeneratingSummary(false); }
      })();
    }
  }, [appState, sessionData, summaryFeedback, isGeneratingSummary]);

  const applyFallbackAndGo = (pId) => {
    setGeneratedExplanations(prev => ({ ...prev, [pId]: { correctAnswer: currentProblem?.correctAnswer || 1, subject: "오류", intro: "선생님이 해설을 준비하다가 오류가 났어. 다시 시도해 줘.", coreConcept: { title: "분석 실패", content: "데이터를 불러오지 못했어." }, options: [], outro: "기다리게 해서 미안해.", concepts: [] } }));
    setAppState('EXPLAIN');
  };

  const handleSubmitAnswer = async (answer) => {
    if (!currentProblem) return;
    setSessionData(prev => ({ ...prev, answers: { ...prev.answers, [currentProblem.id]: answer } }));
    const status = prefetchStatus[currentProblem.id];
    if (status === 'done' && generatedExplanations[currentProblem.id]) setAppState('EXPLAIN');
    else if (status === 'error') applyFallbackAndGo(currentProblem.id);
    else setIsWaitingForExplanation(true);
  };

  useEffect(() => {
    if (isWaitingForExplanation && currentProblem) {
      const status = prefetchStatus[currentProblem.id];
      if (status === 'done') { setIsWaitingForExplanation(false); setAppState('EXPLAIN'); }
      else if (status === 'error') { setIsWaitingForExplanation(false); applyFallbackAndGo(currentProblem.id); }
    }
  }, [isWaitingForExplanation, prefetchStatus, currentProblem]);

  const handleAskQuestion = async (question) => {
    if (!currentProblem) return;
    const pId = currentProblem.id;
    setGeneratedExplanations(prev => {
      const cur = prev[pId]; const ch = cur.chatHistory || [];
      return { ...prev, [pId]: { ...cur, chatHistory: [...ch, { role: 'user', content: question }, { role: 'assistant', content: '', isLoading: true }] } };
    });
    try {
      const base64Img = await imageUrlToBase64(currentProblem.imageUrl);
      const result = await callWorker('ask', { subject: currentProblem.subject, question, imageBase64: base64Img });
      setGeneratedExplanations(prev => { const cur = prev[pId]; const uc = [...cur.chatHistory]; uc[uc.length-1] = { role: 'assistant', content: result }; return { ...prev, [pId]: { ...cur, chatHistory: uc } }; });
    } catch {
      setGeneratedExplanations(prev => { const cur = prev[pId]; const uc = [...cur.chatHistory]; uc[uc.length-1] = { role: 'assistant', content: '미안해. 답변을 불러오는 중에 오류가 생겼어. 다시 한 번 물어볼래?' }; return { ...prev, [pId]: { ...cur, chatHistory: uc } }; });
    }
  };

  const handleConceptClick = async (conceptName) => {
    if (generatedConcepts[conceptName]) { setViewingConceptName(conceptName); setAppState('CONCEPT'); return; }
    setAppState('LOADING_CONCEPT');
    try {
      const result = await callWorker('concept', { conceptName });
      setGeneratedConcepts(prev => ({ ...prev, [conceptName]: result }));
      setViewingConceptName(conceptName); setAppState('CONCEPT');
    } catch { alert('개념 정리 중 오류가 발생했어.'); setAppState(appState === 'SUMMARY' ? 'SUMMARY' : 'EXPLAIN'); }
  };

  const currentExplanation = generatedExplanations[currentProblemId];
  const safeViewingName = cleanTitleStr(viewingConceptName || '');
  const originalConcepts = (currentExplanation?.concepts || []).map(extractString).map(cleanTitleStr).filter(c => c && c !== safeViewingName);
  const newConcepts = (generatedConcepts[viewingConceptName]?.relatedConcepts || []).map(extractString).map(cleanTitleStr).filter(c => c && c !== safeViewingName && !originalConcepts.includes(c));
  const isSessionComplete = sessionData.currentIndex >= sessionData.queue.length - 1 && Object.keys(sessionData.answers).length === sessionData.queue.length;
  const conceptReturnText = isSessionComplete ? '이제 확실히 알겠어! 결과 보기' : '이제 확실히 알겠어! 문제로 복귀';
  const currentLeftPage = (sessionData.currentIndex * 2) + 3;
  const currentRightPage = (sessionData.currentIndex * 2) + 4;
  const summaryLeftPage = (sessionData.queue.length * 2) + 3;
  const summaryRightPage = (sessionData.queue.length * 2) + 4;

  return (
    <React.Fragment>
      {appState === 'HOME' && <HomeView onStart={startSession} />}
      {appState === 'SOLVE' && currentProblem && <SolveView problem={currentProblem} isSubmitting={isWaitingForExplanation} onSubmit={handleSubmitAnswer} onPrev={handlePrevProblem} onNext={handleNextProblem} isFirst={sessionData.currentIndex === 0} isLast={sessionData.currentIndex === sessionData.queue.length - 1} currentIndex={sessionData.currentIndex} totalProblems={sessionData.queue.length} onGoHome={handleGoHome} pageNumLeft={currentLeftPage} pageNumRight={currentRightPage} />}
      {appState === 'EXPLAIN' && currentProblem && currentExplanation && <ExplainView explanation={currentExplanation} problem={currentProblem} userAnswer={sessionData.answers[currentProblem.id]} onConceptClick={handleConceptClick} onAskQuestion={handleAskQuestion} onNextProblem={handleNextProblem} isLastProblem={sessionData.currentIndex === sessionData.queue.length - 1} onGoHome={handleGoHome} pageNumLeft={currentLeftPage} pageNumRight={currentRightPage} />}
      {appState === 'LOADING_CONCEPT' && <BookLayout leftPage={<div className="flex flex-col items-center justify-center h-full"><Loader2 className="w-8 h-8 text-accent animate-spin mb-3" /><p className="font-sans-kr font-medium text-sm text-ink-light">개념 정리 중...</p></div>} rightPage={<div className="flex flex-col items-center justify-center h-full opacity-50"><p className="font-sans-kr text-ink-faint text-sm">잠시만 기다려주세요.</p></div>} onGoHome={handleGoHome} pageNumLeft={currentLeftPage} pageNumRight={currentRightPage} />}
      {appState === 'CONCEPT' && viewingConceptName && generatedConcepts[viewingConceptName] && <ConceptView concept={generatedConcepts[viewingConceptName]} originalConcepts={originalConcepts} newConcepts={newConcepts} returnText={conceptReturnText} onNextConcept={handleConceptClick} onNextProblem={() => { if (isSessionComplete) setAppState('SUMMARY'); else setAppState('EXPLAIN'); }} onGoHome={handleGoHome} pageNumLeft={currentLeftPage} pageNumRight={currentRightPage} />}
      {appState === 'SUMMARY' && <SummaryView sessionData={sessionData} summaryFeedback={summaryFeedback} isGeneratingSummary={isGeneratingSummary} onReviewIncorrect={startReviewSession} onGoHome={handleGoHome} pageNumLeft={summaryLeftPage} pageNumRight={summaryRightPage} />}
    </React.Fragment>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);
