import { Router } from 'express'
import { generateVernacularVideoPack } from '../lib/vernacularVideo.js'

const vernacularVideoRouter = Router();

vernacularVideoRouter.post('/', async (req, res) => {
  const { articleText, sourceTitle, targetLang } = req.body || {}

  if (!articleText || typeof articleText !== 'string' || articleText.trim().length < 120) {
    return res.status(400).json({
      error: 'articleText is required and should contain the raw article content.',
    })
  }

  try {
    const result = await generateVernacularVideoPack({
      articleText: articleText.trim(),
      sourceTitle,
      targetLang: targetLang || 'hi',
    })
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

export default vernacularVideoRouter;
