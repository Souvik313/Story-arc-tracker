import { Router } from 'express'
import { tavily } from '@tavily/core'
import Groq from 'groq-sdk'
import { TAVILY_API_KEY } from '../config/env.js'
import { GROQ_API_KEY } from '../config/env.js'
const ingestRouter = Router()

ingestRouter.post('/', async (req, res) => {
  const { topic } = req.body
  const startTime = Date.now()

  console.log(`\n${'='.repeat(60)}`)
  console.log(`[AGENT 1 — INGEST] Started at ${new Date().toISOString()}`)
  console.log(`[AGENT 1 — INGEST] Topic: "${topic}"`)

  try {
    // ── Step 1a: Fetch articles from Tavily ──
    console.log(`[AGENT 1 — INGEST] Fetching articles from Tavily...`)
    const tv = tavily({ apiKey: TAVILY_API_KEY })

    const results = await tv.search(
      `site:economictimes.com ${topic}`,
      { maxResults: 8, includeRawContent: false, searchDepth: 'basic' }
    )

    const articles = results.results.map(r => ({
      title: r.title,
      url: r.url,
      content: r.content.slice(0, 300),
    }))

    console.log(`[AGENT 1 — INGEST] Fetched ${articles.length} articles`)

    // ── Step 1b: Entity extraction via Groq ──
    console.log(`[AGENT 1 — INGEST] Running entity extraction...`)
    const groq = new Groq({ apiKey: GROQ_API_KEY })

    const entityCompletion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: `You are an entity extraction system. Extract key entities from news articles.
Return ONLY valid JSON with no markdown or explanation.`
        },
        {
          role: 'user',
          content: `Topic: "${topic}"

Articles:
${articles.slice(0, 3).map(a => `[${a.title}]\n${a.content}`).join('\n\n---\n\n')}

Extract and return this JSON:
{
  "main_entities": ["list of key people, companies, organisations mentioned"],
  "key_dates": ["list of important dates found in articles in YYYY-MM-DD format"],
  "key_themes": ["list of 3-5 main themes or topics covered"],
  "story_type": "one of: corporate, regulatory, market, political, economic",
  "article_count": ${articles.length}
}

Rules:
- main_entities: max 8 items
- key_dates: max 6 items
- key_themes: max 5 items
- Return ONLY the JSON object`
        }
      ],
      max_tokens: 500,
      temperature: 0.1,
    })

    let entities = {}
    try {
      const raw = entityCompletion.choices[0].message.content
      const cleaned = raw.replace(/```json|```/g, '').trim()
      entities = JSON.parse(cleaned)
    } catch {
      entities = { main_entities: [], key_dates: [], key_themes: [], story_type: 'corporate' }
    }

    const duration = Date.now() - startTime
    console.log(`[AGENT 1 — INGEST] Entities extracted: ${entities.main_entities?.length || 0} entities, ${entities.key_themes?.length || 0} themes`)
    console.log(`[AGENT 1 — INGEST] Completed in ${duration}ms`)

    res.json({
      agent: 'ingest',
      topic,
      articles,
      entities,
      duration_ms: duration,
    })

  } catch (err) {
    console.error(`[AGENT 1 — INGEST] Error: ${err.message}`)
    res.status(500).json({ error: err.message })
  }
})

export default ingestRouter