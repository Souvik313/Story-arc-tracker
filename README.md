# Story Arc Tracker

An intelligent AI-powered platform for tracking, analyzing, and personalizing financial news stories. Powered by multi-agent AI orchestration, this application transforms complex economic news into structured narratives with actionable insights, supported by vernacular video generation.

## Overview

Story Arc Tracker leverages a sophisticated 4-agent AI pipeline to:

1. **Ingest** news articles using semantic search and entity extraction
2. **Analyze** story arcs with sentiment analysis and timeline construction
3. **Personalize** content for different user personas (Expert Investor, First-time Investor, Business Professional)
4. **Converse** via AI-powered chat with story context and citations
5. **Generate** vernacular videos in Hindi with TTS narration

Perfect for financial news platforms, investment apps, and educational platforms targeting Indian audiences.

---

## Tech Stack

### Frontend
- **React 19.2** - UI framework
- **Vite 8.0** - Build tool
- **React Router 7.13** - Client-side routing
- **Axios 1.13** - HTTP client
- **Recharts 3.8** - Data visualization
- **Lucide React 0.577** - Icon library
- **clsx 2.1** - Utility for conditional CSS

### Backend
- **Node.js + Express 5.2** - Server framework
- **Groq SDK 1.1** - LLM API (Llama 3.1 8B)
- **Anthropic SDK 0.80** - Claude integration (for future use)
- **Tavily Core 0.7** - Web search API
- **FFmpeg** - Video generation and audio processing
- **Google Translate TTS** - Hindi audio generation
- **gtts 0.2** - Text-to-speech utility
- **CORS 2.8** - Cross-origin request handling
- **dotenv 17.3** - Environment configuration

---

## 📁 Project Structure

```
story-arc-tracker/
│
├── client/                         # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home/               # Landing page
│   │   │   └── StoryArc/           # Story arc display page
│   │   │
│   │   ├── components/
│   │   │   ├── SearchBar/          # Topic search input
│   │   │   ├── PlayerGrid/         # Display key players
│   │   │   ├── TimeLine/           # Event timeline visualization
│   │   │   ├── SentimentChart/     # Sentiment trend chart
│   │   │   ├── AngleNav/           # Contrarian views navigator
│   │   │   ├── PersonaSelector/    # User persona selection
│   │   │   ├── ContrarianPanel/    # Contrarian insights panel
│   │   │   ├── RelatedStories/     # Related news stories
│   │   │   ├── StoryChat/          # AI chat interface
│   │   │   ├── TrendingNews/       # Trending stories feed
│   │   │   ├── VernacularVideo/    # Hindi video player
│   │   │   └── VideoPlayer/        # General video player
│   │   │
│   │   └── lib/                    # Utilities
│   │
│   ├── public/                     # Static assets
│   └── package.json
│
├── server/                         # Node.js backend
│   ├── routes/                     # API endpoints
│   │   ├── ingest.js               # [AGENT 1] News ingestion
│   │   ├── analyze.js              # [AGENT 2] Story analysis
│   │   ├── personalize.js          # [AGENT 3] Content personalization
│   │   ├── chat.js                 # [AGENT 4] Conversational AI
│   │   ├── trending.js             # Trending stories feed
│   │   ├── related.js              # Related stories finder
│   │   ├── angle.js                # Contrarian angles
│   │   └── vernacular-video.js     # Hindi video generation
│   │
│   ├── lib/
│   │   ├── vernacularVideo.js      # Video generation engine
│   │   └── prompt.js               # AI prompts
│   │
│   ├── config/                     # Configuration
│   ├── tmp/                        # Temporary files (videos)
│   ├── index.js                    # Express server setup
│   └── package.json
│
├── ARCHITECTURE_DOCUMENT.pdf      # System design
├── IMPACT_MODEL.pdf               # Impact analysis
└── README.md
```
---

## API Endpoints

### Base URL
`http://localhost:5001/api/v1`

### 1. Ingest Route - Article Collection & Entity Extraction
**Endpoint:** `POST /ingest`

