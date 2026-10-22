import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { YouTubeServiceError } from "./types.js";
import { getVideoMetadata } from "./youtube.service.js";

const ORIGINAL_FETCH = globalThis.fetch;
const ORIGINAL_KEY = process.env.YOUTUBE_API_KEY;

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
  if (ORIGINAL_KEY === undefined) {
    delete process.env.YOUTUBE_API_KEY;
  } else {
    process.env.YOUTUBE_API_KEY = ORIGINAL_KEY;
  }
});

describe("getVideoMetadata", () => {
  it("refuse un identifiant invalide avant tout appel réseau", async () => {
    process.env.YOUTUBE_API_KEY = "clef-test";
    let called = false;
    globalThis.fetch = (async () => {
      called = true;
      return new Response("{}", { status: 200 });
    }) as typeof fetch;

    await assertRejects("pas une url", "INVALID_VIDEO_ID");
    assert.equal(called, false);
  });

  it("signale une clé API manquante", async () => {
    delete process.env.YOUTUBE_API_KEY;
    await assertRejects("dQw4w9WgXcQ", "MISSING_API_KEY");
  });

  it("retourne les métadonnées et la miniature la plus grande", async () => {
    process.env.YOUTUBE_API_KEY = "clef-test";
    globalThis.fetch = (async (input: Parameters<typeof fetch>[0]) => {
      const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
      assert.equal(`${url.origin}${url.pathname}`, "https://www.googleapis.com/youtube/v3/videos");
      assert.equal(url.searchParams.get("part"), "snippet,contentDetails");
      assert.equal(url.searchParams.get("id"), "dQw4w9WgXcQ");
      assert.equal(url.searchParams.get("key"), "clef-test");
      assert.match(url.searchParams.get("fields") ?? "", /contentDetails\(duration\)/);

      return Response.json({
        items: [
          {
            id: "dQw4w9WgXcQ",
            snippet: {
              title: "Titre",
              description: "Description",
              thumbnails: {
                default: { url: "https://i.ytimg.com/default.jpg", width: 120 },
                high: { url: "https://i.ytimg.com/high.jpg", width: 480 },
                maxres: { url: "https://i.ytimg.com/maxres.jpg", width: 1280 },
              },
            },
            contentDetails: { duration: "PT1H2M3S" },
          },
        ],
      });
    }) as typeof fetch;

    const metadata = await getVideoMetadata("https://youtu.be/dQw4w9WgXcQ");
    assert.deepEqual(metadata, {
      videoId: "dQw4w9WgXcQ",
      title: "Titre",
      description: "Description",
      thumbnailUrl: "https://i.ytimg.com/maxres.jpg",
      durationSeconds: 3723,
    });
  });

  it("retombe sur la miniature disponible si maxres est absente", async () => {
    process.env.YOUTUBE_API_KEY = "clef-test";
    globalThis.fetch = (async () =>
      Response.json({
        items: [
          {
            id: "dQw4w9WgXcQ",
            snippet: {
              title: "Titre",
              thumbnails: {
                maxres: {},
                default: { url: "https://i.ytimg.com/default.jpg", width: 120 },
              },
            },
            contentDetails: { duration: "PT45S" },
          },
        ],
      })) as typeof fetch;

    const metadata = await getVideoMetadata("dQw4w9WgXcQ");
    assert.equal(metadata.thumbnailUrl, "https://i.ytimg.com/default.jpg");
    assert.equal(metadata.description, "");
    assert.equal(metadata.durationSeconds, 45);
  });

  it("traite une liste vide comme une vidéo introuvable", async () => {
    process.env.YOUTUBE_API_KEY = "clef-test";
    globalThis.fetch = (async () => Response.json({ items: [] })) as typeof fetch;
    await assertRejects("dQw4w9WgXcQ", "VIDEO_NOT_FOUND");
  });

  it("enveloppe un délai, une panne réseau, un HTTP 500 et un 404", async () => {
    process.env.YOUTUBE_API_KEY = "clef-secrete";

    globalThis.fetch = (async () => {
      const error = new Error("The operation was aborted due to timeout");
      error.name = "TimeoutError";
      throw error;
    }) as typeof fetch;
    const timeout = await capture("dQw4w9WgXcQ");
    assert.equal(timeout.code, "UPSTREAM_FAILURE");
    assert.match(timeout.message, /Délai dépassé/);
    assert.ok(!(timeout instanceof TypeError));

    globalThis.fetch = (async () => {
      throw new TypeError(
        "fetch failed https://www.googleapis.com/youtube/v3/videos?key=clef-secrete",
      );
    }) as typeof fetch;
    const network = await capture("dQw4w9WgXcQ");
    assert.equal(network.code, "UPSTREAM_FAILURE");
    assert.match(network.message, /Échec réseau/);
    assert.equal(network.message.includes("clef-secrete"), false);
    const cause = network.cause;
    assert.ok(cause instanceof Error);
    assert.equal(cause.message.includes("clef-secrete"), false);
    assert.match(cause.message, /\[REDACTED\]/);

    globalThis.fetch = (async () => new Response("erreur", { status: 500 })) as typeof fetch;
    const http = await capture("dQw4w9WgXcQ");
    assert.equal(http.code, "UPSTREAM_FAILURE");
    assert.match(http.message, /500/);

    globalThis.fetch = (async () => new Response("introuvable", { status: 404 })) as typeof fetch;
    const missing = await capture("dQw4w9WgXcQ");
    assert.equal(missing.code, "VIDEO_NOT_FOUND");
  });

  it("signale une réponse JSON invalide ou sans durée", async () => {
    process.env.YOUTUBE_API_KEY = "clef-test";

    globalThis.fetch = (async () =>
      new Response("pas du json", {
        status: 200,
        headers: { "content-type": "application/json" },
      })) as typeof fetch;
    const invalid = await capture("dQw4w9WgXcQ");
    assert.equal(invalid.code, "UPSTREAM_FAILURE");

    globalThis.fetch = (async () =>
      Response.json({
        items: [{ id: "dQw4w9WgXcQ", snippet: { title: "Titre" }, contentDetails: {} }],
      })) as typeof fetch;
    const missingDuration = await capture("dQw4w9WgXcQ");
    assert.equal(missingDuration.code, "UPSTREAM_FAILURE");
    assert.match(missingDuration.message, /durée/);
  });
});

async function assertRejects(
  input: string,
  code: YouTubeServiceError["code"],
): Promise<void> {
  const error = await capture(input);
  assert.equal(error.code, code);
}

async function capture(input: string): Promise<YouTubeServiceError> {
  try {
    await getVideoMetadata(input);
  } catch (error: unknown) {
    assert.ok(error instanceof YouTubeServiceError);
    return error;
  }
  assert.fail("une erreur YouTubeServiceError était attendue");
}
