import { useEffect , useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, TrendingUp, Users, Lightbulb, Eye, BookOpen, Video } from "lucide-react";
import { useStoryArc } from "../../hooks/useStoryArc";
import Timeline from "../../components/TimeLine/TimeLine.jsx";
import SentimentChart from "../../components/SentimentChart/SentimentChart";
import PlayerGrid from "../../components/PlayerGrid/PlayerGrid";
import ContrarianPanel from "../../components/ContrarianPanel/ContrarianPanel";
import StoryChat from "../../components/StoryChat/StoryChat.jsx";
import RelatedStories from "../../components/RelatedStories/RelatedStories.jsx";
import VernacularVideo from "../../components/VernacularVideo/VernacularVideo.jsx";
import AngleNav from "../../components/AngleNav/AngleNav.jsx";
import { getPersona } from "../../lib/persona.js";
import "./StoryArc.css";

export default function StoryArc() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const topic = state?.topic;
  const [showVernacularVideo, setShowVernacularVideo] = useState(false);

  const { data, loading,loadingStep , error, search, articles } = useStoryArc();

  useEffect(() => {
    if (!topic) {
      navigate("/");
      return;
    }
    search(topic);
  }, [topic]);

  const handleNewSearch = () => navigate("/");
  const handleRetry = () => search(topic);

  if (!topic) return null;

  return (
    <div className="storyarc-wrapper">

      {/* Navbar */}
      <nav className="storyarc-nav">
        <button className="storyarc-nav-back" onClick={handleNewSearch}>
          <ArrowLeft size={16} />
          Back
        </button>
        <div className="storyarc-nav-logo">
          <span className="storyarc-et-badge">ET</span>
          <span className="storyarc-nav-title">Story Arc</span>
        </div>
        <div className="storyarc-nav-actions">
          <button
            className="storyarc-nav-video"
            onClick={() => setShowVernacularVideo(true)}
            title="ताज़ा खबर से हिंदी वीडियो बनाएं"
          >
            <Video size={14} />
            Video
          </button>
          <button className="storyarc-nav-new" onClick={handleNewSearch}>
            New search
            <RefreshCw size={14} />
          </button>
        </div>
      </nav>

      {/* Topic header */}
      <div className="storyarc-topic-header">
        <div className="storyarc-topic-label">Story arc</div>
        <h1 className="storyarc-topic-title">{topic}</h1>
        <span className="storyarc-persona-badge">
          Viewing as: {getPersona().label}
        </span>
        {data && (
          <p className="storyarc-topic-summary">{data.summary}</p>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="storyarc-loading">
          <div className="storyarc-loading-spinner" />
          <p className="storyarc-loading-text">Building story arc...</p>
          <p className="storyarc-loading-sub">{loadingStep || "Starting pipeline..."}</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="storyarc-error">
          <p className="storyarc-error-text">{error}</p>
          <button className="storyarc-retry-btn" onClick={handleRetry}>
            <RefreshCw size={14} />
            Try again
          </button>
        </div>
      )}

      {/* ── Everything below only renders when data exists ── */}
      {data && !loading && (
        <>
          {/* Angle navigation */}
          <div className="storyarc-angle-section">
            <AngleNav
              storyData={data}
              topic={topic}
              articles={articles}
            />
          </div>

          {/* Main content */}
          <div className="storyarc-content">

            {/* Timeline */}
            <section className="storyarc-section">
              <div className="storyarc-section-header">
                <TrendingUp size={18} className="storyarc-section-icon" />
                <h2 className="storyarc-section-title">Story timeline</h2>
                <span className="storyarc-section-count">
                  {data.timeline?.length} events
                </span>
              </div>
              <Timeline events={data.timeline} />
            </section>

            {/* Sentiment chart */}
            <section className="storyarc-section">
              <div className="storyarc-section-header">
                <BookOpen size={18} className="storyarc-section-icon" />
                <h2 className="storyarc-section-title">Sentiment over time</h2>
              </div>
              <SentimentChart timeline={data.timeline} />
            </section>

            {/* Key players */}
            <section className="storyarc-section">
              <div className="storyarc-section-header">
                <Users size={18} className="storyarc-section-icon" />
                <h2 className="storyarc-section-title">Key players</h2>
                <span className="storyarc-section-count">
                  {data.players?.length} entities
                </span>
              </div>
              <PlayerGrid players={data.players} />
            </section>

            {/* Contrarian + What to watch */}
            <div className="storyarc-bottom-grid">
              <section className="storyarc-section">
                <div className="storyarc-section-header">
                  <Lightbulb size={18} className="storyarc-section-icon storyarc-icon-amber" />
                  <h2 className="storyarc-section-title">Contrarian views</h2>
                </div>
                <ContrarianPanel
                  items={data.contrarian_views}
                  type="contrarian"
                />
              </section>

              <section className="storyarc-section">
                <div className="storyarc-section-header">
                  <Eye size={18} className="storyarc-section-icon storyarc-icon-teal" />
                  <h2 className="storyarc-section-title">What to watch next</h2>
                </div>
                <ContrarianPanel
                  items={data.what_to_watch}
                  type="watch"
                />
              </section>
            </div>

            {/* Related stories */}
            <RelatedStories topic={topic} />

          </div>
        </>
      )}

      {/* Chat — always rendered once data exists */}
      {data && <StoryChat storyData={data} topic={topic} />}

      {/* Vernacular Video Modal */}
      {showVernacularVideo && (
        <VernacularVideo
          articleText={data?.articles?.[0]?.content || ""}
          sourceTitle={data?.articles?.[0]?.title || topic}
          onClose={() => setShowVernacularVideo(false)}
        />
      )}

    </div>
  );
}