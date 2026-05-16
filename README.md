<h1 align="center">🐕‍🦺 Style Sniffer</h1>

<p align="center">
  English | <a href="README.zh-CN.md">中文</a>
</p>

Extract visual design DNA into structured style prompts. The hosted page works for screenshots/images; URL and HTML analysis should be run locally.

## Quick Start

Hosted image-only page:

[https://cool-lamington-b047c4.netlify.app](https://cool-lamington-b047c4.netlify.app)

For full URL / HTML analysis, download the GitHub project, install dependencies, and start the local web server:

```bash
npm install
npm run web
```

Then open `http://localhost:3000`.

Requires Node.js 18+.

## Usage

### CLI

To use the `style-sniffer` command from this project folder:

```bash
npm install -g .
```

```bash
# Extract design from a URL
style-sniffer sniff example.com

# Save JSON + prompt to output/
style-sniffer sniff example.com --save --prompt

# Output raw JSON only
style-sniffer sniff example.com --json-only

# Mobile viewport
style-sniffer sniff example.com --mobile

# Show schema
style-sniffer schema

# Generate prompt from existing JSON
style-sniffer generate profile.json --format prompt
```

### Agent Skill

Install to your AI agent:

```bash
npx skills add style-sniffer
```

Then ask your agent: *"Extract the style from example.com"*

### Web UI

```bash
npm install
npm run web
```

Opens at `http://localhost:3000`

## Three-Phase Workflow

| Phase | Input | Output |
|-------|-------|--------|
| **Structure** | — | Full schema with field descriptions |
| **Analyze** | URL / image / screenshot | Design Profile JSON |
| **Generate** | JSON + content | Style Prompt (.md) / CSS Variables / HTML |

## What Gets Extracted

- **Colors** — palette, primary/secondary/accent, semantic colors
- **Typography** — fonts, scale, weights, line heights
- **Spacing** — density, rhythm, base unit
- **Radius** — border-radius patterns and philosophy
- **Shadows** — elevation levels and style
- **Borders** — usage patterns and divider styles
- **Components** — buttons, cards, inputs, navigation
- **Style** — mood, genre, composition, visual language
- **Effects** — scroll, cursor, glassmorphism, particles

## Project Structure

```
style-sniffer/
├── bin/cli.js              # CLI entry
├── lib/
│   ├── extract/from-url.js # URL extraction (Playwright)
│   ├── generate/
│   │   ├── to-prompt-md.js # JSON → Style Prompt
│   │   └── to-css-vars.js  # JSON → CSS Variables
│   └── schema/             # Schema definition
├── references/
│   ├── schema.md           # Full schema docs
│   └── generation-guide.md # Generation rules
├── web/                    # Web UI
├── SKILL.md                # Agent Skill entry
└── package.json
```

## License

MIT