**Purpose:** [AGENT 1] Fetches articles from Tavily and extracts key entities

**Request:**
```json
{
  "topic": "Byju's insolvency crisis"
}
```

**Response**
```json
{
  "agent": "ingest",
  "topic": "Byju's insolvency crisis",
  "articles": [
    {
      "title": "Byju's files for insolvency...",
      "url": "https://...",
      "content": "Article summary (300 chars)..."
    }
  ],
  "entities": {
    "main_entities": ["Byju's", "NCLT", "Aakash Educational"],
    "key_dates": ["2024-12-01", "2024-11-15"],
    "key_themes": ["Insolvency", "EdTech Crisis", "Legal"],
    "story_type": "corporate",
    "article_count": 8
  },
  "duration_ms": 3200
}
```

### 2. Analyze Route - Story Arc Construction
**Endpoint:** `POST /analyse`

**Purpose:** [AGENT 2] Builds structured story arc with sentiment analysis

**Request:**
```json
{
  "topic": "Byju's insolvency crisis",
  "articles": [...],
  "entities": {...}
}
```
**Response:**
```json
{
  "agent": "analyse",
  "topic": "Byju's insolvency crisis",
  "summary": "Byju's downward spiral accelerated...",
  "timeline": [
    {
      "date": "2024-10-15",
      "headline": "Byju's filed for insolvency",
      "detail": "The company officially initiated insolvency proceedings at NCLT.",
      "sentiment": -0.8,
      "source": "Economic Times article"
    }
  ],
  "players": [
    {
      "name": "Byju's",
      "role": "EdTech company facing insolvency",
      "stance": "negative",
      "note": "Founded in 2011, now battling NCLT proceedings."
    }
  ],
  "contrarian_views": [
    {
      "angle": "Acquisition opportunity for strategic buyers",
      "reasoning": "Could be turnaround opportunity with right management."
    }
  ],
  "what_to_watch": [
    {
      "signal": "NCLT verdict on resolution plan",
      "implication": "Determines company's future and creditor recovery."
    }
  ],
  "sentiment_summary": {
    "overall": -0.6,
    "trend": "declining",
    "most_positive_event": "Secured new investor commitments",
    "most_negative_event": "NCLT insolvency filing"
  },
  "duration_ms": 4100
}
```

### 3. Personalize Route - Content Adaptation
**Endpoint:** `POST /personalize`

**Purpose:** [AGENT 3] Rewrites story arc for specific user personas

**Personas Available:**
- expert - Expert investor (technical, data-driven)
- beginner - First-time investor (simple, jargon-free)
- professional - Business professional (strategic focus)

**Request:**
```json
{
  "topic": "Byju's insolvency crisis",
  "persona": "beginner",
  "storyData": { ...from /analyse response... }
}
```

**Response:**
```json
{
  "agent": "personalise",
  "topic": "Byju's insolvency crisis",
  "persona": "beginner",
  "persona_label": "First-time investor",
  "summary": "A famous learning app called Byju's is facing serious trouble...",
  "timeline": [
    {
      "date": "2024-10-15",
      "headline": "Byju's had to ask for legal help",
      "detail": "The company went to court because it ran out of money.",
      "sentiment": -0.8,
      "source": "Economic Times article"
    }
  ],
  "duration_ms": 3800
}
```

### 4. Chat Route - Contextual AI Conversation
**Endpoint:** `POST /chat`

**Purpose:** [AGENT 4] Answer questions about a story with citations

**Request:**
```json
{
  "topic": "Byju's insolvency crisis",
  "storyData": { ...from personalize response... },
  "messages": [
    {
      "role": "user",
      "content": "What will happen to students' fees?"
    }
  ],
  "personaType": "beginner"
}
```

**Response:**
```json
{
  "answer": "Student fees are protected under court supervision. The court is ensuring that refunds are processed fairly...",
  "citations": [
    "NCLT insolvency filing",
    "Creditor protection guidelines"
  ]
}
```

