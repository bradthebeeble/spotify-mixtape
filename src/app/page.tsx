"use client";

import { useEffect, useState } from "react";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  getAuthUrl,
} from "@/lib/spotify";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("spotify_access_token");
    if (token) setIsLoggedIn(true);
  }, []);

  async function handleLogin() {
    const verifier = generateCodeVerifier();
    localStorage.setItem("spotify_code_verifier", verifier);
    const challenge = await generateCodeChallenge(verifier);
    window.location.href = getAuthUrl(challenge);
  }

  if (isLoggedIn) {
    window.location.href = "/admin";
    return null;
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="animate-fade-in flex w-full max-w-sm flex-col items-center gap-8 text-center">
        {/* Logo / Icon */}
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-spotify-green">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-10 w-10 text-black"
          >
            <path
              d="M9 18V5l12-2v13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="6" cy="18" r="3" fill="currentColor" />
            <circle cx="18" cy="16" r="3" fill="currentColor" />
          </svg>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mixtape</h1>
          <p className="mt-2 text-spotify-light-gray">
            Turn any Spotify playlist into a surprise listening experience.
            Track by track, no peeking ahead.
          </p>
        </div>

        <button
          onClick={handleLogin}
          className="flex w-full items-center justify-center gap-3 rounded-full bg-spotify-green px-8 py-3.5 text-base font-bold text-black transition-all hover:scale-105 hover:bg-spotify-green-light active:scale-95"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
          Log in with Spotify
        </button>

        <p className="text-xs text-spotify-light-gray/60">
          You&apos;ll be redirected to Spotify to authorize access to your
          playlists.
        </p>
      </div>
    </div>
  );
}
