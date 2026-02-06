const assert = require("assert").strict;
const {
  scoreFairness,
  summarizePolicy,
  validateSeparation
} = require("../src/engine.js");

describe("validateSeparation", () => {
  const basePolicy = {
    site: "example.com",
    userAgents: {
      indexing: ["Googlebot", "Bingbot"],
      training: ["Google-Extended"],
      other: ["DuckDuckBot"]
    },
    rules: [
      {
        group: "indexing",
        allow: ["/"],
        disallow: ["/private"]
      },
      {
        group: "training",
        allow: ["/public"],
        disallow: ["/"]
      }
    ]
  };

  it("returns ok when groups do not overlap", () => {
    const result = validateSeparation(basePolicy);
    assert.equal(result.ok, true);
    assert.equal(result.overlaps.length, 0);
  });

  it("detects overlaps between groups", () => {
    const policy = {
      ...basePolicy,
      userAgents: {
        ...basePolicy.userAgents,
        training: ["Googlebot", "Google-Extended"]
      }
    };
    const result = validateSeparation(policy);
    assert.equal(result.ok, false);
    assert.equal(result.overlaps.length, 1);
    assert.deepEqual(result.overlaps[0].agents, ["Googlebot"]);
  });
});

describe("scoreFairness", () => {
  const basePolicy = {
    site: "example.com",
    userAgents: {
      indexing: ["Googlebot", "Bingbot"],
      training: ["Google-Extended"]
    },
    rules: [
      {
        group: "indexing",
        allow: ["/"],
        disallow: ["/private"]
      },
      {
        group: "training",
        allow: ["/public"],
        disallow: ["/"]
      }
    ]
  };

  it("awards full separation score when no overlaps", () => {
    const result = scoreFairness(basePolicy);
    assert.ok(result.score >= 80);
    assert.equal(result.breakdown.separation, 40);
  });

  it("reduces score when training is missing", () => {
    const policy = { ...basePolicy, rules: [basePolicy.rules[0]] };
    const result = scoreFairness(policy);
    assert.ok(result.score < 80);
    assert.equal(result.breakdown.explicitTraining, 0);
  });
});

describe("summarizePolicy", () => {
  it("returns a structured summary", () => {
    const summary = summarizePolicy({
      site: "example.com",
      userAgents: { indexing: ["Googlebot"], training: ["Google-Extended"] },
      rules: [
        { group: "indexing", allow: ["/"], disallow: [] },
        { group: "training", allow: ["/public"], disallow: ["/"] }
      ]
    });
    assert.equal(summary.site, "example.com");
    assert.equal(summary.separationOk, true);
    assert.ok(summary.groupRules.indexing.allow.length > 0);
  });
});
