# PR Reviewer — Backend

Express API server that accepts a GitHub PR URL, fetches the diff via the GitHub API, runs parallel AI analysis via Groq, and returns a structured code review.

## Quick Start

### 1. Install dependencies

```bash
cd pr-reviewer-backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
GROQ_API_KEY=gsk_...          # Required — get one at console.groq.com
GITHUB_TOKEN=ghp_...          # Optional — raises GitHub rate limit to 5 000 req/hr
PORT=3005
CORS_ORIGIN=http://localhost:5173
```

### 3. Start the server

```bash
npm run dev    # Development (auto-restart on changes)
npm start      # Production
```

Server runs on `http://localhost:3005`.

## API Endpoints

### `GET /api/health`
```json
{ "status": "ok" }
```

### `POST /api/review`
```json
{ "prUrl": "https://github.com/owner/repo/pull/123" }
```

Runs four AI analyses in parallel:
- Code review (bugs, improvements, quality score)
- Security scan (secrets, injection, XSS, etc.)
- Impact analysis (downstream risk, merge blockers)
- Test coverage gaps

Also computes per-file complexity delta from the diff.

Rate limited to **10 requests / minute / IP**.

### `GET /api/repo-prs?owner=:owner&repo=:repo`

Returns open PRs for a given repository.

## Error Responses

| Status | Meaning |
|---|---|
| 400 | Invalid or missing `prUrl` |
| 404 | PR not found (bad URL or private repo) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

## Project Structure

```
pr-reviewer-backend/
├── .env.example
├── package.json
└── src/
    ├── server.js                  # Express app, middleware, routes
    ├── routes/
    │   ├── review.js              # POST /api/review
    │   └── repoPrs.js             # GET /api/repo-prs
    ├── services/
    │   ├── githubService.js       # GitHub API — PR metadata + diff
    │   └── aiService.js           # Groq AI — all four analyses
    ├── middleware/
    │   └── errorHandler.js        # Global error handler
    └── utils/
        ├── diffParser.js          # Diff truncation & filename extraction
        └── complexityAnalyzer.js  # Per-file complexity scoring
```

## AI Model

Uses **Groq** with `qwen/qwen3-32b` at `temperature: 0.2`. All four analyses run as separate API calls with a 45-second timeout each.

Get a free Groq API key at [console.groq.com](https://console.groq.com).
