import { Lightbulb, Eye, ChevronRight } from "lucide-react";
import "./ContrarianPanel.css";

function ContrarianCard({ item, type, index }) {
  if (type === "contrarian") {
    return (
      <div className="contrarian-card contrarian-card-amber">
        <div className="contrarian-card-top">
          <span className="contrarian-index">{index + 1}</span>
          <Lightbulb size={14} className="contrarian-icon-amber" />
        </div>
        <h3 className="contrarian-angle">{item.angle}</h3>
        <p className="contrarian-reasoning">{item.reasoning}</p>
      </div>
    );
  }

  return (
    <div className="contrarian-card contrarian-card-teal">
      <div className="contrarian-card-top">
        <span className="contrarian-index contrarian-index-teal">{index + 1}</span>
        <Eye size={14} className="contrarian-icon-teal" />
      </div>
      <h3 className="contrarian-signal">{item.signal}</h3>
      <div className="contrarian-implication-row">
        <ChevronRight size={13} className="contrarian-chevron" />
        <p className="contrarian-implication">{item.implication}</p>
      </div>
    </div>
  );
}

export default function ContrarianPanel({ items, type }) {
  if (!items || items.length === 0) {
    return (
      <div className="contrarian-empty">
        No {type === "contrarian" ? "contrarian views" : "watch signals"} found.
      </div>
    );
  }

  return (
    <div className="contrarian-wrapper">
      {items.map((item, index) => (
        <ContrarianCard key={index} item={item} type={type} index={index} />
      ))}
    </div>
  );
}