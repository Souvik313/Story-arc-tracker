import { Router } from 'express'
import Groq from 'groq-sdk'
import { GROQ_API_KEY } from '../config/env.js'
const personaliseRouter = Router()

const PERSONA_CONFIGS = {
  expert: {
    label: 'Expert investor',
    instruction: `Re-write all text fields for an EXPERT INVESTOR who actively trades.
Use technical financial terminology. Assume knowledge of markets, ratios, instruments.
Be analytical, concise, data-driven. Surface non-consensus signals and technical insights.
Prioritise timeline events with market impact. Rank contrarian views by investment relevance.`,
    timelineSort: 'market_impact',
  },
  beginner: {
    label: 'First-time investor',
    instruction: `Re-write all text fields for a FIRST-TIME INVESTOR new to finance.
Use simple jargon-free language. Explain every financial term when first used.
Use real-world analogies. Be encouraging and clear. Avoid unexplained acronyms.
Prioritise timeline events that explain the human impact of the story.`,
    timelineSort: 'chronological',
  },
  professional: {
    label: 'Business professional',
    instruction: `Re-write all text fields for a BUSINESS PROFESSIONAL following news for strategy.
Focus on business strategy, competitive dynamics, and industry impact.
Use professional but accessible language. Highlight strategic implications and stakeholder impact.
Prioritise timeline events with strategic significance.`,
    timelineSort: 'strategic_impact',
  },
}

personaliseRouter.post('/', async (req, res) => {
  const { topic, storyData, persona } = req.body
  const startTime = Date.now()
  const personaConfig = PERSONA_CONFIGS[persona] || PERSONA_CONFIGS.professional

  console.log(`[AGENT 3 - PERSONALISE] Started at ${new Date().toISOString()}`)
  console.log(`[AGENT 3 - PERSONALISE] Topic: "${topic}"`)
  console.log(`[AGENT 3 - PERSONALISE] Persona: "${personaConfig.label}"`)

  try {
    const groq = new Groq({ apiKey: GROQ_API_KEY })

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: `You are a content personalisation agent for Economic Times India.
Your job is to take an existing story arc analysis and rewrite it for a specific user persona.
Return ONLY valid JSON with no markdown or explanation.`
        },
        {
          role: 'user',
          content: `Topic: "${topic}"
Persona: ${personaConfig.label}

Personalisation instruction:
${personaConfig.instruction}

Original story arc to personalise:
${JSON.stringify(storyData, null, 2)}

Rewrite and return the personalised version in this exact JSON structure:
{
  "summary": "rewritten for persona",
  "persona_label": "${personaConfig.label}",
  "timeline": [
    {
      "date": "keep original date",
      "headline": "rewritten for persona",
      "detail": "rewritten for persona ONE sentence",
      "sentiment": "keep original sentiment score",
      "source": "keep original source"
    }
  ],
  "players": [
    {
      "name": "keep original name",
      "role": "keep original role",
      "stance": "keep original stance",
      "note": "rewritten for persona ONE sentence"
    }
  ],
  "contrarian_views": [
    {
      "angle": "rewritten for persona",
      "reasoning": "rewritten for persona ONE sentence"
    }
  ],
  "what_to_watch": [
    {
      "signal": "rewritten for persona",
      "implication": "rewritten for persona ONE sentence"
    }
  ]
}

Rules:
- Rewrite ALL text fields to match the persona's language level and focus
- Keep all dates, sentiment scores, names, stances, and sources exactly as they are
- Every text field must remain ONE sentence
- Return NOTHING outside the JSON object`
        }
      ],
      max_tokens: 4000,
      temperature: 0.4,
    })

    const raw = completion.choices[0].message.content
    let cleaned = raw.replace(/```json|```/g, '').trim()
    const start = cleaned.indexOf('{')
    if (start !== -1) cleaned = cleaned.slice(start)

    let personalised
    try {
      personalised = JSON.parse(cleaned)
    } catch {
      // If personalisation fails, return original with persona label
      console.warn(`[AGENT 3 - PERSONALISE] JSON parse failed, returning original data`)
      personalised = { ...storyData, persona_label: personaConfig.label }
    }

    // Guarantee all fields exist
    const safe = {
      summary: personalised.summary || storyData.summary || '',
      persona_label: personaConfig.label,
      timeline: personalised.timeline || storyData.timeline || [],
      players: personalised.players || storyData.players || [],
      contrarian_views: personalised.contrarian_views || storyData.contrarian_views || [],
      what_to_watch: personalised.what_to_watch || storyData.what_to_watch || [],
      sentiment_summary: storyData.sentiment_summary || null,
    }

    const duration = Date.now() - startTime
    console.log(`[AGENT 3 - PERSONALISE] Personalised for: ${personaConfig.label}`)
    console.log(`[AGENT 3 - PERSONALISE] Completed in ${duration}ms`)
    console.log(`${'='.repeat(60)}\n`)

    res.json({
      agent: 'personalise',
      topic,
      persona,
      duration_ms: duration,
      ...safe,
    })

  } catch (err) {
    console.error(`[AGENT 3 - PERSONALISE] Error: ${err.message}`)
    // Graceful degradation — return original data unpersonalised
    res.json({
      agent: 'personalise',
      topic,
      persona,
      persona_label: personaConfig.label,
      ...storyData,
    })
  }
})

export default personaliseRouter;