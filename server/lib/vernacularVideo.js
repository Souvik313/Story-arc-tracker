import Groq from 'groq-sdk'
import { promisify } from 'node:util'
import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

const execFileAsync = promisify(execFile)

const FACT_EXTRACT_PROMPT = `You are a strict fact extractor for Indian business news.
Extract only verifiable facts from the article text.
Return ONLY valid JSON:
{
  "headline": "short headline",
  "company": "main company name",
  "filing_type": "bankruptcy/insolvency filing type if present",
  "key_facts": ["fact 1", "fact 2"],
  "numbers": ["all important numeric values with units exactly as seen"],
  "dates": ["important dates exactly as seen or normalized YYYY-MM-DD when clear"],
  "sources": ["source title"]
}
Rules:
- Do not infer missing facts.
- If unknown, use empty string/array.
- Keep facts concise and literal.`

const HINDI_SCRIPT_PROMPT = `You are writing a 30-45 second Hindi explainer for a semi-urban retail investor with no finance background.
Return ONLY valid JSON:
{
  "title_hi": "Hindi title in Devanagari script",
  "script_hi": "single Hindi narration text in Devanagari script, 80-120 words",
  "slides_hi": [
    "slide line 1 in Devanagari script",
    "slide line 2 in Devanagari script",
    "slide line 3 in Devanagari script",
    "slide line 4 in Devanagari script",
    "slide line 5 in Devanagari script"
  ],
  "jargon_replacements": [
    {
      "english_jargon": "word",
      "simple_hindi": "replacement used"
    }
  ]
}
CRITICAL: Use ONLY Hindi Devanagari Unicode characters (हिंदी देवनागरी लिपि). Do NOT use Romanized/English transliteration.
Examples of CORRECT Hindi:
- पैसा (money), खर्चा (expense), बैंक (bank), कंपनी (company)
- उदाहरण: "यह कंपनी दिवालिया हो गई है" (not "yeh company divaliya ho gayi hai")

Examples of WRONG (do not use):
- paisa, kharcha, bank, company
- "yeh company divaliya ho gayi hai"

Rules:
- Use VERY simple, everyday Hindi Devanagari words
- Use culturally familiar examples in proper Hindi script
- Do not provide investment advice
- Keep it calm, factual, and neutral
- Make it sound like a friendly neighbor explaining
- Write ALL numbers as Hindi words — never use digits like 7.5% or ₹2000 crore
- Example: write "सात पॉइंट पाँच प्रतिशत" not "7.5%"
- Example: write "दो हज़ार करोड़ रुपये" not "₹2000 crore"`

const FACT_GUARD_PROMPT = `You are a factual verifier.
Input has source facts and a generated Hindi script.
Return ONLY valid JSON:
{
  "is_factually_safe": true,
  "issues": [],
  "corrected_script_hi": "..."
}
Rules:
- If script adds unsupported claims, set is_factually_safe=false and correct it.
- Ensure no contradiction with source facts.
- Verify that script uses ONLY Hindi Devanagari Unicode characters, not Romanized English.
- Keep corrected script simple Hindi Devanagari and neutral.`

const ensureDir = async (dirPath) => {
  await fs.mkdir(dirPath, { recursive: true })
}

const ffmpegEscapePath = (p) =>
  String(p)
    .replace(/\\/g, '/')
    .replace(/:/g, '\\:')

const sanitizeFilePart = (value) =>
  String(value || 'video')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'video'

// Convert numbers and symbols to Hindi words for TTS
function convertToHindiWords(text) {
  if (!text) return text

  const hindiDigits = {
    '0': 'शून्य', '1': 'एक', '2': 'दो', '3': 'तीन', '4': 'चार',
    '5': 'पाँच', '6': 'छह', '7': 'सात', '8': 'आठ', '9': 'नौ'
  }

  return text
    // Crore and lakh with digits — e.g. "₹2.5 crore" → "दो पॉइंट पाँच करोड़ रुपये"
    .replace(/₹\s*(\d+(?:\.\d+)?)\s*crore/gi, (_, n) => `${numberToHindi(n)} करोड़ रुपये`)
    .replace(/₹\s*(\d+(?:\.\d+)?)\s*lakh/gi, (_, n) => `${numberToHindi(n)} लाख रुपये`)
    .replace(/₹\s*(\d+(?:\.\d+)?)/g, (_, n) => `${numberToHindi(n)} रुपये`)

    // Percentages — e.g. "7.5%" → "सात पॉइंट पाँच प्रतिशत"
    .replace(/(\d+(?:\.\d+)?)\s*%/g, (_, n) => `${numberToHindi(n)} प्रतिशत`)

    // Billions and millions
    .replace(/(\d+(?:\.\d+)?)\s*billion/gi, (_, n) => `${numberToHindi(n)} अरब`)
    .replace(/(\d+(?:\.\d+)?)\s*million/gi, (_, n) => `${numberToHindi(n)} दस लाख`)
    .replace(/(\d+(?:\.\d+)?)\s*trillion/gi, (_, n) => `${numberToHindi(n)} खरब`)

    // Plain decimal numbers — e.g. "7.5" → "सात पॉइंट पाँच"
    .replace(/\b(\d+)\.(\d+)\b/g, (_, a, b) => {
      const left = numberToHindi(a)
      const right = [...b].map(d => hindiDigits[d] || d).join(' ')
      return `${left} पॉइंट ${right}`
    })

    // Plain integers — e.g. "2025" → Hindi words
    .replace(/\b(\d+)\b/g, (_, n) => numberToHindi(n))
}

