import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

export const useStoryArc = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep , setLoadingStep] = useState(null);
  const [error, setError] = useState(null);
  const [articles , setArticles] = useState([]);

  const search = async (topic, ) => {
    setLoading(true);
    setData(null);
    setError(null);
    setArticles([]);

    const personaId = localStorage.getItem("et_persona") || "professional";

    try {
      // Step 1 — fetch articles from Tavily via Express
      setLoadingStep("Fetching and extracting entities...");
      const ingestRes = await fetch(`${API_URL}/api/v1/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });

      if (!ingestRes.ok) {
        throw new Error(`Ingestion failed: ${ingestRes.status}`);
      }

      const ingestData = await ingestRes.json();

      if (!ingestData.articles || ingestData.articles.length === 0) {
        throw new Error("No articles found for this topic.");
      }
      setArticles(ingestData.articles);

      // Step 2 — send articles and persona profile to analysis route
      setLoadingStep("Building timeline and tagging sentiment...");
      const analyseRes = await fetch(`${API_URL}/api/v1/analyse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, articles: ingestData.articles, entities: ingestData.entities }),
      });

      if (!analyseRes.ok) {
        throw new Error(`Analysis failed: ${analyseRes.status}`);
      }

      const analyseData = await analyseRes.json();

     

      // Step 3 — fallback to pre-fetched demo JSON
      setLoadingStep("Personalizing for your profile...");
      const personaliseRes = await fetch(`${API_URL}/api/v1/personalize` , {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          storyData: analyseData,
          persona: personaId,
        })
      });

      if(!personaliseRes.ok) {
        throw new Error(`Personalization failed: ${personaliseRes.status}`);
      }

      const finalData = await personaliseRes.json();
      setData(finalData);
  } catch(err) {
    console.warn("Live pipeline failed, falling back to demo data. Error:", err.message);

    try{
      const slug = topic.
        toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0 , 40);
      const fallbackRes = await import(`../demo/${slug}.json`);
      setData(fallbackRes.default);

    } catch(error) {
      setError("Could not load this story. Please check your connection and try again." , error);
    }
  } finally {
    setLoading(false);
    setLoadingStep(null);
  }};

  const reset = () => {
    setData(null);
    setError(null);
    setLoading(false);
    setLoadingStep(null);
    setArticles([]);
  };

  return { data, loading, loadingStep , error, search, reset , articles };
}