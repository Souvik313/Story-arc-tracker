import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SearchBar.css";
import PersonaSelector from "../PersonaSelector/PersonaSelector";
import TrendingNews from "../TrendingNews/TrendingNews";

const SUGGESTED_TOPICS = [
    "Adani Hindenburg report",
  "SEBI F&O restrictions 2024",
  "India IPO market 2025",
  "RBI interest rate decisions",
  "Reliance Jio vs Airtel",
  "Zomato Blinkit quick commerce",
];

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  
  const navigate = useNavigate();

  const handleSearch = (topic) => {
    const q = topic || query;
    if (!q.trim()) return;

    navigate("/story", { state: { topic: q.trim() } });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="searchbar-wrapper">
      <div className="searchbar-header">
        <div className="searchbar-logo-row">
          <span className="searchbar-et-badge">ET</span>
          <span className="searchbar-logo-text">Story Arc</span>
        </div>
        <p className="searchbar-tagline">
          Every business story, fully contextualised — timeline, players,
          sentiment and what happens next.
        </p>
      </div>
 
      <div className={`searchbar-input-wrap ${focused ? "focused" : ""}`}>
        <svg
          className="searchbar-search-icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
 
        <input
          className="searchbar-input"
          type="text"
          placeholder="e.g. Adani Hindenburg report, SEBI F&O restrictions..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoFocus
        />
 
        {query && (
          <button
            className="searchbar-clear-btn"
            onClick={() => setQuery("")}
            aria-label="Clear"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
 
        <button
          className={`searchbar-submit-btn ${query.trim() ? "active" : ""}`}
          onClick={() => handleSearch()}
          disabled={!query.trim()}
        >
          Build arc
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
 
      <div className="searchbar-suggest-section">
        <p className="searchbar-suggest-label">Try these stories</p>
        <div className="searchbar-pills-wrap">
          {SUGGESTED_TOPICS.map((topic) => (
            <button
              key={topic}
              className="searchbar-pill"
              onClick={() => handleSearch(topic)}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      <PersonaSelector />
      <TrendingNews />
 
      <p className="searchbar-footer-note">
        Powered by ET's coverage · Built for ET Gen AI Hackathon 2026
      </p>
 
    </div>
  );
};

export default SearchBar;