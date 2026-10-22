import { YouTubeServiceError } from "./types.js";

/**
 * Durée YouTube `contentDetails.duration` : sous-ensemble ISO 8601 `PT#H#M#S`.
 * Au moins un composant est requis (`PT15M33S`, `PT45S`, `PT1H`, `PT1H30S`).
 * Une valeur illisible est une réponse amont inutilisable.
 */
const ISO_8601_DURATION = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;

export function parseIso8601Duration(isoDuration: string): number {
  const trimmed = isoDuration.trim();
  const match = ISO_8601_DURATION.exec(trimmed);
  const hoursRaw = match?.[1];
  const minutesRaw = match?.[2];
  const secondsRaw = match?.[3];

  if (
    match === null ||
    (hoursRaw === undefined && minutesRaw === undefined && secondsRaw === undefined)
  ) {
    throw invalidDuration(trimmed);
  }

  const hours = hoursRaw === undefined ? 0 : Number(hoursRaw);
  const minutes = minutesRaw === undefined ? 0 : Number(minutesRaw);
  const seconds = secondsRaw === undefined ? 0 : Number(secondsRaw);

  if (
    !Number.isSafeInteger(hours) ||
    !Number.isSafeInteger(minutes) ||
    !Number.isSafeInteger(seconds)
  ) {
    throw invalidDuration(trimmed);
  }

  const total = hours * 3600 + minutes * 60 + seconds;
  if (!Number.isSafeInteger(total)) {
    throw invalidDuration(trimmed);
  }

  return total;
}

function invalidDuration(value: string): YouTubeServiceError {
  const preview = value.slice(0, 64);
  return new YouTubeServiceError(
    "UPSTREAM_FAILURE",
    `Durée ISO 8601 YouTube invalide : « ${preview} ».`,
  );
}
