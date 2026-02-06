#!/usr/bin/env node
const fs = require("fs");
const {
  loadPolicyFromFile,
  resolvePolicyPath,
  summarizePolicy,
  validatePolicyShape
} = require("./index.js");

const HELP = `crawl-sep

Usage:
  crawl-sep evaluate <policy.json> [--format json]
  crawl-sep sample <path>
  crawl-sep help
`;

function logError(message) {
  console.error(`Error: ${message}`);
}

function writeSample(filePath) {
  const sample = {
    site: "example.com",
    principle: "separation",
    userAgents: {
      indexing: ["Googlebot", "Bingbot"],
      training: ["Google-Extended", "CCBot"],
      other: ["DuckDuckBot"]
    },
    rules: [
      {
        group: "indexing",
        allow: ["/"],
        disallow: ["/private", "/paywall"]
      },
      {
        group: "training",
        allow: ["/public"],
        disallow: ["/"]
      },
      {
        group: "other",
        allow: ["/"],
        disallow: ["/private"]
      }
    ]
  };

  fs.writeFileSync(filePath, `${JSON.stringify(sample, null, 2)}\n`, "utf8");
}

function formatSummary(summary, format) {
  if (format === "json") {
    return JSON.stringify(summary, null, 2);
  }

  const lines = [];
  lines.push(`Site: ${summary.site}`);
  lines.push(`Groups: ${summary.groups.join(", ")}`);
  lines.push(`Separation OK: ${summary.separationOk ? "yes" : "no"}`);
  if (!summary.separationOk) {
    lines.push("Overlaps:");
    for (const overlap of summary.overlaps) {
      lines.push(`- ${overlap.groupA} + ${overlap.groupB}: ${overlap.agents.join(", ")}`);
    }
  }
  lines.push(`Fairness score: ${summary.fairnessScore}`);
  lines.push("Breakdown:");
  lines.push(`- separation: ${summary.breakdown.separation}`);
  lines.push(`- explicitTraining: ${summary.breakdown.explicitTraining}`);
  lines.push(`- parity: ${summary.breakdown.parity}`);
  return lines.join("\n");
}

function parseFormat(args) {
  const formatIndex = args.indexOf("--format");
  if (formatIndex === -1) {
    return "text";
  }
  return args[formatIndex + 1] || "text";
}

function main() {
  const [command, pathArg, ...rest] = process.argv.slice(2);
  const format = parseFormat(rest);

  if (!command || command === "help" || command === "--help") {
    console.log(HELP);
    return;
  }

  if (command === "sample") {
    if (!pathArg) {
      logError("Provide a path for the sample policy.");
      process.exit(1);
    }
    const filePath = resolvePolicyPath(pathArg);
    writeSample(filePath);
    console.log(`Sample policy written to ${filePath}`);
    return;
  }

  if (command === "evaluate") {
    if (!pathArg) {
      logError("Provide a policy JSON file.");
      process.exit(1);
    }
    const filePath = resolvePolicyPath(pathArg);
    const policy = loadPolicyFromFile(filePath);
    const summary = summarizePolicy(policy);
    console.log(formatSummary(summary, format));
    return;
  }

  if (command === "validate") {
    if (!pathArg) {
      logError("Provide a policy JSON file.");
      process.exit(1);
    }
    const filePath = resolvePolicyPath(pathArg);
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    validatePolicyShape(raw);
    console.log("Policy is valid.");
    return;
  }

  logError("Unknown command.");
  console.log(HELP);
  process.exit(1);
}

main();