function numberToHindi(numStr) {
  const n = parseFloat(numStr)
  if (isNaN(n)) return numStr

  const ones = ['', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ',
                'दस', 'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह',
                'अठारह', 'उन्नीस', 'बीस', 'इक्कीस', 'बाईस', 'तेईस', 'चौबीस', 'पच्चीस',
                'छब्बीस', 'सत्ताईस', 'अट्ठाईस', 'उनतीस', 'तीस', 'इकतीस', 'बत्तीस',
                'तैंतीस', 'चौंतीस', 'पैंतीस', 'छत्तीस', 'सैंतीस', 'अड़तीस', 'उनतालीस',
                'चालीस', 'इकतालीस', 'बयालीस', 'तैंतालीस', 'चवालीस', 'पैंतालीस',
                'छियालीस', 'सैंतालीस', 'अड़तालीस', 'उनचास', 'पचास', 'इक्यावन', 'बावन',
                'तिरपन', 'चौवन', 'पचपन', 'छप्पन', 'सत्तावन', 'अट्ठावन', 'उनसठ', 'साठ',
                'इकसठ', 'बासठ', 'तिरसठ', 'चौंसठ', 'पैंसठ', 'छियासठ', 'सड़सठ', 'अड़सठ',
                'उनहत्तर', 'सत्तर', 'इकहत्तर', 'बहत्तर', 'तिहत्तर', 'चौहत्तर', 'पचहत्तर',
                'छिहत्तर', 'सतहत्तर', 'अठहत्तर', 'उनासी', 'अस्सी', 'इक्यासी', 'बयासी',
                'तिरासी', 'चौरासी', 'पचासी', 'छियासी', 'सत्तासी', 'अट्ठासी', 'नवासी',
                'नब्बे', 'इक्यानवे', 'बानवे', 'तिरानवे', 'चौरानवे', 'पचानवे', 'छियानवे',
                'सत्तानवे', 'अट्ठानवे', 'निन्यानवे']

  const int = Math.floor(n)

  if (int === 0) return 'शून्य'
  if (int < 100) return ones[int] || numStr
  if (int < 1000) {
    const h = Math.floor(int / 100)
    const r = int % 100
    return (ones[h] || '') + ' सौ' + (r > 0 ? ' ' + (ones[r] || '') : '')
  }
  if (int < 100000) {
    const th = Math.floor(int / 1000)
    const r = int % 1000
    return (ones[th] || numberToHindi(String(th))) + ' हज़ार' + (r > 0 ? ' ' + numberToHindi(String(r)) : '')
  }
  if (int < 10000000) {
    const lakh = Math.floor(int / 100000)
    const r = int % 100000
    return (ones[lakh] || numberToHindi(String(lakh))) + ' लाख' + (r > 0 ? ' ' + numberToHindi(String(r)) : '')
  }
  const crore = Math.floor(int / 10000000)
  const r = int % 10000000
  return (ones[crore] || numberToHindi(String(crore))) + ' करोड़' + (r > 0 ? ' ' + numberToHindi(String(r)) : '')
};

