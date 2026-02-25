// --- Spotify Helpers ---

export function extractPlaylistId(input: string): string | null {
  const urlMatch = input.match(/playlist[/:]([a-zA-Z0-9]+)/);
  if (urlMatch) return urlMatch[1];
  if (/^[a-zA-Z0-9]{22}$/.test(input.trim())) return input.trim();
  return null;
}

// --- Shareable link encoding/decoding ---

export interface EncodedMixtape {
  /** playlist name */
  n: string;
  /** owner display name */
  o: string;
  /** description */
  d: string;
  /** array of track IDs */
  t: string[];
}

export function encodeMixtape(mixtape: EncodedMixtape): string {
  const json = JSON.stringify(mixtape);
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function decodeMixtape(encoded: string): EncodedMixtape | null {
  try {
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";
    const json = decodeURIComponent(escape(atob(base64)));
    return JSON.parse(json);
  } catch {
    return null;
  }
}
