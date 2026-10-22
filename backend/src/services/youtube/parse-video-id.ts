import { YouTubeServiceError } from "./types.js";

/** Identifiant vidéo YouTube : 11 caractères parmi lettres, chiffres, « _ » et « - ». */
const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "youtu.be",
  "www.youtu.be",
]);

const SHORT_HOSTS = new Set(["youtu.be", "www.youtu.be"]);

/** Préfixes de chemin qui portent l'identifiant dans le segment suivant. */
const PATH_ID_PREFIXES = new Set(["shorts", "embed", "live"]);

/**
 * Accepte un identifiant brut ou une URL YouTube.
 * Formes reconnues : watch?v=, youtu.be/, /shorts/, /embed/, /live/.
 * Tout le reste lève `INVALID_VIDEO_ID`.
 */
export function parseVideoId(input: string): string {
  if (typeof input !== "string") {
    throw invalidVideoId("");
  }

  const trimmed = input.trim();
  if (trimmed.length === 0) {
    throw invalidVideoId(input);
  }

  if (VIDEO_ID_PATTERN.test(trimmed)) {
    return trimmed;
  }

  const url = toUrl(trimmed);
  if (url === null || !isSupportedHttpUrl(url)) {
    throw invalidVideoId(trimmed);
  }

  const host = url.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(host)) {
    throw invalidVideoId(trimmed);
  }

  if (SHORT_HOSTS.has(host)) {
    return requireVideoId(singleSegment(url.pathname), trimmed);
  }

  const pathname = url.pathname.toLowerCase();
  if (pathname === "/watch" || pathname === "/watch/") {
    return requireVideoId(url.searchParams.get("v"), trimmed);
  }

  const segments = url.pathname.split("/").filter((segment) => segment.length > 0);
  const prefix = segments[0]?.toLowerCase();
  const candidate = segments[1];
  if (
    prefix !== undefined &&
    PATH_ID_PREFIXES.has(prefix) &&
    segments.length === 2 &&
    candidate !== undefined
  ) {
    return requireVideoId(candidate, trimmed);
  }

  throw invalidVideoId(trimmed);
}

function toUrl(value: string): URL | null {
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
  try {
    return new URL(withScheme);
  } catch {
    return null;
  }
}

function isSupportedHttpUrl(url: URL): boolean {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return false;
  }
  if (url.username.length > 0 || url.password.length > 0) {
    return false;
  }
  return true;
}

function singleSegment(pathname: string): string | null {
  const segments = pathname.split("/").filter((segment) => segment.length > 0);
  if (segments.length !== 1) {
    return null;
  }
  return segments[0] ?? null;
}

function requireVideoId(candidate: string | null | undefined, source: string): string {
  if (candidate === null || candidate === undefined || !VIDEO_ID_PATTERN.test(candidate)) {
    throw invalidVideoId(source);
  }
  return candidate;
}

function invalidVideoId(input: string): YouTubeServiceError {
  const preview = input.trim().slice(0, 200);
  const detail = preview.length > 0 ? ` : « ${preview} »` : "";
  return new YouTubeServiceError(
    "INVALID_VIDEO_ID",
    `Identifiant ou URL YouTube invalide${detail}.`,
  );
}
