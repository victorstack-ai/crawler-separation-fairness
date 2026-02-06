const assert = require("assert").strict;
const { validatePolicyShape } = require("../src/policy.js");

const validPolicy = {
  site: "example.com",
  userAgents: {
    indexing: ["Googlebot"],
    training: ["Google-Extended"]
  },
  rules: [
    {
      group: "indexing",
      allow: ["/"],
      disallow: []
    }
  ]
};

describe("validatePolicyShape", () => {
  it("accepts a valid policy", () => {
    assert.deepEqual(validatePolicyShape(validPolicy), validPolicy);
  });

  it("rejects missing required fields", () => {
    assert.throws(() => validatePolicyShape({}), /Missing required field/);
  });

  it("rejects non-array rules", () => {
    const invalid = { ...validPolicy, rules: "nope" };
    assert.throws(() => validatePolicyShape(invalid), /Policy.rules/);
  });
});
