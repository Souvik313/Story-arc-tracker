import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";
import "./RelatedStories.css";

export default function RelatedStories({ topic }) {
  const [relatedTopics, setRelatedTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

  useEffect(() => {
    const fetchRelatedTopics = async () => {
      if (!topic) return;

      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/v1/related`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch related topics");
        }

        const data = await response.json();
        setRelatedTopics(data.relatedTopics || []);
      } catch (err) {
        console.warn("Failed to fetch related topics:", err.message);
        // Silently fail - this is non-critical
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedTopics();
  }, [topic, API_URL]);

  const handlePillClick = (relatedTopic) => {
    navigate("/story", {
      state: { topic: relatedTopic },
    });
  };

  if (!relatedTopics || relatedTopics.length === 0) {
    return null;
  }

  return (
    <div className="related-stories-wrapper">
      <div className="related-stories-container">
        <div className="related-stories-header">
          <Zap size={16} className="related-stories-icon" />
          <p className="related-stories-text">
            You read <span className="related-stories-highlight">{topic}</span>
            {" — also explore:"}
          </p>
        </div>

        <div className="related-stories-pills">
          {relatedTopics.map((item, index) => (
            <button
              key={index}
              className="related-stories-pill"
              onClick={() => handlePillClick(item.topic)}
              title={item.reason}
            >
              <span className="related-stories-pill-text">{item.topic}</span>
              <span className="related-stories-pill-arrow">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
