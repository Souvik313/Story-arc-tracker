const PERSONA_TONES = {
  expert: `You are writing for an EXPERT INVESTOR who actively trades and follows markets closely.
Use technical financial terminology freely. Assume strong knowledge of markets, valuation ratios, derivatives, and financial instruments.
Be analytical, data-driven, and concise. Skip basic explanations. Surface non-consensus signals and technical insights.`,
 
  beginner: `You are writing for a FIRST-TIME INVESTOR who is new to finance and investing.
Use simple, jargon-free language throughout. Explain every financial term the first time it appears.
Use real-world analogies and relatable examples. Be encouraging, patient, and clear.
Avoid acronyms without explanation. Make every insight feel accessible and actionable.`,
 
  professional: `You are writing for a BUSINESS PROFESSIONAL who follows business news for work and strategy.
Focus on strategic business implications, competitive dynamics, and industry-level impact.
Use professional but accessible language. Highlight what this means for business strategy, market positioning, and key stakeholders.
Emphasise leadership decisions, competitive responses, and second-order business implications.`,
};

export const SYSTEM_PROMPT = `You are a senior business journalist and analyst.
Given article excerpts about a news topic, return ONLY valid JSON.
No markdown fences, no explanation, nothing else before or after the JSON.`

export const buildPrompt = (topic, articles, persona = "professional") => {
  const tone = PERSONA_TONES[persona] || PERSONA_TONES.professional;
 
  return `Topic: "${topic}"
 
Persona instruction: ${tone}
 
Articles:
${articles.map((a) => `[${a.title}]\n${a.content}`).join("\n\n---\n\n")}
 
Return this exact JSON structure. Every text field must match the persona tone above:
{
  "summary": "2 sentence arc of the story — written in the persona's language style",
  "timeline": [
    {
      "date": "YYYY-MM-DD",
      "headline": "short event title — max 8 words",
      "detail": "ONE sentence — what happened and why it mattered — written for the persona",
      "sentiment": 0.7,
      "source": "article title"
    }
  ],
  "players": [
    {
      "name": "entity name",
      "role": "their role in this story",
      "stance": "positive | neutral | negative | controversial",
      "note": "ONE sentence on their position — written for the persona"
    }
  ],
  "contrarian_views": [
    {
      "angle": "overlooked perspective — max 8 words",
      "reasoning": "ONE sentence — why this angle matters — written for the persona"
    }
  ],
  "what_to_watch": [
    {
      "signal": "specific thing to monitor — max 8 words",
      "implication": "ONE sentence — what it means if this happens — written for the persona"
    }
  ]
}
 
Rules:
- sentiment is a float: -1.0 (very negative) to 1.0 (very positive)
- Include EXACTLY 10 timeline events, EXACTLY 5 players, EXACTLY 3 contrarian views, EXACTLY 4 watch signals
- Every single text field must be ONE sentence only — no exceptions
- Dates must come from the articles — never fabricate
- contrarian_views must be genuinely non-obvious
- Return NOTHING outside the JSON object`;
};