"use client";

import { useState } from "react";
import { extractPlaylistId, encodeMixtape } from "@/lib/spotify";

interface PlaylistPreview {
  name: string;
  owner: string;
  description: string;
  tracks: { id: string; name: string; artist: string }[];
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [playlist, setPlaylist] = useState<PlaylistPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleImport() {
    setError(null);
    setPlaylist(null);

    const playlistId = extractPlaylistId(url);
    if (!playlistId) {
      setError("Invalid playlist URL. Please paste a Spotify playlist link.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/playlist/${playlistId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to import playlist");
      setPlaylist(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load playlist."
      );
    } finally {
      setLoading(false);
    }
  }

  function getShareableLink(): string {
    if (!playlist) return "";
    const encoded = encodeMixtape({
      n: playlist.name,
      o: playlist.owner,
      d: playlist.description.replace(/<[^>]*>/g, "").slice(0, 100),
      t: playlist.tracks.map((t) => t.id),
    });
    return `${process.env.NEXT_PUBLIC_APP_URL}/listen/${encoded}`;
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(getShareableLink());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex min-h-dvh flex-col px-4 py-6 sm:px-6">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-lg items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-spotify-green">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-black">
            <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="6" cy="18" r="3" fill="currentColor" />
            <circle cx="18" cy="16" r="3" fill="currentColor" />
          </svg>
        </div>
        <span className="text-lg font-bold">Mixtape</span>
      </header>

      {/* Main */}
      <main className="mx-auto mt-10 flex w-full max-w-lg flex-1 flex-col gap-6">
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold">Create a Mixtape</h1>
          <p className="mt-1 text-sm text-spotify-light-gray">
            Paste a Spotify playlist URL to create a shareable listening experience.
            Track by track, no peeking ahead.
          </p>
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleImport()}
            placeholder="https://open.spotify.com/playlist/..."
            className="flex-1 rounded-lg border border-spotify-gray bg-spotify-dark px-4 py-3 text-sm text-white placeholder-spotify-light-gray/50 outline-none transition-colors focus:border-spotify-green"
          />
          <button
            onClick={handleImport}
            disabled={loading || !url.trim()}
            className="rounded-lg bg-spotify-green px-5 py-3 text-sm font-bold text-black transition-all hover:bg-spotify-green-light disabled:opacity-40"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
            ) : (
              "Import"
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="animate-fade-in rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Playlist Preview */}
        {playlist && (
          <div className="animate-fade-in flex flex-col gap-5">
            {/* Info */}
            <div className="rounded-xl bg-spotify-dark p-4">
              <h2 className="text-lg font-bold">{playlist.name}</h2>
              <p className="mt-1 text-sm text-spotify-light-gray">
                by {playlist.owner} &middot; {playlist.tracks.length} tracks
              </p>
            </div>

            {/* Track List */}
            <div className="rounded-xl bg-spotify-dark p-4">
              <p className="mb-3 text-sm font-semibold">Track List</p>
              <div className="flex max-h-64 flex-col gap-0.5 overflow-y-auto">
                {playlist.tracks.map((track, i) => (
                  <div
                    key={track.id}
                    className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-spotify-gray/50"
                  >
                    <span className="w-5 text-right text-xs text-spotify-light-gray">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{track.name}</p>
                      <p className="truncate text-xs text-spotify-light-gray">
                        {track.artist}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Share Link */}
            <div className="flex flex-col gap-3 rounded-xl bg-spotify-dark p-4">
              <p className="text-sm font-semibold">Shareable Link</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getShareableLink()}
                  className="flex-1 rounded-lg bg-spotify-gray px-3 py-2.5 text-sm text-spotify-light-gray outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="flex-shrink-0 rounded-lg bg-spotify-green px-4 py-2.5 text-sm font-bold text-black transition-all hover:bg-spotify-green-light active:scale-95"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-xs text-spotify-light-gray/60">
                Share this link with listeners. They&apos;ll hear each track one
                at a time, without knowing what comes next.
              </p>
            </div>

            <button
              onClick={() => { setPlaylist(null); setUrl(""); }}
              className="text-sm text-spotify-light-gray transition-colors hover:text-white"
            >
              Import another playlist
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
