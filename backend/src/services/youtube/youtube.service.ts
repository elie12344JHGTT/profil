import { parseIso8601Duration } from "./parse-duration.js";
import { parseVideoId } from "./parse-video-id.js";
import { YouTubeServiceError, type YouTubeVideoMetadata } from "./types.js";

const YOUTUBE_VIDEOS_ENDPOINT = "https://www.googleapis.com/youtube/v3/videos";
const REQUEST_TIMEOUT_MS = 10_000;

/** Du plus grand au plus petit. On retient la première miniature réellement fournie. */
const THUMBNAIL_PRIORITY = ["maxres", "standard", "high", "medium", "default"] as const;

/**
 * Récupère le titre, la description, la meilleure miniature et la durée
 * via `videos.list` (part=snippet,contentDetails).
 */
export async function getVideoMetadata(input: string): Promise<YouTubeVideoMetadata> {
  const videoId = parseVideoId(input);
  const apiKey = readApiKey();
  const payload = await requestVideo(videoId, apiKey);
  return toMetadata(videoId, payload);
}

export { parseIso8601Duration } from "./parse-duration.js";

function readApiKey(): string {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  if (apiKey === undefined || apiKey.length === 0) {
    throw new YouTubeServiceError(
      "MISSING_API_KEY",
      "La variable d'environnement YOUTUBE_API_KEY est absente.",
    );
  }
  return apiKey;
}

async function requestVideo(videoId: string, apiKey: string): Promise<unknown> {
  const url = new URL(YOUTUBE_VIDEOS_ENDPOINT);
  url.searchParams.set("part", "snippet,contentDetails");
  url.searchParams.set("id", videoId);
  url.searchParams.set(
    "fields",
    "items(id,snippet(title,description,thumbnails),contentDetails(duration))",
  );
  url.searchParams.set("key", apiKey);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error: unknown) {
    const timedOut = isTimeoutError(error);
    throw upstreamFailure(
      timedOut
        ? "Délai dépassé lors de l'appel à l'API YouTube."
        : "Échec réseau lors de l'appel à l'API YouTube.",
      error,
      apiKey,
    );
  }

  if (response.status === 404) {
    throw new YouTubeServiceError(
      "VIDEO_NOT_FOUND",
      `Aucune vidéo YouTube trouvée pour l'identifiant ${videoId}.`,
    );
  }

  if (!response.ok) {
    throw new YouTubeServiceError(
      "UPSTREAM_FAILURE",
      `L'API YouTube a répondu avec le statut HTTP ${response.status}.`,
    );
  }

  try {
    return await response.json();
  } catch (error: unknown) {
    throw upstreamFailure("Réponse YouTube illisible.", error, apiKey);
  }
}

function toMetadata(videoId: string, payload: unknown): YouTubeVideoMetadata {
  const items = readItems(payload);
  if (items.length === 0) {
    throw new YouTubeServiceError(
      "VIDEO_NOT_FOUND",
      `Aucune vidéo YouTube trouvée pour l'identifiant ${videoId}.`,
    );
  }

  const item = items.find((candidate) => candidate.id === videoId) ?? items[0];
  if (item === undefined || item.snippet === null) {
    throw new YouTubeServiceError(
      "UPSTREAM_FAILURE",
      "La réponse YouTube ne contient pas de titre.",
    );
  }

  const duration = item.duration;
  if (duration === null) {
    throw new YouTubeServiceError(
      "UPSTREAM_FAILURE",
      "La réponse YouTube ne contient pas de durée.",
    );
  }

  return {
    videoId,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnailUrl: pickBestThumbnail(item.snippet.thumbnails),
    durationSeconds: parseIso8601Duration(duration),
  };
}

interface ParsedSnippet {
  title: string;
  description: string;
  thumbnails: Record<string, ParsedThumbnail>;
}

interface ParsedThumbnail {
  url: string;
  width?: number;
}

interface ParsedItem {
  id: string | null;
  snippet: ParsedSnippet | null;
  duration: string | null;
}

function readItems(payload: unknown): ParsedItem[] {
  if (!isRecord(payload) || !Array.isArray(payload.items)) {
    throw new YouTubeServiceError(
      "UPSTREAM_FAILURE",
      "La réponse YouTube ne contient pas de liste de vidéos.",
    );
  }

  return payload.items.map((entry) => {
    if (!isRecord(entry)) {
      return { id: null, snippet: null, duration: null };
    }

    const id = typeof entry.id === "string" ? entry.id : null;
    const snippet = isRecord(entry.snippet) ? readSnippet(entry.snippet) : null;
    const contentDetails = isRecord(entry.contentDetails) ? entry.contentDetails : null;
    const duration =
      contentDetails !== null && typeof contentDetails.duration === "string"
        ? contentDetails.duration
        : null;

    return { id, snippet, duration };
  });
}

function readSnippet(snippet: Record<string, unknown>): ParsedSnippet | null {
  if (typeof snippet.title !== "string" || snippet.title.length === 0) {
    return null;
  }

  return {
    title: snippet.title,
    description: typeof snippet.description === "string" ? snippet.description : "",
    thumbnails: readThumbnails(snippet.thumbnails),
  };
}

function readThumbnails(value: unknown): Record<string, ParsedThumbnail> {
  if (!isRecord(value)) {
    return {};
  }

  const thumbnails: Record<string, ParsedThumbnail> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (!isRecord(entry) || typeof entry.url !== "string" || entry.url.trim().length === 0) {
      continue;
    }
    const thumbnail: ParsedThumbnail = { url: entry.url };
    if (typeof entry.width === "number" && Number.isFinite(entry.width)) {
      thumbnail.width = entry.width;
    }
    thumbnails[key] = thumbnail;
  }
  return thumbnails;
}

function pickBestThumbnail(thumbnails: Record<string, ParsedThumbnail>): string | null {
  for (const key of THUMBNAIL_PRIORITY) {
    const url = thumbnails[key]?.url;
    if (url !== undefined) {
      return url;
    }
  }

  let bestUrl: string | null = null;
  let bestWidth = -1;
  for (const thumbnail of Object.values(thumbnails)) {
    const width = thumbnail.width ?? 0;
    if (bestUrl === null || width > bestWidth) {
      bestWidth = width;
      bestUrl = thumbnail.url;
    }
  }
  return bestUrl;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
}

/**
 * Enveloppe une panne réseau sans propager l'erreur fetch.
 * Le message d'origine est recopié sans la clé API, qui voyage dans l'URL.
 */
function upstreamFailure(message: string, cause: unknown, secret: string): YouTubeServiceError {
  const raw = cause instanceof Error ? cause.message : "Erreur inconnue";
  const safe = secret.length > 0 ? raw.split(secret).join("[REDACTED]") : raw;
  return new YouTubeServiceError("UPSTREAM_FAILURE", message, {
    cause: new Error(safe),
  });
}
