# Cloudflare Infrastructure & Agent

This directory manages Borneostack's Cloudflare services, edge workers, and autonomous operations.

## Architecture

1. **Email Routing & Inbound Handler**:
   - `email()` worker intercepts incoming emails to `@borneostack.com`.
   - Passes parsed emails to the agent or triggers autonomous actions.
2. **Outbound Email**:
   - Cloudflare Workers native `send_email` binding for zero-cost transactional/reply emails.
3. **Cloudflare MCP Integration**:
   - Uses the official Cloudflare MCP endpoint: `https://mcp.cloudflare.com/mcp`
   - Gives AI agents dynamic code-mode access to DNS records, Workers, Pages, and WAF rules.
4. **Cloudflare Agents SDK**:
   - Edge-native stateful agent using Cloudflare Durable Objects + SQLite for long-running memory and scheduled alarms.

## Quick Start with Wrangler

```bash
# Install Wrangler globally or locally
npm install -g wrangler

# Login to Cloudflare account
wrangler login

# Deploy edge worker
wrangler deploy
```
