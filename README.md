# Crawler Separation Fairness

Google can run multiple crawler identities across indexing and training, which creates an asymmetric advantage when policies blur the line between search and model training. This project makes that risk concrete by modeling crawler separation policies and scoring how fair, explicit, and enforceable they are. The core idea: if a site wants a fair Internet, it must treat indexing and training as distinct, independently governed activities.

## What this does

- Validates a policy document that separates indexing from training user agents
- Detects overlapping crawlers across groups
- Scores fairness based on separation, explicit training rules, and parity
- Produces a clear summary for audits or governance reviews

## Quick start

```bash
npm install
npm run lint
npm test
```

Generate a sample policy:

```bash
node src/cli.js sample examples/sample-policy.json
```

Evaluate a policy:

```bash
node src/cli.js evaluate examples/sample-policy.json
```

Output as JSON:

```bash
node src/cli.js evaluate examples/sample-policy.json --format json
```

## Policy model

A policy defines:

- `site`: the domain being governed
- `userAgents`: groups like `indexing` and `training`
- `rules`: allow/disallow paths per group

Example:

```json
{
  "site": "example.com",
  "principle": "separation",
  "userAgents": {
    "indexing": ["Googlebot", "Bingbot"],
    "training": ["Google-Extended", "CCBot"]
  },
  "rules": [
    {
      "group": "indexing",
      "allow": ["/"],
      "disallow": ["/private"]
    },
    {
      "group": "training",
      "allow": ["/public"],
      "disallow": ["/"]
    }
  ]
}
```

## Why this matters

When training and indexing are not clearly separated, the strongest platforms can exploit ambiguous rules. A fair Internet requires explicit boundaries, clear crawler identities, and rules that treat training as a distinct, opt-in activity. This tool is a small step toward making that standard measurable.

## License

MIT