### 5. Trending Route - Live News Feed
**Endpoint:** `GET /trending`

**Purpose:** Fetches trending business stories from Economic Times

**Response:**
```json
{
  "stories": [
    {
      "title": "RBI interest rate hikes impact home loans",
      "category": "Economy",
      "time": "Live",
      "query": "RBI interest rate decisions 2025",
      "url": "https://economictimes.com/...",
      "publishedDate": "2025-03-26T10:30:00Z"
    }
  ],
  "source": "live",
  "fetchedAt": "2025-03-26T10:35:22Z"
}
```

**Caching:** Results cached for 10 minutes to reduce API calls

### 6. Related Route - Story Connections
**Endpoint:** `POST /related`

**Purpose:** Find related stories on similar topics

**Request:**
```json
{
  "topic": "Byju's insolvency",
  "entities": ["EdTech", "Insolvency"]
}
```

### 7. Angle Route - Contrarian Perspectives
**Endpoint:** `POST/angle`

**Purpose:** Generate contrarian investment angles

**Request:**
```json
{
  "topic": "Byju's insolvency",
  "sentiment": -0.6
}
```

### 8. Vernacular Video Route - Hindi Video Generation
**Endpoint:** `POST /vernacular-video`

**Purpose:** Generate Hindi-narrated explainer videos with Devanagari text

**Request:**
```json
{
  "articleText": "Byju's, the edtech startup founded...",
  "sourceTitle": "Byju's files insolvency petition",
  "targetLang": "hi"
}
```

**Response:**
```json
{
  "video_url": "/videos/byju-s-insolvency_20250326.mp4",
  "script_hi": "बयज्‍यूज की कहानी...",
  "audio_url": "/videos/byju-s-insolvency_20250326.mp3",
  "duration_ms": 45000,
  "facts": {
    "headline": "Byju's files insolvency petition",
    "key_facts": ["Company lost funding", "NCLT proceedings"],
    "numbers": ["₹550 crore debt"],
    "dates": ["2024-10-15"]
  }
}
```

---

## AI Agent Workflow Pipeline

```
User Query (Topic)
    ↓
┌─────────────────────────────────────────────┐
│ AGENT 1: INGEST                             │
│ • Search articles via Tavily                │
│ • Extract entities, dates, themes via Groq  │
│ Output: articles[] + entities{}             │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ AGENT 2: ANALYSE                            │
│ • Build timeline with sentiment             │
│ • Identify key players & stances            │
│ • Generate contrarian views                 │
│ • Define "what to watch" signals            │
│ Input: articles + entities                  │
│ Output: story_arc{}                         │
└─────────────────────────────────────────────┘
    ↓
    ├──→ Cache story arc
    │
    ├─→ (Optional) Request from /trending
    │
    └─→ User selects persona
        ↓
┌─────────────────────────────────────────────┐
│ AGENT 3: PERSONALISE                        │
│ • Rewrite all text for persona              │
│ • Adjust timeline sort & emphasis           │
│ • Keep sentiment scores                     │
│ Input: story_arc + persona                  │
│ Output: personalised_story{}                │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ AGENT 4: CHAT (Parallel)                    │
│ • Answer user questions about story         │
│ • Ground answers in story data              │
│ • Provide citations                         │
│ Input: personalised_story + user_messages   │
│ Output: answer + citations                  │
└─────────────────────────────────────────────┘
    ↓
Optional: Generate Hindi video with AGENT VERNACULAR
    ↓
Final Output to User
```

---

## Environment Configuration

### Required Environment Variables

Create a **.env** file in the **server** directory:
# API Keys
GROQ_API_KEY=gsk_your_groq_key_here
TAVILY_API_KEY=tvly_your_tavily_key_here
ANTHROPIC_API_KEY=sk_your_anthropic_key_here

# Server
PORT=5001
NODE_ENV=development

# Frontend
VITE_API_BASE_URL=http://localhost:5001

