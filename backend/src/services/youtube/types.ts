/** Métadonnées utiles pour créer un épisode à partir d'une vidéo YouTube. */
export interface YouTubeVideoMetadata {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  durationSeconds: number;
}

export type YouTubeErrorCode =
  | "INVALID_VIDEO_ID"
  | "MISSING_API_KEY"
  | "VIDEO_NOT_FOUND"
  | "UPSTREAM_FAILURE";

/**
 * Erreur métier du service YouTube.
 * Les appelants ne reçoivent jamais l'erreur brute de fetch.
 */
export class YouTubeServiceError extends Error {
  readonly code: YouTubeErrorCode;

  constructor(
    code: YouTubeErrorCode,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "YouTubeServiceError";
    this.code = code;
  }
}
