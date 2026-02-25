import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const res = await fetch(
      `https://open.spotify.com/embed/playlist/${id}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
      }
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: "Playlist not found" },
        { status: 404 }
      );
    }

    const html = await res.text();

    // Extract JSON data from the page's inline script
    const scripts = html.match(/<script[^>]*>([\s\S]*?)<\/script>/g) || [];
    let entity: Record<string, unknown> | null = null;

    for (const script of scripts) {
      const content = script.replace(/<\/?script[^>]*>/g, "");
      if (content.includes('"pageProps"')) {
        try {
          const data = JSON.parse(content);
          entity = data?.props?.pageProps?.state?.data?.entity;
          break;
        } catch {
          // not valid JSON, skip
        }
      }
    }

    if (!entity) {
      return NextResponse.json(
        { error: "Could not parse playlist data" },
        { status: 500 }
      );
    }

    const trackList = (entity.trackList as Array<{
      uri: string;
      title: string;
      subtitle: string;
    }>) || [];

    if (trackList.length === 0) {
      return NextResponse.json(
        { error: "Playlist is empty" },
        { status: 404 }
      );
    }

    // Extract track IDs from URIs like "spotify:track:67dq3DrvWYhXVKrHYl9s4m"
    const tracks = trackList.map((t) => ({
      id: t.uri.split(":").pop()!,
      name: t.title,
      artist: t.subtitle,
    }));

    return NextResponse.json({
      name: entity.name as string,
      owner: (entity.subtitle as string) || "",
      description: (entity.description as string) || "",
      tracks,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch playlist" },
      { status: 500 }
    );
  }
}
