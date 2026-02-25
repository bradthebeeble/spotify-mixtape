"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { EncodedMixtape } from "@/lib/spotify";

interface EmbedController {
  loadUri: (uri: string) => void;
  play: () => void;
  togglePlay: () => void;
  destroy: () => void;
  on: (event: string, callback: (data: unknown) => void) => void;
}

interface PlaybackUpdateEvent {
  data: {
    isPaused: boolean;
    isBuffering: boolean;
    duration: number;
    position: number;
  };
}

interface IFrameAPI {
  createController: (
    element: HTMLElement,
    options: { uri: string; width: string | number; height: string | number },
    callback: (controller: EmbedController) => void
  ) => void;
}

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: IFrameAPI) => void;
    __spotifyIFrameAPI?: IFrameAPI;
  }
}

export default function Player({ mixtape }: { mixtape: EncodedMixtape }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const controllerRef = useRef<EmbedController | null>(null);
  const embedRef = useRef<HTMLDivElement>(null);
  const advancingRef = useRef(false);
  const hasEndedRef = useRef(false);
  const currentIndexRef = useRef(0);

  currentIndexRef.current = currentIndex;

  const totalTracks = mixtape.t.length;
  const currentTrackId = mixtape.t[currentIndex];

  const goToTrack = useCallback(
    (targetIndex: number) => {
      if (advancingRef.current) return;
      if (targetIndex < 0 || targetIndex >= totalTracks) return;
      advancingRef.current = true;

      // Hide embed immediately, load new track while hidden
      setIsTransitioning(true);
      const trackId = mixtape.t[targetIndex];
      setCurrentIndex(targetIndex);
      hasEndedRef.current = false;
      setIsFinished(false);

      if (controllerRef.current && trackId) {
        controllerRef.current.loadUri(`spotify:track:${trackId}`);
      }

      // Reveal after the new track has had time to load
      setTimeout(() => {
        setIsTransitioning(false);
        advancingRef.current = false;
      }, 1200);
    },
    [totalTracks, mixtape.t]
  );

  const advanceTrack = useCallback(() => {
    const idx = currentIndexRef.current;
    if (idx >= totalTracks - 1) {
      setIsFinished(true);
      setIsPlaying(false);
      return;
    }
    goToTrack(idx + 1);
  }, [totalTracks, goToTrack]);

  // Load Spotify iFrame API script once
  useEffect(() => {
    if (document.querySelector('script[src*="spotify.com/embed/iframe-api"]'))
      return;
    const script = document.createElement("script");
    script.src = "https://open.spotify.com/embed/iframe-api/v1";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Initialize embed when user hits play
  useEffect(() => {
    if (!hasStarted || !currentTrackId) return;

    function createEmbed(api: IFrameAPI) {
      if (!embedRef.current) return;
      embedRef.current.innerHTML = "";

      api.createController(
        embedRef.current,
        {
          uri: `spotify:track:${currentTrackId}`,
          width: "100%",
          height: 352,
        },
        (controller) => {
          controllerRef.current = controller;

          controller.on("playback_update", (e: unknown) => {
            const { isPaused, duration, position } =
              (e as PlaybackUpdateEvent).data;

            setIsPlaying(!isPaused);

            if (
              duration > 0 &&
              position > 0 &&
              position >= duration - 1500 &&
              !hasEndedRef.current
            ) {
              hasEndedRef.current = true;
              advanceTrack();
            }
          });
        }
      );
    }

    if (window.__spotifyIFrameAPI) {
      createEmbed(window.__spotifyIFrameAPI);
      return;
    }

    window.onSpotifyIframeApiReady = (api) => {
      window.__spotifyIFrameAPI = api;
      createEmbed(api);
    };
  }, [hasStarted]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Landing screen ---
  if (!hasStarted) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6">
        <div className="animate-fade-in flex w-full max-w-sm flex-col items-center gap-8 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-spotify-gray shadow-2xl">
            <svg
              viewBox="0 0 24 24"
              className="h-12 w-12 text-spotify-green"
              fill="currentColor"
            >
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>

          <div>
            <h1 className="text-2xl font-bold">{mixtape.n}</h1>
            <p className="mt-1 text-sm text-spotify-light-gray">
              {totalTracks} tracks &middot; by {mixtape.o}
            </p>
            {mixtape.d && (
              <p className="mt-2 text-xs text-spotify-light-gray/70">
                {mixtape.d}
              </p>
            )}
          </div>

          <button
            onClick={() => setHasStarted(true)}
            className="animate-pulse-glow flex h-16 w-16 items-center justify-center rounded-full bg-spotify-green transition-transform hover:scale-110 active:scale-95"
          >
            <svg
              viewBox="0 0 24 24"
              className="ml-1 h-7 w-7 text-black"
              fill="currentColor"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>

          <p className="text-xs text-spotify-light-gray/60">
            Each track plays in order. No peeking ahead, no skipping — just
            listen.
          </p>
        </div>
      </div>
    );
  }

  // --- Finished screen ---
  if (isFinished) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6">
        <div className="animate-fade-in flex w-full max-w-sm flex-col items-center gap-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-spotify-gray">
            <svg
              viewBox="0 0 24 24"
              className="h-10 w-10 text-spotify-green"
              fill="currentColor"
            >
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold">End of Mixtape</h1>
            <p className="mt-2 text-sm text-spotify-light-gray">
              You&apos;ve listened to all {totalTracks} tracks of &ldquo;
              {mixtape.n}&rdquo;.
            </p>
          </div>
          <button
            onClick={() => goToTrack(0)}
            className="rounded-full bg-spotify-green px-8 py-3 font-bold text-black transition-all hover:scale-105 hover:bg-spotify-green-light active:scale-95"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  // --- Now playing screen ---
  return (
    <div className="relative flex min-h-dvh flex-col">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-spotify-gray/60 via-spotify-black to-spotify-black" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-spotify-green">
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-black">
              <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="6" cy="18" r="3" fill="currentColor" />
              <circle cx="18" cy="16" r="3" fill="currentColor" />
            </svg>
          </div>
          <span className="text-sm font-bold text-spotify-light-gray">Mixtape</span>
        </div>
        <span className="rounded-full bg-spotify-gray/80 px-3 py-1 text-xs font-medium text-spotify-light-gray">
          {currentIndex + 1} / {totalTracks}
        </span>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-6">
        {/* Transition overlay */}
        {isTransitioning && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-spotify-black/90">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-spotify-green border-t-transparent" />
              <p className="text-sm text-spotify-light-gray">Next track...</p>
            </div>
          </div>
        )}

        {/* Playback status */}
        <div className="flex items-center gap-2 text-xs text-spotify-light-gray/50">
          {isPlaying ? (
            <>
              <span className="flex gap-0.5">
                <span className="inline-block h-3 w-0.5 animate-bounce bg-spotify-green [animation-delay:0ms]" />
                <span className="inline-block h-3 w-0.5 animate-bounce bg-spotify-green [animation-delay:150ms]" />
                <span className="inline-block h-3 w-0.5 animate-bounce bg-spotify-green [animation-delay:300ms]" />
              </span>
              Now playing
            </>
          ) : (
            "Paused"
          )}
        </div>

        {/* Single track Spotify Embed — shows album art, name, artist, play/pause */}
        <div
          className={`w-full max-w-sm overflow-hidden rounded-xl transition-all duration-500 ${
            isTransitioning ? "scale-95 opacity-0" : "scale-100 opacity-100"
          }`}
        >
          <div ref={embedRef} />
        </div>

        {/* Skip controls */}
        <div className="flex items-center gap-8">
          <button
            onClick={() => goToTrack(currentIndex - 1)}
            disabled={currentIndex === 0 || isTransitioning}
            className="text-spotify-light-gray transition-colors hover:text-white disabled:text-spotify-gray"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
              <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
            </svg>
          </button>
          <button
            onClick={() => goToTrack(currentIndex + 1)}
            disabled={currentIndex >= totalTracks - 1 || isTransitioning}
            className="text-spotify-light-gray transition-colors hover:text-white disabled:text-spotify-gray"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>

        {/* Spotify login hint */}
        <p className="mt-auto pt-4 text-[11px] text-spotify-light-gray/40">
          Only hearing previews?{" "}
          <a
            href="https://accounts.spotify.com/login"
            target="_blank"
            rel="noopener noreferrer"
            className="underline transition-colors hover:text-spotify-green"
          >
            Log in to Spotify
          </a>{" "}
          for full tracks.
        </p>

        {/* Playlist name */}
        <p className="pt-1 text-[11px] text-spotify-light-gray/30">
          {mixtape.n}
        </p>
      </main>
    </div>
  );
}
