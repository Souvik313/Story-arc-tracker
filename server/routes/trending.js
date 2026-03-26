import { Router } from 'express'
import { tavily } from '@tavily/core'

const trendingRouter = Router()

const FALLBACK_STORIES = [
  { title: "Byju's collapse and insolvency proceedings", category: "Corporate", time: "Trending", query: "Byju's collapse insolvency" },
  { title: "RBI interest rate decisions 2025", category: "Economy", time: "Trending", query: "RBI interest rate decisions 2025" },
  { title: "Adani Group latest news 2025", category: "Markets", time: "Trending", query: "Adani Group news 2025" },
  { title: "India IPO market boom 2025", category: "Markets", time: "Trending", query: "India IPO market 2025" },
  { title: "Reliance Jio vs Airtel telecom competition", category: "Telecom", time: "Trending", query: "Reliance Jio Airtel competition 2025" },
  { title: "Zomato Blinkit quick commerce growth 2025", category: "Startup", time: "Trending", query: "Zomato Blinkit 2025" },
]

function inferCategory(title) {
  const t = title.toLowerCase()
  if (t.includes('rbi') || t.includes('rate') || t.includes('inflation') || t.includes('gdp') || t.includes('economy')) return 'Economy'
  if (t.includes('sebi') || t.includes('regulation') || t.includes('policy') || t.includes('government') || t.includes('budget')) return 'Policy'
  if (t.includes('bank') || t.includes('loan') || t.includes('credit') || t.includes('npa') || t.includes('finance')) return 'Banking'
  if (t.includes('ipo') || t.includes('nifty') || t.includes('sensex') || t.includes('stock') || t.includes('market') || t.includes('share')) return 'Markets'
  if (t.includes('startup') || t.includes('funding') || t.includes('venture') || t.includes('unicorn')) return 'Startup'
  if (t.includes('telecom') || t.includes('jio') || t.includes('airtel') || t.includes('5g')) return 'Telecom'
  if (t.includes('tech') || t.includes('ai') || t.includes('digital') || t.includes('software')) return 'Tech'
  return 'Corporate'
}

// Get today's date string for the query
function getTodayQuery() {
  const now = new Date()
  const months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December']
  return `${months[now.getMonth()]} ${now.getFullYear()}`
}

// Cache for 10 minutes
let cache = null
let cacheTime = 0
const CACHE_TTL = 10 * 60 * 1000

trendingRouter.get('/', async (req, res) => {
  console.log('[TRENDING] Request received')

  if (cache && Date.now() - cacheTime < CACHE_TTL) {
    console.log('[TRENDING] Returning cached stories')
    return res.json(cache)
  }

  try {
    const tv = tavily({ apiKey: process.env.TAVILY_API_KEY })
    const todayQuery = getTodayQuery()

    // Run two searches in parallel — recent business news + recent market news
    const [businessResults, marketResults] = await Promise.all([
      tv.search(
        `site:economictimes.com Indian business news ${todayQuery}`,
        { maxResults: 6, includeRawContent: false, searchDepth: 'basic' }
      ),
      tv.search(
        `site:economictimes.com India markets economy ${todayQuery}`,
        { maxResults: 6, includeRawContent: false, searchDepth: 'basic' }
      ),
    ])

    // Merge and deduplicate by title
    const allResults = [
      ...(businessResults.results || []),
      ...(marketResults.results || []),
    ]

    const seen = new Set()
    const unique = allResults.filter(r => {
      const key = r.title?.slice(0, 40)
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })

    if (unique.length === 0) throw new Error('No results from Tavily')

    // Filter out old/irrelevant results by checking title doesn't mention old years
    const currentYear = new Date().getFullYear()
    const filtered = unique.filter(r => {
      const title = r.title || ''
      // Exclude if title explicitly mentions years older than last year
      const oldYearMatch = title.match(/\b(20[0-1][0-9]|202[0-2])\b/)
      if (oldYearMatch) return false
      // Exclude if too short
      if (title.length < 20) return false
      return true
    })

    const stories = (filtered.length > 0 ? filtered : unique)
      .slice(0, 8)
      .map(r => ({
        title: r.title
          .replace(/\s*[-|]\s*Economic Times.*$/i, '')
          .replace(/\s*\|\s*ET.*$/i, '')
          .replace(/\s*-\s*ET Markets.*$/i, '')
          .trim(),
        category: inferCategory(r.title),
        time: 'Live',
        query: r.title
          .replace(/\s*[-|]\s*Economic Times.*$/i, '')
          .replace(/\s*\|\s*ET.*$/i, '')
          .trim(),
        url: r.url || null,
        publishedDate: r.publishedDate || null,
      }))

    const response = {
      stories,
      source: 'live',
      fetchedAt: new Date().toISOString(),
    }

    cache = response
    cacheTime = Date.now()

    console.log(`[TRENDING] Fetched ${stories.length} live stories for ${todayQuery}`)
    res.json(response)

  } catch (err) {
    console.error('[TRENDING] Error:', err.message)
    res.json({
      stories: FALLBACK_STORIES,
      source: 'fallback',
      fetchedAt: new Date().toISOString(),
    })
  }
})

export default trendingRouter