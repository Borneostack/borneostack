# Social Media Engine & Agent

This directory manages Borneostack's social media presence, autonomous posting agents, content calendars, and market research.

## Recommended Agent: ElizaOS / CrewAI

1. **ElizaOS (Autonomous Social Persona)**:
   - Dedicated clients for X (Twitter), Telegram, Discord, and LinkedIn.
   - Persona file: `borneostack.character.json` defining tone, knowledge, and style.
   - Autonomous replies, thread generation, and community interaction.

2. **Market & Competitor Intelligence via Firecrawl**:
   - `firecrawl search "tech trends in Borneo cloud computing"`
   - `firecrawl scrape <competitor_url> -o research.md`
   - Automatically drafts relevant insights and thought leadership posts based on real-time web intelligence.

## Folder Contents

- `character.json`: AI brand persona and voice configuration.
- `content/`: Drafts, weekly scheduled posts, and media assets.
- `campaigns/`: Multi-channel marketing campaigns.