// Generate TTS audio from Hindi script using Google TTS API (free)
const generateTTSAudio = async (scriptText, outDir, slug) => {
  const audioFile = path.join(outDir, `${slug}.mp3`)

  const processedText = convertToHindiWords(scriptText)

  const cleanText = processedText
    .replace(/[^\u0900-\u097F\s.,!?।-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleanText || cleanText.length < 5) {
    throw new Error('Not enough Hindi text to generate audio')
  }

  // Split into 190-char chunks to stay under Google's limit
  const chunks = []
  let remaining = cleanText
  while (remaining.length > 0) {
    chunks.push(remaining.slice(0, 190))
    remaining = remaining.slice(190)
  }

  console.log(`[VERNACULAR] TTS: ${chunks.length} chunks to fetch`)

  const chunkFiles = []
  for (let i = 0; i < chunks.length; i++) {
    const chunkFile = path.join(outDir, `${slug}_chunk_${i}.mp3`)
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunks[i])}&tl=hi&client=tw-ob`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://translate.google.com/',
      },
    })

    if (!response.ok) throw new Error(`TTS chunk ${i} failed: ${response.status}`)

    const buffer = await response.arrayBuffer()
    await fs.writeFile(chunkFile, Buffer.from(buffer))
    chunkFiles.push(chunkFile)
    console.log(`[VERNACULAR] TTS: chunk ${i + 1}/${chunks.length} downloaded`)
  }

  // Single chunk — just rename
  if (chunkFiles.length === 1) {
    await fs.rename(chunkFiles[0], audioFile)
    console.log(`[VERNACULAR] TTS audio ready`)
    return audioFile
  }

  // Multiple chunks — merge with FFmpeg
  const concatListFile = path.join(outDir, `${slug}_concat.txt`)
  const concatContent = chunkFiles
    .map(f => `file '${f.replace(/\\/g, '/').replace(/'/g, "\\'")}'`)
    .join('\n')
  await fs.writeFile(concatListFile, concatContent, 'utf8')

  await execFileAsync('ffmpeg', [
    '-y', '-f', 'concat', '-safe', '0',
    '-i', concatListFile, '-c', 'copy', audioFile,
  ], { windowsHide: true, timeout: 30000 })

  await fs.unlink(concatListFile).catch(() => {})
  for (const f of chunkFiles) await fs.unlink(f).catch(() => {})

  console.log(`[VERNACULAR] TTS: ${chunkFiles.length} chunks merged`)
  return audioFile
}

// Get audio duration using ffprobe
const getAudioDuration = async (audioPath) => {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v', 'quiet',
    '-print_format', 'json',
    '-show_format',
    audioPath
  ], { windowsHide: true })
  
  const info = JSON.parse(stdout)
  return parseFloat(info.format.duration)
}

// Check if ffmpeg is available
const checkFfmpeg = async () => {
  try {
    await execFileAsync('ffmpeg', ['-version'], { windowsHide: true })
    return true
  } catch {
    return false
  }
}

// Find a font that supports Devanagari (Hindi) on the system
const findDevanagariFont = async () => {
  const windowsFonts = [
    'C:/Windows/Fonts/mangal.ttf',      // Mangal — standard Hindi font on Windows
    'C:/Windows/Fonts/aparaj.ttf',      // Aparajita
    'C:/Windows/Fonts/kokila.ttf',      // Kokila
    'C:/Windows/Fonts/utsaah.ttf',      // Utsaah
    'C:/Windows/Fonts/arial.ttf',       // Arial fallback
  ]
  const linuxFonts = [
    '/usr/share/fonts/truetype/lohit-devanagari/Lohit-Devanagari.ttf',
    '/usr/share/fonts/truetype/noto/NotoSansDevanagari-Regular.ttf',
    '/usr/share/fonts/truetype/freefont/FreeSans.ttf',
  ]

  const allFonts = [...windowsFonts, ...linuxFonts]
  for (const fontPath of allFonts) {
    try {
      await fs.access(fontPath)
      return fontPath
    } catch {
      // Font not found, try next
    }
  }
  return null
}

