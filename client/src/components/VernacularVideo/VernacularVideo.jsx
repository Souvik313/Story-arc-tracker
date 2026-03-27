import { useState } from "react";
import {
  Play,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Video,
  RefreshCw,
  Shield,
} from "lucide-react";
import { useVernacularVideo } from "../../hooks/useVernacularVideo";
import VideoPlayer from "../VideoPlayer/VideoPlayer";
import "./VernacularVideo.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const LANGUAGES = [
  { code: "hi", label: "हिंदी", name: "Hindi" },
  { code: "bn", label: "বাংলা", name: "Bengali" },
  { code: "ta", label: "தமிழ்", name: "Tamil" },
  { code: "te", label: "తెలుగు", name: "Telugu" },
];

const VernacularVideo = ({ articleText, sourceTitle, onClose }) => {
  const { data, loading, error, generateVideo, reset } = useVernacularVideo();
  const [inputText, setInputText] = useState(articleText || "");
  const [inputSource, setInputSource] = useState(sourceTitle || "");
  const [selectedLang, setSelectedLang] = useState("hi");
  const [showVideo, setShowVideo] = useState(false);

  const handleGenerate = async () => {
    if (!inputText.trim() || inputText.trim().length < 120) return;
    try {
      await generateVideo(inputText, inputSource || null, selectedLang);
    } catch {
      // error handled by hook
    }
  };

  const handleReset = () => {
    reset();
    setInputText(articleText || "");
    setInputSource(sourceTitle || "");
    setSelectedLang("hi");
    setShowVideo(false);
  };

  const videoUrl = data?.demoVideo?.rendered
    ? `${API_URL}/videos/${data.demoVideo.finalVideoPath?.split(/[/\\]/).pop()}`
    : null;

  const isReady = inputText.trim().length >= 120;
  const charCount = inputText.length;

  return (
    <div className="vv-overlay">
      <div className="vv-modal">

        {/* Header */}
        <div className="vv-header">
          <div className="vv-header-left">
            <Video size={20} className="vv-header-icon" />
            <div>
              <h2 className="vv-header-title">Vernacular video</h2>
              <p className="vv-header-sub">ET news in your language</p>
            </div>
          </div>
          <button className="vv-close-btn" onClick={() => onClose?.()}>×</button>
        </div>

        <div className="vv-body">

          {/* Input form */}
          {!data && !loading && (
            <div className="vv-form">
              <div className="vv-field">
                <label className="vv-label">Select language</label>
                <div className="vv-lang-grid">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      className={`vv-lang-btn ${selectedLang === lang.code ? "vv-lang-btn-active" : ""}`}
                      onClick={() => setSelectedLang(lang.code)}
                    >
                      <span className="vv-lang-script">{lang.label}</span>
                      <span className="vv-lang-name">{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="vv-field">
                <label className="vv-label">Source title (optional)</label>
                <input
                  className="vv-input"
                  type="text"
                  value={inputSource}
                  onChange={(e) => setInputSource(e.target.value)}
                  placeholder="e.g. Economic Times"
                />
              </div>

              <div className="vv-field">
                <label className="vv-label">Paste the full article text</label>
                <textarea
                  className="vv-textarea"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste the full article here..."
                  rows={8}
                />
                <div className={`vv-char-count ${isReady ? "vv-char-ready" : ""}`}>
                  {charCount} characters{" "}
                  {isReady ? "— ready" : `— need at least ${120 - charCount} more`}
                </div>
              </div>

              <button
                className={`vv-generate-btn ${isReady ? "vv-generate-btn-active" : ""}`}
                onClick={handleGenerate}
                disabled={!isReady}
              >
                Generate {LANGUAGES.find((l) => l.code === selectedLang)?.name} video
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="vv-loading">
              <div className="vv-spinner" />
              <p className="vv-loading-text">Generating video script...</p>
              <p className="vv-loading-sub">
                Translating and culturally adapting for{" "}
                {LANGUAGES.find((l) => l.code === selectedLang)?.name}
              </p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="vv-error">
              <AlertCircle size={18} className="vv-error-icon" />
              <p className="vv-error-text">{error}</p>
              <button className="vv-retry-btn" onClick={handleReset}>
                <RefreshCw size={13} />
                Try again
              </button>
            </div>
          )}

          {/* Results */}
          {data && !loading && (
            <div className="vv-results">

              {/* Meta row */}
              <div className="vv-meta">
                <div className="vv-meta-item">
                  <Clock size={13} />
                  <span>{data.totalMs}ms</span>
                  {data.under60s && (
                    <CheckCircle size={13} className="vv-check" />
                  )}
                </div>
                <div className="vv-meta-item">
                  <FileText size={13} />
                  <span>{data.facts?.key_facts?.length || 0} key facts extracted</span>
                </div>
                {data.factGuard?.is_factually_safe && (
                  <div className="vv-meta-item vv-meta-safe">
                    <Shield size={13} />
                    <span>Fact verified</span>
                  </div>
                )}
              </div>

              {/* ── Animated VideoPlayer — always shown when slides exist ── */}
              {data.slides?.length > 0 && (
                <div className="vv-player-section">
                  <p className="vv-section-label">Animated video presentation</p>
                  <VideoPlayer
                    slides={data.slides}
                    title={data.script?.title_hi}
                  />
                </div>
              )}

              {/* ── MP4 video — only shown when FFmpeg rendered (local only) ── */}
              {data.demoVideo?.rendered && videoUrl && (
                <div className="vv-video-section">
                  <div className="vv-video-actions">
                    <button
                      className={`vv-play-btn ${showVideo ? "vv-play-btn-active" : ""}`}
                      onClick={() => setShowVideo((prev) => !prev)}
                    >
                      <Play size={14} />
                      {showVideo ? "Hide video" : "Play MP4"}
                    </button>
                    <a
                      className="vv-download-btn"
                      href={videoUrl}
                      download={data.demoVideo.finalVideoPath?.split(/[/\\]/).pop()}
                    >
                      <Download size={14} />
                      Download MP4
                    </a>
                  </div>
                  {showVideo && (
                    <div className="vv-video-player-wrap">
                      <video
                        className="vv-video-player"
                        controls
                        autoPlay
                        src={videoUrl}
                        onError={() => console.error("Video failed to load:", videoUrl)}
                      >
                        Your browser does not support video playback.
                      </video>
                    </div>
                  )}
                </div>
              )}

              {/* Script card */}
              <div className="vv-script-card">
                <h3 className="vv-script-title">{data.script?.title_hi}</h3>
                <p className="vv-script-text">{data.script?.script_hi}</p>

                {data.script?.slides_hi?.length > 0 && (
                  <div className="vv-slides">
                    <p className="vv-slides-label">Video slides</p>
                    <ol className="vv-slides-list">
                      {data.script.slides_hi.map((slide, i) => (
                        <li key={i} className="vv-slide-item">{slide}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {data.script?.jargon_replacements?.length > 0 && (
                  <div className="vv-jargon">
                    <p className="vv-jargon-label">Jargon simplified</p>
                    <div className="vv-jargon-grid">
                      {data.script.jargon_replacements.map((jr, i) => (
                        <div key={i} className="vv-jargon-item">
                          <span className="vv-jargon-en">{jr.english_jargon}</span>
                          <span className="vv-jargon-arrow">→</span>
                          <span className="vv-jargon-hi">{jr.simple_hindi}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Key facts */}
              {data.facts?.key_facts?.length > 0 && (
                <div className="vv-facts">
                  <p className="vv-facts-label">Extracted facts</p>
                  <ul className="vv-facts-list">
                    {data.facts.key_facts.map((fact, i) => (
                      <li key={i} className="vv-fact-item">{fact}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* New article */}
              <button className="vv-new-btn" onClick={handleReset}>
                <RefreshCw size={13} />
                Process new article
              </button>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VernacularVideo;