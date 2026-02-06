const SCORE_WEIGHTS = {
  separation: 40,
  explicitTraining: 40,
  parity: 20
};

function uniqueList(list) {
  return Array.from(new Set(list));
}

function sanitizePaths(list = []) {
  return list.filter((path) => typeof path === "string" && path.length > 0);
}

function buildGroupMap(policy) {
  const groupMap = new Map();
  for (const [group, agents] of Object.entries(policy.userAgents)) {
    groupMap.set(group, uniqueList(agents));
  }
  return groupMap;
}

function findOverlaps(groupMap) {
  const overlaps = [];
  const entries = Array.from(groupMap.entries());
  for (let i = 0; i < entries.length; i += 1) {
    const [groupA, agentsA] = entries[i];
    for (let j = i + 1; j < entries.length; j += 1) {
      const [groupB, agentsB] = entries[j];
      const overlap = agentsA.filter((agent) => agentsB.includes(agent));
      if (overlap.length > 0) {
        overlaps.push({ groupA, groupB, agents: overlap });
      }
    }
  }
  return overlaps;
}

function validateSeparation(policy) {
  const groupMap = buildGroupMap(policy);
  const overlaps = findOverlaps(groupMap);
  return {
    ok: overlaps.length === 0,
    overlaps
  };
}

function groupRuleIndex(policy) {
  const index = new Map();
  for (const rule of policy.rules) {
    if (!index.has(rule.group)) {
      index.set(rule.group, { allow: [], disallow: [] });
    }
    const entry = index.get(rule.group);
    entry.allow.push(...sanitizePaths(rule.allow));
    entry.disallow.push(...sanitizePaths(rule.disallow));
  }
  for (const [group, entry] of index.entries()) {
    index.set(group, {
      allow: uniqueList(entry.allow),
      disallow: uniqueList(entry.disallow)
    });
  }
  return index;
}

function scoreFairness(policy) {
  const separation = validateSeparation(policy);
  const ruleIndex = groupRuleIndex(policy);
  const hasTraining = ruleIndex.has("training");
  const hasIndexing = ruleIndex.has("indexing");

  const separationScore = separation.ok ? SCORE_WEIGHTS.separation : 0;
  const explicitTrainingScore = hasTraining ? SCORE_WEIGHTS.explicitTraining : 0;

  let parityScore = 0;
  if (hasTraining && hasIndexing) {
    const training = ruleIndex.get("training");
    const indexing = ruleIndex.get("indexing");
    const trainingDisallow = training.disallow.length;
    const indexingDisallow = indexing.disallow.length;
    const imbalance = Math.max(0, trainingDisallow - indexingDisallow);
    const parityFactor = Math.max(
      0,
      1 - imbalance / Math.max(1, trainingDisallow + indexingDisallow)
    );
    parityScore = Math.round(SCORE_WEIGHTS.parity * parityFactor);
  }

  const score = separationScore + explicitTrainingScore + parityScore;

  return {
    score,
    breakdown: {
      separation: separationScore,
      explicitTraining: explicitTrainingScore,
      parity: parityScore
    },
    separation
  };
}

function summarizePolicy(policy) {
  const ruleIndex = groupRuleIndex(policy);
  const groups = Array.from(ruleIndex.keys());
  const separation = validateSeparation(policy);
  const fairness = scoreFairness(policy);

  return {
    site: policy.site,
    groups,
    separationOk: separation.ok,
    overlaps: separation.overlaps,
    fairnessScore: fairness.score,
    breakdown: fairness.breakdown,
    groupRules: Object.fromEntries(ruleIndex.entries())
  };
}

module.exports = {
  buildGroupMap,
  findOverlaps,
  scoreFairness,
  summarizePolicy,
  validateSeparation
};