const tryRenderDemoVideo = async ({ titleHi, slidesHi, outDir, slug, duration = 15 }) => {
  const outputFile = path.join(outDir, `${slug}.mp4`)

  // Find a Devanagari-capable font
  const fontPath = await findDevanagariFont()

  if (!fontPath) {
    throw new Error('No Devanagari font found on system')
  }

  // Escape text for ffmpeg drawtext — preserve Devanagari but remove problematic chars
  const escapeText = (text) =>
    String(text || '')
      .replace(/'/g, '')  // Remove single quotes
      .replace(/\\/g, '') // Remove backslashes
      .replace(/&/g, '\\&') // Escape ampersands
      .replace(/"/g, '\\"') // Escape double quotes
      .slice(0, 80) // Allow longer lines for Devanagari

  // Build slide lines: title + up to 4 slide lines
  const mainLines = [titleHi, ...slidesHi.slice(0, 4)]
  const mainText = mainLines.map(line => escapeText(line)).join('\n')

  // Write text to temp file with explicit UTF-8 BOM for better FFmpeg compatibility
  const tempTextFile = path.join(outDir, `text_${Date.now()}.txt`)
  const utf8Bom = '\uFEFF' // UTF-8 BOM
  await fs.writeFile(tempTextFile, utf8Bom + mainText, 'utf8')

  // Build drawtext filter — main text from file, and separate watermark
  const fontEscaped = ffmpegEscapePath(fontPath)
  const textFileEscaped = ffmpegEscapePath(tempTextFile)

  const drawTextFilters = [
    `drawtext=fontfile='${fontEscaped}':textfile='${textFileEscaped}':x=60:y=80:fontsize=32:fontcolor=white:shadowcolor=black:shadowx=2:shadowy=2:line_spacing=110`,
    `drawtext=fontfile='${fontEscaped}':text='economictimes.com':x=60:y=660:fontsize=20:fontcolor=0x60a5fa`
  ]

  const vfFilter = drawTextFilters.join(',')

  const args = [
    '-y',
    '-f', 'lavfi',
    '-i', 'color=c=0x0f172a:s=1280x720:d=15',  // Keep 15s for now, will change
    '-vf', vfFilter,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',   // fastest encoding for demo
    '-pix_fmt', 'yuv420p',
    '-t', duration.toString(),  // Use dynamic duration
    outputFile,
  ]

  await execFileAsync('ffmpeg', args, {
    windowsHide: true,
    timeout: 30000,           // 30 second timeout
  })

  // Clean up temp file
  await fs.unlink(tempTextFile).catch(() => {})

  return outputFile
}

// Combine silent video with TTS audio to create final video with voice
const combineVideoWithAudio = async (videoPath, audioPath, outDir, slug) => {
  const finalVideoFile = path.join(outDir, `${slug}_with_voice.mp4`)

  const args = [
    '-y',
    '-i', videoPath,
    '-i', audioPath,
    '-c:v', 'copy',  // copy video stream
    '-c:a', 'aac',   // encode audio to AAC
    finalVideoFile,
  ]

  await execFileAsync('ffmpeg', args, {
    windowsHide: true,
    timeout: 60000,  // 60 second timeout for combining
  })

  return finalVideoFile
}

export const generateVernacularVideoPack = async ({
  articleText,
  sourceTitle,
  targetLang = 'hi',
}) => {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  const startedAt = Date.now()

  console.log(`[VERNACULAR] Starting pipeline — lang: ${targetLang}`)

  // ── Step 1: Fact extraction ──
  console.log(`[VERNACULAR] Step 1: Extracting facts...`)
  const extractRes = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    temperature: 0.1,
    max_tokens: 600,
    messages: [
      { role: 'system', content: FACT_EXTRACT_PROMPT },
      {
        role: 'user',
        content: `Source title: ${sourceTitle || 'Untitled source'}\n\nArticle text:\n${articleText.slice(0, 1000)}`,
      },
    ],
  })
  const factRaw = extractRes.choices[0].message.content?.replace(/```json|```/g, '').trim()
  let facts = {}
  try { facts = JSON.parse(factRaw || '{}') } catch { facts = {} }
  if (!Array.isArray(facts.sources) || facts.sources.length === 0) {
    facts.sources = [sourceTitle || 'Source article']
  }
  console.log(`[VERNACULAR] Step 1 done — ${facts.key_facts?.length || 0} facts extracted`)

  // ── Step 2: Hindi script generation ──
  console.log(`[VERNACULAR] Step 2: Generating Hindi script...`)
  const scriptRes = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    temperature: 0.2,
    max_tokens: 800,
    messages: [
      { role: 'system', content: HINDI_SCRIPT_PROMPT },
      {
        role: 'user',
        content: `Use only these facts:\n${JSON.stringify(facts, null, 2)}`,
      },
    ],
  })
  const scriptRaw = scriptRes.choices[0].message.content?.replace(/```json|```/g, '').trim()
  let scriptPack = {}
  try { scriptPack = JSON.parse(scriptRaw || '{}') } catch { scriptPack = {} }
  console.log(`[VERNACULAR] Step 2 done — script: ${scriptPack.script_hi?.length || 0} chars`)

  // ── Step 3: Fact guard ──
  console.log(`[VERNACULAR] Step 3: Running fact guard...`)
  const guardRes = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    temperature: 0.1,
    max_tokens: 600,
    messages: [
      { role: 'system', content: FACT_GUARD_PROMPT },
      {
        role: 'user',
        content: `Source facts:\n${JSON.stringify(facts, null, 2)}\n\nGenerated script:\n${JSON.stringify(scriptPack, null, 2)}`,
      },
    ],
  })
  const guardRaw = guardRes.choices[0].message.content?.replace(/```json|```/g, '').trim()
  let guard = {}
  try { guard = JSON.parse(guardRaw || '{}') } catch { guard = {} }
  console.log(`[VERNACULAR] Step 3 done — factually safe: ${guard.is_factually_safe}`)

  const safeScript = guard?.corrected_script_hi || scriptPack?.script_hi || ''
  const titleHi = scriptPack?.title_hi || 'ताज़ा कारोबारी अपडेट'
  const slidesHi = Array.isArray(scriptPack?.slides_hi) ? scriptPack.slides_hi : []

  // Build structured slides for VideoPlayer component
  const slides = [
    {
      type: 'title',
      category: sourceTitle || 'Economic Times',
      text: titleHi,
      subtext: new Date().toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric'
      }),
    },
    ...slidesHi.slice(0, 4).map((text, i) => ({
      type: 'fact',
      number: i + 1,
      text,
      context: facts.key_facts?.[i] || null,
    })),
    {
      type: 'outro',
      text: safeScript?.slice(0, 120) + '...',
    },
  ]

  // ── Step 4: Optional FFmpeg render ──
  let videoPath = null
  let audioPath = null
  let finalVideoPath = null
  let renderError = null

  const ffmpegAvailable = await checkFfmpeg()
  console.log(`[VERNACULAR] FFmpeg available: ${ffmpegAvailable}`)

  if (ffmpegAvailable) {
    try {
      const tmpDir = path.join(process.cwd(), 'tmp', 'vernacular-videos')
      await ensureDir(tmpDir)
      const slug = sanitizeFilePart(facts?.company || sourceTitle || 'news')
      const baseSlug = `${slug}-${Date.now()}`

      // ── Generate TTS audio first ──
      audioPath = await generateTTSAudio(safeScript, tmpDir, `${baseSlug}_audio`)
      console.log(`[VERNACULAR] TTS audio generated: ${audioPath}`)

      // Get audio duration
      const audioDuration = await getAudioDuration(audioPath)
      console.log(`[VERNACULAR] Audio duration: ${audioDuration}s`)

      // Generate silent video with matching duration
      videoPath = await tryRenderDemoVideo({
        titleHi,
        slidesHi,
        outDir: tmpDir,
        slug: baseSlug,
        duration: Math.ceil(audioDuration),  // Round up to nearest second
      })
      console.log(`[VERNACULAR] Silent video rendered: ${videoPath}`)

      // Combine video and audio
      finalVideoPath = await combineVideoWithAudio(videoPath, audioPath, tmpDir, baseSlug)
      console.log(`[VERNACULAR] Final video with voice rendered: ${finalVideoPath}`)

    } catch (err) {
      renderError = err.message
      console.warn(`[VERNACULAR] Video/audio render failed: ${err.message}`)
    }
  } else {
    renderError = 'FFmpeg not installed — install it to enable MP4 rendering'
    console.warn(`[VERNACULAR] ${renderError}`)
  }

  const totalMs = Date.now() - startedAt
  console.log(`[VERNACULAR] Pipeline complete in ${totalMs}ms`)

  return {
    targetLang,
    totalMs,
    under60s: totalMs <= 60000,
    sourceTitle: sourceTitle || null,
    facts,
    slides,
    script: {
      title_hi: titleHi,
      script_hi: safeScript,
      slides_hi: slidesHi,
      jargon_replacements: scriptPack?.jargon_replacements || [],
    },
    factGuard: {
      is_factually_safe: Boolean(guard?.is_factually_safe),
      issues: guard?.issues || [],
    },
    demoVideo: {
      silentVideoPath: videoPath ? path.relative(path.join(process.cwd(), 'tmp', 'vernacular-videos'), videoPath).replace(/\\/g, '/') : null,
      audioPath: audioPath ? path.relative(path.join(process.cwd(), 'tmp', 'vernacular-videos'), audioPath).replace(/\\/g, '/') : null,
      finalVideoPath: finalVideoPath ? path.relative(path.join(process.cwd(), 'tmp', 'vernacular-videos'), finalVideoPath).replace(/\\/g, '/') : null,
      rendered: Boolean(finalVideoPath),
      renderError,
      note: finalVideoPath
        ? 'MP4 with voice rendered using FFmpeg and Google TTS.'
        : 'Animated slide player ready. Install FFmpeg to also generate MP4 with voice.',
    },
  }
}