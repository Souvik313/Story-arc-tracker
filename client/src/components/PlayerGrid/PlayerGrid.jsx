import { User, Building2, AlertTriangle, ThumbsUp, Minus, ThumbsDown } from "lucide-react";
import "./PlayerGrid.css";

function getStanceConfig(stance) {
  switch (stance?.toLowerCase()) {
    case "positive":
      return {
        label: "Positive",
        className: "playergrid-stance-positive",
        icon: <ThumbsUp size={11} />,
      };
    case "negative":
      return {
        label: "Negative",
        className: "playergrid-stance-negative",
        icon: <ThumbsDown size={11} />,
      };
    case "controversial":
      return {
        label: "Controversial",
        className: "playergrid-stance-controversial",
        icon: <AlertTriangle size={11} />,
      };
    default:
      return {
        label: "Neutral",
        className: "playergrid-stance-neutral",
        icon: <Minus size={11} />,
      };
  }
}

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

function getAvatarClass(index) {
  const classes = [
    "playergrid-avatar-blue",
    "playergrid-avatar-teal",
    "playergrid-avatar-purple",
    "playergrid-avatar-amber",
    "playergrid-avatar-rose",
    "playergrid-avatar-indigo",
  ];
  return classes[index % classes.length];
}

function PlayerCard({ player, index }) {
  const stance = getStanceConfig(player.stance);
  const initials = getInitials(player.name);

  return (
    <div className="playergrid-card">
      <div className="playergrid-card-top">
        {/* Avatar */}
        <div className={`playergrid-avatar ${getAvatarClass(index)}`}>
          {initials}
        </div>

        {/* Name + role */}
        <div className="playergrid-info">
          <h3 className="playergrid-name">{player.name}</h3>
          <p className="playergrid-role">{player.role}</p>
        </div>

        {/* Stance badge */}
        <span className={`playergrid-stance-badge ${stance.className}`}>
          {stance.icon}
          {stance.label}
        </span>
      </div>

      {/* Note */}
      {player.note && (
        <p className="playergrid-note">{player.note}</p>
      )}
    </div>
  );
}

export default function PlayerGrid({ players }) {
  if (!players || players.length === 0) {
    return (
      <div className="playergrid-empty">
        No key players identified for this story.
      </div>
    );
  }

  return (
    <div className="playergrid-wrapper">
      {players.map((player, index) => (
        <PlayerCard key={index} player={player} index={index} />
      ))}
    </div>
  );
}