import { useState } from "react";
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from "lucide-react";
import "./TimeLine.css";

function getSentimentClass(sentiment) {
  if (sentiment >= 0.3) return "positive";
  if (sentiment <= -0.3) return "negative";
  return "neutral";
}

function getSentimentIcon(sentiment) {
  if (sentiment >= 0.3) return <TrendingUp size={13} />;
  if (sentiment <= -0.3) return <TrendingDown size={13} />;
  return <Minus size={13} />;
}

function getSentimentLabel(sentiment) {
  if (sentiment >= 0.6) return "Very positive";
  if (sentiment >= 0.3) return "Positive";
  if (sentiment <= -0.6) return "Very negative";
  if (sentiment <= -0.3) return "Negative";
  return "Neutral";
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function TimelineEvent({ event, index, isLast }) {
  const [expanded, setExpanded] = useState(false);
  const sentimentClass = getSentimentClass(event.sentiment);

  return (
    <div className={`timeline-event ${isLast ? "timeline-event-last" : ""}`}>
      {/* Left: connector line + dot */}
      <div className="timeline-connector">
        <div className={`timeline-dot timeline-dot-${sentimentClass}`} />
        {!isLast && <div className="timeline-line" />}
      </div>

      {/* Right: content card */}
      <div
        className={`timeline-card timeline-card-${sentimentClass} ${expanded ? "timeline-card-expanded" : ""}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="timeline-card-top">
          {/* Date */}
          <span className="timeline-date">{formatDate(event.date)}</span>

          {/* Sentiment badge */}
          <span className={`timeline-sentiment-badge timeline-badge-${sentimentClass}`}>
            {getSentimentIcon(event.sentiment)}
            {getSentimentLabel(event.sentiment)}
          </span>
        </div>

        {/* Headline */}
        <h3 className="timeline-headline">{event.headline}</h3>
        {event.source && (
          <p className="timeline-source timeline-source-inline">Source: {event.source}</p>
        )}

        {/* Expanded detail */}
        {expanded && (
          <div className="timeline-detail">
            <p className="timeline-detail-text">{event.detail}</p>
            {event.source && (
              <p className="timeline-source">
                Source: {event.source}
              </p>
            )}
          </div>
        )}

        {/* Expand toggle */}
        <button className="timeline-toggle-btn">
          {expanded ? (
            <>
              <ChevronUp size={14} />
              <span>Show less</span>
            </>
          ) : (
            <>
              <ChevronDown size={14} />
              <span>Read more</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function Timeline({ events }) {
  if (!events || events.length === 0) {
    return (
      <div className="timeline-empty">
        No timeline events found for this story.
      </div>
    );
  }

  // Sort events by date ascending
  const sorted = [...events].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  return (
    <div className="timeline-wrapper">
      {/* Legend */}
      <div className="timeline-legend">
        <span className="timeline-legend-item">
          <span className="timeline-legend-dot timeline-dot-positive" />
          Positive
        </span>
        <span className="timeline-legend-item">
          <span className="timeline-legend-dot timeline-dot-neutral" />
          Neutral
        </span>
        <span className="timeline-legend-item">
          <span className="timeline-legend-dot timeline-dot-negative" />
          Negative
        </span>
      </div>

      {/* Events */}
      <div className="timeline-list">
        {sorted.map((event, index) => (
          <TimelineEvent
            key={index}
            event={event}
            index={index}
            isLast={index === sorted.length - 1}
          />
        ))}
      </div>
    </div>
  );
}