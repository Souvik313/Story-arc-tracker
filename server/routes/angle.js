import { Router } from 'express'
import Groq from 'groq-sdk'
import { GROQ_API_KEY } from '../config/env.js'
const angleRouter = Router()

angleRouter.post('/', async (req, res) => {
  const { topic, angle, anglePrompt, storyData, articles } = req.body

  try {
    const groq = new Groq({ apiKey: GROQ_API_KEY })

    const systemPrompt = `You are a senior business journalist and analyst for Economic Times India.
You are analysing the story "${topic}" from a specific angle.
Base your analysis on the story data and articles provided.
Be specific, insightful and concise. Maximum 4 short paragraphs.
Do not repeat the basic story facts — add analytical depth.
Do not use bullet points — write in flowing journalistic prose.`

    const userPrompt = `Story summary: ${storyData.summary}

Key events:
${storyData.timeline?.slice(0, 6).map(e => `- ${e.date}: ${e.headline}`).join('\n')}

Key players:
${storyData.players?.map(p => `- ${p.name} (${p.role}): ${p.note}`).join('\n')}

Article excerpts:
${articles?.slice(0, 4).map(a => `[${a.title}]\n${a.content?.slice(0, 600)}`).join('\n\n---\n\n')}

Now answer this specific angle:
${anglePrompt}`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 600,
      temperature: 0.4,
    })

    const analysis = completion.choices[0].message.content
    res.json({ angle, analysis })

  } catch (err) {
    console.error('Angle error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

export default angleRouter;