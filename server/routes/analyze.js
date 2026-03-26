import { Router } from 'express'
import Groq from 'groq-sdk'
import { GROQ_API_KEY } from '../config/env.js'

const analyseRouter = Router()

function repairJSON(raw) {
  let cleaned = raw.replace(/```json|```/g, '').trim()
  const start = cleaned.indexOf('{')
  if (start === -1) throw new Error('No JSON object found')
  cleaned = cleaned.slice(start)
  try {
    return JSON.parse(cleaned)
  } catch {
    let depth = 0
    let lastSafePos = 0
    for (let i = 0; i < cleaned.length; i++) {
      const ch = cleaned[i]
      if (ch === '{' || ch === '[') depth++
      if (ch === '}' || ch === ']') {
        depth--
        if (depth === 0) lastSafePos = i
      }
    }
    if (lastSafePos > 0) {
      try { return JSON.parse(cleaned.slice(0, lastSafePos + 1)) } catch {}
    }
    let fixed = cleaned
    const opens = []
    for (const ch of fixed) {
      if (ch === '{') opens.push('}')
      if (ch === '[') opens.push(']')
      if (ch === '}' || ch === ']') opens.pop()
    }
    fixed += opens.reverse().join('')
    return JSON.parse(fixed)
  }
}

analyseRouter.post('/', async (req, res) => {
  const { topic, articles, entities } = req.body
  const startTime = Date.now()

  console.log(`[AGENT 2 - ANALYSE] Started at ${new Date().toISOString()}`)
  console.log(`[AGENT 2 - ANALYSE] Topic: "${topic}"`)
  console.log(`[AGENT 2 - ANALYSE] Input: ${articles?.length} articles, ${entities?.main_entities?.length || 0} entities`)

  try {
    const groq = new Groq({ apiKey: GROQ_API_KEY })

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: `You are a senior business analyst specialising in sentiment analysis and story timeline construction for Economic Times India.
Given articles and extracted entities about a topic, build a structured story arc with sentiment tags.
Return ONLY valid JSON with no markdown or explanation.`
        },
        {
          role: 'user',
          content: `Topic: "${topic}"

Key entities already extracted: ${entities?.main_entities?.join(', ') || 'none'}
Key themes: ${entities?.key_themes?.join(', ') || 'none'}
Story type: ${entities?.story_type || 'corporate'}

Articles:
${articles.slice(0, 3).map(a => `[${a.title}]\n${a.content}`).join('\n\n---\n\n')}

Build the story arc and return this JSON:
{
  "summary": "2 sentence arc of the full story",
  "timeline": [
    {
      "date": "YYYY-MM-DD",
      "headline": "event title max 8 words",
      "detail": "ONE sentence what happened and why it mattered",
      "sentiment": 0.7,
      "source": "article title"
    }
  ],
  "players": [
    {
      "name": "entity name",
      "role": "their role in this story",
      "stance": "positive | neutral | negative | controversial",
      "note": "ONE sentence on their position"
    }
  ],
  "contrarian_views": [
    {
      "angle": "overlooked perspective max 8 words",
      "reasoning": "ONE sentence why this matters"
    }
  ],
  "what_to_watch": [
    {
      "signal": "specific thing to monitor max 8 words",
      "implication": "ONE sentence what it means if this happens"
    }
  ],
  "sentiment_summary": {
    "overall": 0.2,
    "trend": "improving | declining | volatile | stable",
    "most_positive_event": "brief label",
    "most_negative_event": "brief label"
  }
}

Rules:
- sentiment is a float: -1.0 (very negative) to 1.0 (very positive)
- Include EXACTLY 5 timeline events, EXACTLY 3 players, EXACTLY 2 contrarian views, EXACTLY 2 watch signals
- Every text field must be ONE sentence only
- Dates must come from the articles
- contrarian_views must be genuinely non-obvious
- Return NOTHING outside the JSON object`
        }
      ],
      max_tokens: 4000,
      temperature: 0.3,
    })

    const raw = completion.choices[0].message.content
    const data = repairJSON(raw)

    const duration = Date.now() - startTime
    console.log(`[AGENT 2 - ANALYSE] Timeline events: ${data.timeline?.length || 0}`)
    console.log(`[AGENT 2 - ANALYSE] Players: ${data.players?.length || 0}`)
    console.log(`[AGENT 2 - ANALYSE] Overall sentiment: ${data.sentiment_summary?.overall || 'unknown'}`)
    console.log(`[AGENT 2 - ANALYSE] Completed in ${duration}ms`)

    res.json({
      agent: 'analyse',
      topic,
      ...data,
      duration_ms: duration,
    })

  } catch (err) {
    console.error(`[AGENT 2 - ANALYSE] Error: ${err.message}`)
    res.status(500).json({ error: err.message })
  }
})

export default analyseRouter