// hooks/use-fetch.js
"use client";

import { useState, useCallback } from "react";

export default function useFetch(apiFunction) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fn = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      setData(null);
      
      try {
        const result = await apiFunction(...args);
        setData(result);
        return result;
      } catch (err) {
        const errorMessage = err.message || "An error occurred";
        setError(errorMessage);
        console.error("API Error:", err);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [apiFunction]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    loading,
    data,
    error,
    fn,
    reset,
    setData,
    setError,
  };
}
