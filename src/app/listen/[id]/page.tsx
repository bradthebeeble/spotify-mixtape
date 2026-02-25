"use client";

import { use } from "react";
import { decodeMixtape } from "@/lib/spotify";
import Player from "./Player";

interface Props {
  params: Promise<{ id: string }>;
}

export default function ListenPage({ params }: Props) {
  const { id } = use(params);
  const mixtape = decodeMixtape(id);

  if (!mixtape) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <div className="flex max-w-sm flex-col items-center gap-4">
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
          <h1 className="text-xl font-bold">Invalid mixtape link</h1>
          <p className="text-sm text-spotify-light-gray">
            This link appears to be broken or expired. Ask the person who shared
            it to generate a new one.
          </p>
        </div>
      </div>
    );
  }

  return <Player mixtape={mixtape} />;
}