### Obtaining API keys
1. **Groq**: https://console.groq.com  
   - Free tier: 30 calls/minute  
   - Model: llama-3.1-8b-instant  

2. **Tavily**: https://tavily.com  
   - Web search and RAG API  
   - Free tier: 1000 searches/month  

3. **Anthropic (optional, for future use)**: https://console.anthropic.com

---

## Installation and Setup

### 📋 Prerequisites

- Node.js 18+
- npm or yarn
- FFmpeg (for video generation)

#### Install FFmpeg

**Windows**
```
choco install ffmpeg
```
or download from https://ffmpeg.org

**macOS**
```
brew install ffmpeg
```

**Linux**
```
apt-get install ffmpeg
```

### ⚙️ Backend Setup

```bash
cd server
npm install

# Create .env file
cp .env.example .env
# Edit .env with your API keys

# Development
npm run dev

# Production
npm start
```

After starting the server, it will run on:

```
http://localhost:5001
```

### Frontend Setup

```bash
cd client
npm install

# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Frontend runs on ```http://localhost:5173``` (Vite default)

---

## API Demo Usage

### Complete Flow Example
```bash
# 1. Fetch articles and extract entities
curl -X POST http://localhost:5001/api/v1/ingest \
  -H "Content-Type: application/json" \
  -d '{"topic":"Reliance Industries Q3 earnings"}'

# Response: { agent, topic, articles[], entities{} }
# Save the response for next step

# 2. Analyze story arc
curl -X POST http://localhost:5001/api/v1/analyse \
  -H "Content-Type: application/json" \
  -d '{
    "topic":"Reliance Industries Q3 earnings",
    "articles":[...from step 1...],
    "entities":{...from step 1...}
  }'

# Response: { agent, story_arc: { timeline[], players[], sentiment_summary{} } }
# Save for personalization

# 3. Personalize for beginner investor
curl -X POST http://localhost:5001/api/v1/personalize \
  -H "Content-Type: application/json" \
  -d '{
    "topic":"Reliance Industries Q3 earnings",
    "persona":"beginner",
    "storyData":{...from step 2...}
  }'

# Response: { agent, persona_label, timeline[], players[] (rewritten) }

# 4. Chat about the story
curl -X POST http://localhost:5001/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "topic":"Reliance Industries Q3 earnings",
    "storyData":{...from step 3...},
    "messages":[{"role":"user","content":"How will this affect Reliance stock?"}],
    "personaType":"beginner"
  }'

# Response: { answer: "...", citations: [...] }

# 5. Get trending stories
curl -X GET http://localhost:5001/api/v1/trending

# Response: { stories[], source, fetchedAt }
```

---

## 🤖 AI models and LLMs used

### 1. Groq LLM
- **Model:** llama-3.1-8b-instant  
- **Used in:** All 4 agents (ingest, analyze, personalize, chat)  
- **Features:** Fast inference, free tier available  
- **Rationale:** Speed + cost-effective for real-time processing  

---

### 2. Anthropic Claude (Future)
- **Model:** Claude 3 (available but not yet integrated)  
- **Planned use:** Enhanced reasoning for complex analyses  

---

### 3. Google Translate TTS
- **Purpose:** Hindi audio generation for videos  
- **Language:** Hindi (Devanagari script)  
- **Engine:** Google’s free TTS endpoint  

---

## 🖥️ Frontend Components & Pages

### Pages
- **Home (/)** – Landing page, topic search  
- **StoryArc (/story/:id)** – Full story arc display  

---

### Core Components
- **SearchBar** – Input topics, trigger pipeline  
- **TimeLine** – Visual timeline of events with sentiment  
- **PlayerGrid** – Key players/entities in story  
- **SentimentChart** – Sentiment trend over time  
- **AngleNav** – Navigate contrarian views  
- **PersonaSelector** – Choose user persona (Expert/Beginner/Professional)  
- **ContrarianPanel** – Display contrarian insights  
- **RelatedStories** – Show related news  
- **StoryChat** – Chat with AI about story  
- **TrendingNews** – Live trending stories feed  
- **VernacularVideo** – Play Hindi-narrated videos  
- **VideoPlayer** – Generic video player 

