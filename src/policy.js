const fs = require("fs");
const path = require("path");

const REQUIRED_TOP_LEVEL = ["site", "userAgents", "rules"];

function loadPolicyFromFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw);
  return validatePolicyShape(parsed);
}

function validatePolicyShape(policy) {
  if (!policy || typeof policy !== "object") {
    throw new Error("Policy must be an object.");
  }

  for (const key of REQUIRED_TOP_LEVEL) {
    if (!(key in policy)) {
      throw new Error(`Missing required field: ${key}.`);
    }
  }

  if (typeof policy.site !== "string" || policy.site.trim().length === 0) {
    throw new Error("Policy.site must be a non-empty string.");
  }

  if (!policy.userAgents || typeof policy.userAgents !== "object") {
    throw new Error("Policy.userAgents must be an object with group arrays.");
  }

  const groupNames = Object.keys(policy.userAgents);
  if (groupNames.length === 0) {
    throw new Error("Policy.userAgents must define at least one group.");
  }

  for (const [group, agents] of Object.entries(policy.userAgents)) {
    if (!Array.isArray(agents)) {
      throw new Error(`Policy.userAgents.${group} must be an array.`);
    }
    if (agents.some((agent) => typeof agent !== "string")) {
      throw new Error(`Policy.userAgents.${group} must contain only strings.`);
    }
  }

  if (!Array.isArray(policy.rules) || policy.rules.length === 0) {
    throw new Error("Policy.rules must be a non-empty array.");
  }

  for (const rule of policy.rules) {
    if (!rule || typeof rule !== "object") {
      throw new Error("Each rule must be an object.");
    }
    if (typeof rule.group !== "string") {
      throw new Error("Each rule requires a group string.");
    }
    if (!Array.isArray(rule.allow) && !Array.isArray(rule.disallow)) {
      throw new Error("Each rule must include allow or disallow arrays.");
    }
  }

  return policy;
}

function resolvePolicyPath(filePath) {
  if (!filePath) {
    throw new Error("Policy path required.");
  }
  return path.resolve(process.cwd(), filePath);
}

module.exports = {
  loadPolicyFromFile,
  resolvePolicyPath,
  validatePolicyShape
};
