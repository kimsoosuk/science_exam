// ═══════════════════════════════════════════════════════════════
// worker/index.js — Cloudflare Worker
//
// 프론트에서는 간단한 요청만 보내고,
// 프롬프트 조립 + 스키마 + Gemini 호출 + JSON 파싱을 여기서 모두 처리.
//
// 라우팅: POST body의 { action } 값에 따라 분기
//   • "explain"  — 문제 해설 생성
//   • "concept"  — 개념어 설명 생성
//   • "summary"  — 학습 총평 생성
//   • "ask"      — 추가 질문 답변 (자유 텍스트)
// ═══════════════════════════════════════════════════════════════

// ─── 스키마 ─────────────────────────────────────────────────
const EXPLANATION_SCHEMA = {
  type: "OBJECT",
  properties: {
    correctAnswer: { type: "INTEGER" }, subject: { type: "STRING" }, intro: { type: "STRING" },
    coreConcept: { type: "OBJECT", properties: { title: { type: "STRING" }, content: { type: "STRING" } }, required: ["title", "content"] },
    options: { type: "ARRAY", items: { type: "OBJECT", properties: { label: { type: "STRING" }, text: { type: "STRING" }, isCorrect: { type: "BOOLEAN" }, detail: { type: "STRING" } }, required: ["label", "text", "isCorrect", "detail"] } },
    outro: { type: "STRING" },
    concepts: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["correctAnswer", "subject", "intro", "coreConcept", "options", "concepts"],
};

const CONCEPT_SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    etymology: {
      type: "OBJECT", properties: {
        hasHanja: { type: "BOOLEAN" },
        hanjaChars: { type: "ARRAY", items: { type: "OBJECT", properties: { char: { type: "STRING" }, meaning: { type: "STRING" }, reading: { type: "STRING" } }, required: ["char", "meaning", "reading"] } },
        hanjaSummary: { type: "STRING" }, hasLoanword: { type: "BOOLEAN" }, loanwordTerm: { type: "STRING" }, loanwordMeaning: { type: "STRING" },
      }, required: ["hasHanja", "hanjaChars", "hanjaSummary", "hasLoanword", "loanwordTerm", "loanwordMeaning"]
    },
    definition: { type: "OBJECT", properties: { summary: { type: "STRING" }, detail: { type: "STRING" } }, required: ["summary", "detail"] },
    analogyAndStory: { type: "OBJECT", properties: { title: { type: "STRING" }, content: { type: "STRING" } }, required: ["title", "content"] },
    relatedConcepts: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["title", "etymology", "definition", "analogyAndStory", "relatedConcepts"],
};

const SUMMARY_SCHEMA = {
  type: "OBJECT",
  properties: { title: { type: "STRING" }, content: { type: "STRING" } },
  required: ["title", "content"],
};


// ─── 프롬프트 ───────────────────────────────────────────────
const COMMON_RULES = `[절대 규칙]
1. 존댓말 금지. 반말투 유지.
2. 이모지 금지. **단어** 형식 강조만 허용.
3. title 필드 마크다운 금지.
4. 단락 구분 '\\n\\n' 필수.
[중요] 학생의 이름을 모르기 때문에 절대 'OO이', 'OO아', '학생!' 같은 호칭을 쓰지 마. 이름 없이 자연스럽게 말해.
[매우 중요] 수식이나 화학식 작성 시 절대 LaTeX($ 기호 등) 문법을 쓰지 마. H₂O, NH₄⁺ 와 같이 반드시 '유니코드 첨자'를 사용하여 일반 텍스트로만 작성해.`;

