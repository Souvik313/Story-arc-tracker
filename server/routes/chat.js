import { Router } from 'express'
import Groq from 'groq-sdk'
import { GROQ_API_KEY } from '../config/env.js'

const chatRouter = Router();

chatRouter.post('/', async (req, res) => {
  const { topic, storyData, messages, personaType } = req.body

  try {
    const groq = new Groq({ apiKey: GROQ_API_KEY })

    // Build conversation history for Groq
    const conversationHistory = messages.map((msg) => ({
      role: msg.role === 'ai' ? 'assistant' : 'user',
      content: msg.content,
    }))

    const personaInstruction = personaType === 'CFO'
      ? 'Use a CFO lens: concise macro/finance framing, risk-balanced language, and no beginner analogies.'
      : 'Use a first-generation investor lens: plain language, low jargon, practical action points, and clear guardrails against overreaction.'

    const systemPrompt = `You are an expert business journalist and analyst for Economic Times India.
You have deeply analysed the story "${topic}" and have access to its full story arc data below.
${personaInstruction}

Story summary: ${storyData.summary}

Key timeline events:
${storyData.timeline?.map(e => `- ${e.date}: ${e.headline} (${e.detail})`).join('\n')}

Key players:
${storyData.players?.map(p => `- ${p.name} (${p.role}): ${p.note}`).join('\n')}

Contrarian views:
${storyData.contrarian_views?.map(c => `- ${c.angle}: ${c.reasoning}`).join('\n')}

What to watch:
${storyData.what_to_watch?.map(w => `- ${w.signal}: ${w.implication}`).join('\n')}

Answer questions about this story in a clear, insightful, and conversational way.
Be concise — maximum 4 sentences per answer unless the question genuinely needs more.
Always ground your answers in the story data above.
If asked something outside this story, gently redirect back to the topic.

Return ONLY valid JSON with this shape:
{
  "answer": "response text",
  "citations": ["source title 1", "source title 2"]
}

Rules:
- citations must be source titles from timeline/source context above
- include at least 1 citation when making factual claims
- never output markdown`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
      ],
      max_tokens: 500,
      temperature: 0.5,
    })

    const raw = completion.choices[0].message.content?.trim() || ''
    const cleaned = raw.replace(/```json|```/g, '').trim()

    let answer = cleaned
    let citations = []

    try {
      const parsed = JSON.parse(cleaned)
      answer = parsed.answer || 'I could not generate a grounded answer right now.'
      citations = Array.isArray(parsed.citations) ? parsed.citations.slice(0, 3) : []
    } catch {
      const fallbackSources = (storyData.timeline || [])
        .map((event) => event.source)
        .filter(Boolean)
      citations = [...new Set(fallbackSources)].slice(0, 2)
    }

    res.json({ answer, citations })

  } catch (err) {
    console.error('Chat error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

export default chatRouter;