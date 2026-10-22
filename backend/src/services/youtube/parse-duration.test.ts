import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseIso8601Duration } from "./parse-duration.js";
import { YouTubeServiceError } from "./types.js";

describe("parseIso8601Duration", () => {
  it("convertit les combinaisons PT#H#M#S en secondes", () => {
    const cases: Array<[string, number]> = [
      ["PT0S", 0],
      ["PT45S", 45],
      ["PT1M", 60],
      ["PT15M33S", 15 * 60 + 33],
      ["PT1H", 3600],
      ["PT1H2M3S", 3600 + 120 + 3],
      ["PT1H30S", 3600 + 30],
      ["PT2H5M", 2 * 3600 + 5 * 60],
      ["PT10H10M10S", 10 * 3600 + 10 * 60 + 10],
      ["PT0H0M0S", 0],
      ["PT01H02M03S", 3723],
      ["  PT4M13S  ", 4 * 60 + 13],
    ];

    for (const [iso, seconds] of cases) {
      assert.equal(parseIso8601Duration(iso), seconds, iso);
    }
  });

  it("rejette une durée absente ou hors du sous-ensemble YouTube", () => {
    const rejected = ["", "PT", "P1D", "P1DT1H", "15M", "PT1H2M3S4", "pt1h2m3s", "PT1.5S", "PT-1S"];

    for (const iso of rejected) {
      assert.throws(
        () => parseIso8601Duration(iso),
        (error: unknown) => {
          assert.ok(error instanceof YouTubeServiceError);
          assert.equal(error.code, "UPSTREAM_FAILURE");
          return true;
        },
        iso,
      );
    }
  });
});
