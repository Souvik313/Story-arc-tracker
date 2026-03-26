import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

export const useVernacularVideo = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateVideo = async (articleText, sourceTitle = null, targetLang = 'hi') => {
    if (!articleText || typeof articleText !== 'string' || articleText.trim().length < 120) {
      throw new Error('Article text must be at least 120 characters long');
    }

    setLoading(true);
    setData(null);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/v1/vernacular-video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleText: articleText.trim(),
          sourceTitle,
          targetLang
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
      return result;

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setData(null);
    setError(null);
    setLoading(false);
  };

  return {
    data,
    loading,
    error,
    generateVideo,
    reset
  };
};