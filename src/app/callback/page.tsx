"use client";

import { useEffect, useState } from "react";
import { exchangeCodeForToken } from "@/lib/spotify";

export default function Callback() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const authError = params.get("error");

      if (authError) {
        setError(`Authorization denied: ${authError}`);
        return;
      }

      if (!code) {
        setError("No authorization code received.");
        return;
      }

      const verifier = localStorage.getItem("spotify_code_verifier");
      if (!verifier) {
        setError("Missing code verifier. Please try logging in again.");
        return;
      }

      try {
        const tokenData = await exchangeCodeForToken(code, verifier);
        localStorage.setItem(
          "spotify_access_token",
          tokenData.access_token
        );
        localStorage.setItem(
          "spotify_refresh_token",
          tokenData.refresh_token
        );
        localStorage.setItem(
          "spotify_token_expiry",
          String(Date.now() + tokenData.expires_in * 1000)
        );
        localStorage.removeItem("spotify_code_verifier");
        window.location.href = "/admin";
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Token exchange failed."
        );
      }
    }

    handleCallback();
  }, []);

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <div className="animate-fade-in flex max-w-sm flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
            <svg
              className="h-8 w-8 text-red-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M15 9l-6 6M9 9l6 6" />
            </svg>
          </div>
          <p className="text-red-400">{error}</p>
          <a
            href="/"
            className="mt-2 rounded-full bg-spotify-gray px-6 py-2 text-sm font-semibold transition-colors hover:bg-spotify-light-gray/20"
          >
            Try Again
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-spotify-green border-t-transparent" />
        <p className="text-spotify-light-gray">Connecting to Spotify...</p>
      </div>
    </div>
  );
}
