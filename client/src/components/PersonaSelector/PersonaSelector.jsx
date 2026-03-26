import { useState, useEffect } from "react";
import { TrendingUp, BookOpen, Briefcase, CheckCircle } from "lucide-react";
import "./PersonaSelector.css";

const PERSONAS = [
  {
    id: "expert",
    label: "Expert investor",
    icon: <TrendingUp size={20} />,
    description: "I actively trade and follow markets closely",
    tone: "Use technical financial terminology. Assume knowledge of markets, ratios, and instruments. Be analytical and data-driven.",
  },
  {
    id: "beginner",
    label: "First-time investor",
    icon: <BookOpen size={20} />,
    description: "I am new to investing and finance",
    tone: "Use simple, jargon-free language. Explain financial terms when used. Use analogies and examples. Be encouraging and clear.",
  },
  {
    id: "professional",
    label: "Business professional",
    icon: <Briefcase size={20} />,
    description: "I follow business news for work and strategy",
    tone: "Focus on business strategy, competitive dynamics, and industry impact. Use professional but accessible language. Highlight strategic implications.",
  },
];

export default function PersonaSelector({ onPersonaChange }) {
  const [selected, setSelected] = useState(null);
  const [saved, setSaved] = useState(false);

  // Load saved persona from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("et_persona");
    if (saved) {
      const persona = PERSONAS.find((p) => p.id === saved);
      if (persona) {
        setSelected(persona);
        onPersonaChange?.(persona);
      }
    }
  }, []);

  const handleSelect = (persona) => {
    setSelected(persona);
    localStorage.setItem("et_persona", persona.id);
    onPersonaChange?.(persona);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="persona-wrapper">
      <p className="persona-heading">Who are you?</p>
      <p className="persona-subheading">
        Your story arcs will be tailored to your background
      </p>

      <div className="persona-grid">
        {PERSONAS.map((persona) => (
          <button
            key={persona.id}
            className={`persona-card ${selected?.id === persona.id ? "persona-card-active" : ""}`}
            onClick={() => handleSelect(persona)}
          >
            <div className={`persona-icon ${selected?.id === persona.id ? "persona-icon-active" : ""}`}>
              {persona.icon}
            </div>
            <div className="persona-text">
              <span className="persona-label">{persona.label}</span>
              <span className="persona-desc">{persona.description}</span>
            </div>
            {selected?.id === persona.id && (
              <CheckCircle size={16} className="persona-check" />
            )}
          </button>
        ))}
      </div>

      {saved && (
        <p className="persona-saved">
          Preference saved — your story arcs will now be personalised
        </p>
      )}
    </div>
  );
}