const EXPLANATION_SYSTEM = `당신은 똑똑하고 다정하며 논리적인 1타 과학 선생님이야. 주어진 문제 이미지를 분석하고 하드코딩된 정답을 기반으로 아래 JSON 포맷으로 해설을 작성해.
${COMMON_RULES}
[매우 중요] 문제에 보기(ㄱ, ㄴ, ㄷ 또는 가, 나, 다 등)가 있는 경우, 선지(1번, 2번, 3번...) 단위로 묶어서 뭉뚱그려 해설하지 말고, 반드시 각 보기(ㄱ, ㄴ, ㄷ) 단위를 개별 항목으로 나누어 분석해. 
   - options 배열의 label에 'ㄱ', 'ㄴ', 'ㄷ' (혹은 '가', '나', '다')을 넣고 각각이 왜 맞고 틀린지 개별적으로 상세히 설명해. 
   - 보기가 아예 없는 단순 5지선다형 문제일 때만 예외적으로 1~5번 선지를 해설해.
모든 개별 보기 설명이 끝난 후, options 배열 마지막 항목으로 label: '정답 도출'을 추가하여, 최종적으로 앞서 분석한 보기들을 바탕으로 왜 해당 번호가 최종 정답인지 1~2문장으로 결론을 지어줘.`;

const CONCEPT_SYSTEM = `당신은 다정하고 차분한 1타 과학 선생님이야. 학생이 물어본 과학 개념어를 아래 JSON 포맷에 맞게 설명해 줘.
${COMMON_RULES}
etymology.hanjaChars 배열에 한자를 글자 단위로 분리해서 각각의 음(reading)과 뜻(meaning)을 적어줘. 예: [{"char":"氣","meaning":"기운","reading":"기"},{"char":"壓","meaning":"누를","reading":"압"}]
etymology.hanjaSummary에는 한자 어원을 바탕으로 이 단어가 왜 이런 이름이 붙었는지 한 문장으로 설명해줘. 이 설명은 definition과 내용이 겹치지 않도록 어원의 의미에만 집중해.
definition.summary에 한 문장 핵심 정의를 적고, definition.detail에는 이 개념이 실제 과학 문제(특히 고1 3월 모의고사)에서 어떤 맥락으로 출제되는지, 왜 중요한지, 관련 현상이나 원리를 구체적인 예시와 함께 상세하게 4~6문장으로 설명해.
비유와 스토리(analogyAndStory)는 일상적인 경험에 비유해서 설명해줘.`;

const ASK_SYSTEM = `너는 다정하고 학생을 아끼는 1타 과학 강사야. 절대 'OO이', 'OO아', '학생!' 같은 호칭 금지. 존댓말 금지. [매우 중요] 절대 LaTeX 수식($ 기호 등)을 쓰지 마. NH₄⁺, H₂O 와 같이 반드시 '유니코드 첨자'를 사용하여 일반 텍스트로만 화학식/수식을 적어.`;

const SUMMARY_SYSTEM = `너는 통찰력 있고 다정하며 학생을 아끼는 1타 과학 강사야. 절대 'OO이', 'OO아', '학생!' 같은 호칭을 쓰지 마. 이름 없이 자연스럽게 반말로 말해.`;


