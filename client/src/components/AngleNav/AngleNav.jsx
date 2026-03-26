import { useState } from "react";
import { TrendingUp, BarChart2, Users, MessageSquare, Loader } from "lucide-react";
import "./AngleNav.css";

const ANGLES = [
  {
    id: "macro",
    label: "Macro impact",
    icon: <TrendingUp size={14} />,
    description: "Big picture economic and policy implications",
    prompt: `Analyse the MACRO ECONOMIC IMPACT of this story. Focus on:
- What does this mean for India's broader economy, GDP, inflation, or monetary policy?
- Which government policies or regulatory frameworks are affected?
- What are the long-term structural implications?
- How does this compare to similar macro events historically?
Be specific and analytical. Avoid repeating the basic story facts.`,
  },
  {
    id: "sector",
    label: "Sector winners & losers",
    icon: <BarChart2 size={14} />,
    description: "Which industries gain or lose from this story",
    prompt: `Analyse the SECTOR-LEVEL IMPACT of this story. Focus on:
- Which specific sectors or industries benefit most and why?
- Which sectors are most negatively affected and why?
- Are there any unexpected second-order sector effects?
- Which types of companies within affected sectors are most exposed?
Be specific — name sectors and explain the mechanism of impact, not just the direction.`,
  },
  {
    id: "market",
    label: "Market reaction",
    icon: <TrendingUp size={14} />,
    description: "How markets and investors are responding",
    prompt: `Analyse the MARKET REACTION to this story. Focus on:
- How have stock markets, bond markets, or currency markets reacted?
- What are FII and DII flows indicating about institutional sentiment?
- Which specific stocks or asset classes are most impacted?
- Is the market reaction rational or is there overreaction or underreaction?
- What are traders and fund managers watching closely?
Be specific about market signals — avoid generic commentary.`,
  },
  {
    id: "expert",
    label: "Expert commentary",
    icon: <MessageSquare size={14} />,
    description: "What analysts, economists and insiders are saying",
    prompt: `Analyse the EXPERT AND ANALYST COMMENTARY around this story. Focus on:
- What are economists, analysts, and industry experts saying?
- Are there significant disagreements among experts and why?
- What insider perspectives or management commentary has emerged?
- Which expert views are contrarian or go against the mainstream narrative?
- Whose analysis has proven most accurate so far?
Surface nuanced expert opinions — not just the consensus view.`,
  },
];

function AngleResult({ result, angle }) {
  if (!result) return null;
  const config = ANGLES.find((a) => a.id === angle);

  return (
    <div className="angle-result">
      <div className="angle-result-header">
        <span className="angle-result-icon">{config?.icon}</span>
        <h3 className="angle-result-title">{config?.label}</h3>
      </div>
      <div className="angle-result-body">
        {result.split("\n").filter(Boolean).map((para, i) => (
          <p key={i} className="angle-result-para">{para}</p>
        ))}
      </div>
    </div>
  );
}

export default function AngleNav({ storyData, topic, articles }) {
  const [activeAngle, setActiveAngle] = useState(null);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL;

  const handleAngleClick = async (angle) => {
    // If already selected and result exists, just toggle off
    if (activeAngle === angle.id) {
      setActiveAngle(null);
      return;
    }

    setActiveAngle(angle.id);
    setError(null);

    // Return cached result if already fetched
    if (results[angle.id]) return;

    setLoading(angle.id);

    try {
      const res = await fetch(`${API_URL}/api/v1/angle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          angle: angle.id,
          anglePrompt: angle.prompt,
          storyData,
          articles,
        }),
      });

      if (!res.ok) throw new Error(`Angle analysis failed: ${res.status}`);
      const data = await res.json();

      setResults((prev) => ({ ...prev, [angle.id]: data.analysis }));
    } catch (err) {
      setError("Could not load this angle. Please try again.");
      setActiveAngle(null);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="anglenav-wrapper">
      {/* Section label */}
      <p className="anglenav-label">Explore this story by angle</p>

      {/* Angle buttons */}
      <div className="anglenav-buttons">
        {ANGLES.map((angle) => (
          <button
            key={angle.id}
            className={`anglenav-btn ${activeAngle === angle.id ? "anglenav-btn-active" : ""} ${loading === angle.id ? "anglenav-btn-loading" : ""}`}
            onClick={() => handleAngleClick(angle)}
            disabled={loading !== null}
          >
            <span className="anglenav-btn-icon">{angle.icon}</span>
            <div className="anglenav-btn-text">
              <span className="anglenav-btn-label">{angle.label}</span>
              <span className="anglenav-btn-desc">{angle.description}</span>
            </div>
            {loading === angle.id && (
              <Loader size={13} className="anglenav-spinner" />
            )}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && <p className="anglenav-error">{error}</p>}

      {/* Result panel */}
      {activeAngle && results[activeAngle] && (
        <AngleResult result={results[activeAngle]} angle={activeAngle} />
      )}

      {/* Loading state for result panel */}
      {loading && (
        <div className="anglenav-loading">
          <Loader size={18} className="anglenav-spinner" />
          <p className="anglenav-loading-text">
            Analysing {ANGLES.find((a) => a.id === loading)?.label.toLowerCase()}...
          </p>
        </div>
      )}
    </div>
  );
}