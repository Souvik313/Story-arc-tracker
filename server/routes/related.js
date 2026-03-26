import { Router } from 'express'
import Groq from 'groq-sdk'
import { GROQ_API_KEY } from '../config/env.js'

const relatedRouter = Router()

relatedRouter.post('/', async (req, res) => {
  const { topic } = req.body

  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' })
  }

  try {
    const groq = new Groq({ apiKey: GROQ_API_KEY })

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: `You are a senior business journalist helping readers explore related ecosystem topics.
Given a topic, suggest 3 related topics that would help readers understand the broader context and ecosystem.
Return ONLY a valid JSON array with exactly 3 objects. No markdown, no explanation.`
        },
        {
          role: 'user',
          content: `Topic: "${topic}"

Suggest 3 related topics that show ecosystem thinking - regulatory, competitive, structural aspects that help understand this topic better.
The suggestions should be topics that would appeal to business/finance readers and help them understand the interconnected nature of the story.

Return exactly this JSON structure:
[
  {
    "topic": "related topic 1 (short, 2-5 words)",
    "reason": "why this connects (one sentence)"
  },
  {
    "topic": "related topic 2 (short, 2-5 words)",
    "reason": "why this connects (one sentence)"
  },
  {
    "topic": "related topic 3 (short, 2-5 words)",
    "reason": "why this connects (one sentence)"
  }
]`
        }
      ],
      max_tokens: 500,
    })

    const raw = completion.choices[0].message.content
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const suggestions = JSON.parse(cleaned)
    
    res.json({ relatedTopics: suggestions })

  } catch (err) {
    console.error('Related stories error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

export default relatedRouter