// ─── Gemini 호출 헬퍼 ───────────────────────────────────────
async function callGemini(apiKey, { prompt, systemInstruction, imageBase64, responseSchema }) {
  const parts = [{ text: prompt }];
  if (imageBase64) parts.push({ inlineData: { mimeType: "image/png", data: imageBase64 } });

  const payload = {
    contents: [{ parts }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: {},
  };
  if (responseSchema) {
    payload.generationConfig.responseMimeType = "application/json";
    payload.generationConfig.responseSchema = responseSchema;
  }

  const model = "gemini-3.1-flash-lite-preview";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Gemini API Error: ${res.status}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini");

  if (responseSchema) {
    let clean = text.trim();
    if (clean.startsWith('```')) clean = clean.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(clean.trim());
  }
  return text;
}


// ─── 액션 핸들러 ────────────────────────────────────────────
function buildExplainRequest(body) {
  const { correctAnswer, subject, imageBase64 } = body;
  return {
    prompt: `이 문제의 실제 정답은 무조건 **${correctAnswer}번**이야. 정답이 ${correctAnswer}번이라는 절대적인 전제 하에, 논리적으로 모순이 없도록 각 선지를 분석하고 상세 해설을 제공해. 실제 이미지를 분석해서 물리, 화학, 생명과학, 지구과학 중 어느 과목인지 판단해 'subject'에 적어.`,
    systemInstruction: EXPLANATION_SYSTEM,
    imageBase64: imageBase64 || null,
    responseSchema: EXPLANATION_SCHEMA,
  };
}

function buildConceptRequest(body) {
  const { conceptName } = body;
  return {
    prompt: `과학 개념어 '${conceptName}'에 대해 쉽게 설명해줘. 어원 분석 시 한자를 글자 단위로 분리해서 각각의 음과 뜻을 hanjaChars 배열에 넣어줘. 외래어도 있으면 loanword 필드에 적어줘. definition.detail은 이 개념이 고1 3월 모의고사에서 어떻게 출제되는지, 관련 현상과 원리를 구체적 예시와 함께 4~6문장으로 상세히 설명해줘.`,
    systemInstruction: CONCEPT_SYSTEM,
    imageBase64: null,
    responseSchema: CONCEPT_SCHEMA,
  };
}

function buildSummaryRequest(body) {
  const { total, correctCount, score, incorrectSubjects } = body;
  const subjectInfo = incorrectSubjects?.length > 0
    ? `틀린 과목은 [${incorrectSubjects.join(', ')}]야.`
    : '틀린 문제가 없어 완벽해!';
  return {
    prompt: `학생이 방금 과학 모의고사를 풀었어. 총 ${total}문제 중 ${correctCount}문제를 맞췄고, 정답률은 ${score}%야. ${subjectInfo} 이 결과를 바탕으로, 1타 과학 강사 김수석의 다정하고 따뜻한 반말투로 총평을 작성해줘. 칭찬과 격려 위주로. title에 마크다운 금지. content에 '\\n\\n'으로 단락 구분, 중요한 단어만 **단어**로 강조. [중요] 학생의 이름을 모르기 때문에 절대 'OO이', 'OO아', '학생!' 같은 호칭을 쓰지 마. 이름 없이 자연스럽게 말해.`,
    systemInstruction: SUMMARY_SYSTEM,
    imageBase64: null,
    responseSchema: SUMMARY_SCHEMA,
  };
}

function buildAskRequest(body) {
  const { subject, question, imageBase64 } = body;
  return {
    prompt: `문제 정보: 과목 ${subject}. 학생은 이미 이 문제의 해설을 다 읽었으므로 절대 문제를 처음부터 다시 설명하거나 풀이하지 마! 즉각적으로 학생의 질문에만 집중해서 핵심만 명확히 답변해줘.\n\n학생 질문: "${question}"`,
    systemInstruction: ASK_SYSTEM,
    imageBase64: imageBase64 || null,
    responseSchema: null,
  };
}


// ─── Worker 엔트리포인트 ────────────────────────────────────
export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });

    const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

    try {
      const body = await request.json();
      const apiKey = env["science-exam"];
      if (!apiKey) return new Response(JSON.stringify({ error: "API 키 미설정" }), { status: 500, headers: jsonHeaders });

      const { action } = body;
      let geminiParams;

      switch (action) {
        case 'explain': geminiParams = buildExplainRequest(body); break;
        case 'concept': geminiParams = buildConceptRequest(body); break;
        case 'summary': geminiParams = buildSummaryRequest(body); break;
        case 'ask': geminiParams = buildAskRequest(body); break;
        default:
          // 하위 호환: action 없으면 기존 방식 (raw payload → Gemini 직접 전달)
          const model = "gemini-3.1-flash-lite-preview";
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const raw = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
          const rawData = await raw.json();
          return new Response(JSON.stringify(rawData), { status: raw.status, headers: jsonHeaders });
      }

      const result = await callGemini(apiKey, geminiParams);
      return new Response(JSON.stringify({ result }), { status: 200, headers: jsonHeaders });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: jsonHeaders });
    }
  },
};
