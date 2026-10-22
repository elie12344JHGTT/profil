import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseVideoId } from "./parse-video-id.js";
import { YouTubeServiceError } from "./types.js";

const ID = "dQw4w9WgXcQ";
const ID_WITH_SYMBOLS = "a1B2c3D4e-_";

describe("parseVideoId", () => {
  it("accepte un identifiant brut de 11 caractères", () => {
    assert.equal(parseVideoId(ID), ID);
    assert.equal(parseVideoId(ID_WITH_SYMBOLS), ID_WITH_SYMBOLS);
  });

  it("conserve la casse et ignore les espaces autour de l'identifiant", () => {
    assert.equal(parseVideoId(`  ${ID}  `), ID);
  });

  it("lit watch?v= sur les hôtes YouTube courants", () => {
    const urls = [
      `https://www.youtube.com/watch?v=${ID}`,
      `https://youtube.com/watch?v=${ID}&t=43`,
      `http://m.youtube.com/watch?v=${ID}`,
      `https://music.youtube.com/watch?feature=share&v=${ID}`,
      `HTTPS://WWW.YOUTUBE.COM/watch?v=${ID}#t=10`,
      `www.youtube.com/watch?v=${ID}`,
      `youtube.com/watch?v=${ID}&ab_channel=exemple`,
    ];

    for (const url of urls) {
      assert.equal(parseVideoId(url), ID, url);
    }
  });

  it("lit youtu.be, shorts, embed et live", () => {
    const urls = [
      `https://youtu.be/${ID}`,
      `https://youtu.be/${ID}?t=12`,
      `https://youtu.be/${ID}/`,
      `https://www.youtube.com/shorts/${ID}`,
      `https://www.youtube.com/shorts/${ID}?feature=share`,
      `https://youtube.com/embed/${ID}?start=30`,
      `https://www.youtube-nocookie.com/embed/${ID}`,
      `https://www.youtube.com/live/${ID}/`,
      `https://www.youtube.com/live/${ID}?feature=share`,
    ];

    for (const url of urls) {
      assert.equal(parseVideoId(url), ID, url);
    }
  });

  it("rejette le bruit, les hôtes étrangers et les identifiants mal formés", () => {
    const rejected = [
      "",
      "   ",
      "abc",
      "abcdefghijkl",
      "dQw4w9WgXc",
      "bonjour le monde",
      `https://vimeo.com/${ID}`,
      `https://exemple.com/watch?v=${ID}`,
      `https://youtu.be.evil.com/${ID}`,
      "https://www.youtube.com/watch",
      "https://www.youtube.com/watch?v=",
      "https://www.youtube.com/watch?v=tropcourt",
      "https://www.youtube.com/playlist?list=PL123",
      "https://youtu.be/",
      "https://youtu.be/dQw4w9WgXcQ/extra",
      "https://www.youtube.com/shorts/",
      "https://www.youtube.com/embed/",
      "https://www.youtube.com/live/",
      "javascript:alert(1)",
      `https://user:pass@www.youtube.com/watch?v=${ID}`,
      `https://youtu.be/${ID}&feature=share`,
    ];

    for (const input of rejected) {
      assert.throws(
        () => parseVideoId(input),
        (error: unknown) => {
          assert.ok(error instanceof YouTubeServiceError);
          assert.equal(error.code, "INVALID_VIDEO_ID");
          assert.equal(error.name, "YouTubeServiceError");
          return true;
        },
        input,
      );
    }
  });
});