---

## ✨ Features & Capabilities

### ✅ Implemented
- Multi-agent AI orchestration (4 agents)  
- Article ingestion via Tavily (Economic Times focused)  
- Entity extraction with NLP  
- Timeline construction with sentiment analysis  
- Content personalization (3 personas)  
- Chat interface with context awareness  
- Hindi video generation with TTS  
- Trending stories feed with caching  
- CORS-enabled API  
- Responsive React UI with Recharts visualizations  

---

### 🚀 Upcoming
- Groq → Claude 3 model swap for enhanced analysis  
- User authentication & saved stories  
- Advanced search filters & date ranges  
- Real-time WebSocket chat  
- Multi-language support beyond Hindi  
- Advanced video editing (captions, transitions)

---

## ⚡ Performance & Optimization

### Caching
- Trending stories: 10-minute TTL  
- Story arcs: Session-based caching (frontend)  

### Timeouts
- API requests: 30–60 second timeouts  
- FFmpeg operations: 30–60 second timeouts  
- TTS generation: 30 seconds per chunk  

### Optimization Tips
- Use `/trending` before deep analysis for discovery  
- Batch multiple `/chat` requests  
- Use session caching for the same story

---

## 🛡️ Error Handling

### Graceful Degradation
- If Tavily fails: Fallback to cached stories  
- If Groq fails: Return structured error with message  
- If video generation fails: Return story data without video  
- Personalization errors: Return original story with persona label  

---

### Common Issues

| Issue                     | Cause                     | Solution                                                                 |
|--------------------------|--------------------------|--------------------------------------------------------------------------|
| 401 Unauthorized         | Invalid API key          | Check `GROQ_API_KEY` and `TAVILY_API_KEY` in `.env`                      |
| Connection refused       | Server not running       | Run `npm run dev` in server directory                                    |
| FFmpeg not found         | FFmpeg not installed     | Install FFmpeg as per prerequisites                                      |
| No Devanagari font       | Missing Hindi font       | Install fonts like Mangal (Windows) or Lohit (Linux)                     |
| Video generation timeout | Large audio file         | Use shorter articles (<1000 characters)                                  |

---

## 🧪 Testing

### Manual API Testing
Use the demo URLs provided in the **"API Demo Usage"** section with **curl, Postman, or Insomnia**.

---

### Frontend Testing
```bash
cd client
npm run lint
```

---

## 🏗️ Architecture Highlights

### Agent Design Pattern
Each agent is **stateless and idempotent**:

- **Input:** Structured data  
- **Processing:** Deterministic Groq calls with fixed temperature  
- **Output:** JSON response  

---

### Workflow Orchestration
Agents run sequentially, each enriching data for the next:

```text
Raw topic → Ingest (articles) → Analyse (arc) → Personalize/Chat
```

---

### Video Generation Pipeline
```text
Article → Fact Extraction → Hindi Script → TTS Audio →
Demo Video → Combine with Audio → Final Output
```

---

## 🤝 Contributing

This project is designed for extensibility:

- **New Routes:** Add to `server/routes/` and import in `server/index.js`  
- **New Personas:** Add to `PERSONA_CONFIGS` in `personalize.js`  
- **New Components:** Add to `client/src/components/`  
- **New LLM Models:** Swap Groq SDK calls with Anthropic/OpenAI equivalents

---

## 📜 License

This project is licensed under the **ISC License**.

---

## 📚 Support & Documentation

- **Architecture:** See `ARCHITECTURE_DOCUMENT.pdf`  
- **Impact Model:** See `IMPACT_MODEL.pdf`  
- **API Docs:** See this README  
- **Environment Setup:** Create `.env` per specification above  

---

## 📬 Contact & Feedback

For questions, issues, or feature requests, please open a GitHub issue.

---

Built with ❤️ for **ET Gen AI Hackathon** | Powered by **Groq AI** & **Tavily Search**