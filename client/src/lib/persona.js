const PERSONAS = {
  expert: {
    id: "expert",
    label: "Expert investor",
    tone: `Use technical financial terminology. Assume strong knowledge of markets, valuation ratios, derivatives, and financial instruments. Be analytical, data-driven, and concise. Skip basic explanations.`,
    timelineDepth: "Include technical market signals, price movements, and regulatory filings where relevant.",
    contrarianFocus: "Surface non-consensus institutional views, contrarian analyst calls, and overlooked technical signals.",
  },
  beginner: {
    id: "beginner",
    label: "First-time investor",
    tone: `Use simple, jargon-free language. Explain every financial term the first time it is used. Use real-world analogies and relatable examples. Be encouraging, patient, and clear. Avoid acronyms without explanation.`,
    timelineDepth: "Explain why each event matters in plain language. Focus on human impact and everyday relevance.",
    contrarianFocus: "Surface overlooked perspectives that explain the story differently without assuming financial background.",
  },
  professional: {
    id: "professional",
    label: "Business professional",
    tone: `Focus on strategic business implications, competitive dynamics, and industry-level impact. Use professional but accessible language. Highlight what this means for business strategy, market positioning, and stakeholders.`,
    timelineDepth: "Emphasise strategic decisions, leadership moves, competitive responses, and business model implications.",
    contrarianFocus: "Surface strategic blind spots, underreported competitive threats, and second-order business implications.",
  },
};

export function getPersona() {
  const saved = localStorage.getItem("et_persona");
  return PERSONAS[saved] || PERSONAS["professional"]; // default to professional
}

export function getPersonaTone() {
  return getPersona().tone;
}

export function getAllPersonas() {
  return Object.values(PERSONAS);
}