import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, ArrowRight, RefreshCw, Clock } from "lucide-react";
import "./TrendingNews.css";

const FALLBACK_TOPICS = [
  {
    title: "Byju's collapse and insolvency proceedings",
    category: "Corporate",
    time: "Trending",
  },
  {
    title: "RBI interest rate decisions 2025",
    category: "Economy",
    time: "Trending",
  },
  {
    title: "Adani Group controversy and recovery",
    category: "Markets",
    time: "Trending",
  },
  {
    title: "India IPO market boom 2025",
    category: "Markets",
    time: "Trending",
  },
  {
    title: "Reliance Jio vs Airtel telecom war",
    category: "Telecom",
    time: "Trending",
  },
  {
    title: "Zomato Blinkit quick commerce growth",
    category: "Startup",
    time: "Trending",
  },
];

const CATEGORY_COLORS = {
  Corporate: { bg: "#fee2e2", text: "#b91c1c" },
  Economy: { bg: "#dbeafe", text: "#1d4ed8" },
  Markets: { bg: "#dcfce7", text: "#15803d" },
  Telecom: { bg: "#ede9fe", text: "#7c3aed" },
  Startup: { bg: "#fef3c7", text: "#b45309" },
  Policy: { bg: "#f0fdfa", text: "#0f766e" },
  Banking: { bg: "#fce7f3", text: "#be185d" },
  Default: { bg: "#f1f5f9", text: "#475569" },
};

function getCategoryStyle(category) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.Default;
}

function timeAgo(dateStr) {
  if (!dateStr) return "Recent";
  const date = new Date(dateStr);
  if (isNaN(date)) return "Recent";
  const diff = Math.floor((Date.now() - date) / 1000 / 60);
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

export default function TrendingNews() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

  const fetchTrending = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`${API_URL}/api/v1/trending`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const data = await res.json();
      if (data.stories && data.stories.length > 0) {
        setStories(data.stories);
        setLastUpdated(new Date());
      } else {
        setStories(FALLBACK_TOPICS);
      }
    } catch {
      setStories(FALLBACK_TOPICS);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrending();
  }, []);

  const handleStoryClick = (story) => {
    const topic = story.query || story.title;
    navigate("/story", { state: { topic } });
  };

  return (
    <div className="trending-wrapper">

      {/* Header */}
      <div className="trending-header">
        <div className="trending-header-left">
          <TrendingUp size={15} className="trending-header-icon" />
          <span className="trending-header-title">Trending on ET</span>
          {lastUpdated && (
            <span className="trending-updated">
              <Clock size={11} />
              Updated {timeAgo(lastUpdated)}
            </span>
          )}
        </div>
        <button
          className="trending-refresh-btn"
          onClick={fetchTrending}
          disabled={loading}
        >
          <RefreshCw
            size={13}
            className={loading ? "trending-spin" : ""}
          />
        </button>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="trending-list">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="trending-skeleton" />
          ))}
        </div>
      )}

      {/* Story list */}
      {!loading && (
        <div className="trending-list">
          {stories.map((story, index) => {
            const catStyle = getCategoryStyle(story.category || "Default");
            return (
              <button
                key={index}
                className="trending-item"
                onClick={() => handleStoryClick(story)}
              >
                <div className="trending-item-left">
                  <span className="trending-item-index">{index + 1}</span>
                  <div className="trending-item-content">
                    <p className="trending-item-title">{story.title}</p>
                    <div className="trending-item-meta">
                      <span
                        className="trending-item-category"
                        style={{
                          background: catStyle.bg,
                          color: catStyle.text,
                        }}
                      >
                        {story.category || "News"}
                      </span>
                      {story.time && (
                        <span className="trending-item-time">{story.time}</span>
                      )}
                    </div>
                  </div>
                </div>
                <ArrowRight size={14} className="trending-item-arrow" />
              </button>
            );
          })}
        </div>
      )}

      {/* Fallback note */}
      {error && !loading && (
        <p className="trending-fallback-note">
          Showing curated topics — live fetch unavailable
        </p>
      )}

    </div>
  );
}