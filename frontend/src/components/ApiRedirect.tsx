"use client";

import { useEffect } from "react";

/**
 * Keeps the existing local API URLs working in production without changing
 * the predictor UI code. In Vercel, /api/* is routed to the FastAPI service.
 */
export default function ApiRedirect() {
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      if (typeof input === "string" && input.startsWith("http://localhost:8000/")) {
        input = input.replace("http://localhost:8000", "");
      }
      return originalFetch(input, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
