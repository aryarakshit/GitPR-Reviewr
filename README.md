# GitHub PR Review Assistant

An AI-powered GitHub Pull Request reviewer. Paste any public GitHub PR URL and get an instant, structured code review — including bug detection, security scanning, complexity scoring, test gap analysis, and merge impact assessment.

## Features

| Feature | Description |
|---|---|
| **AI Summary** | Human-friendly overview of what changed and why |
| **Bug Detection** | Flags potential errors and logical flaws with file + line references |
| **Security Scan** | Identifies hardcoded secrets, SQL injection, XSS, and other vulnerabilities |
| **Complexity Score** | Per-file complexity delta (before vs. after the PR) |
| **Test Gap Analysis** | Finds modified source files with no corresponding test changes |
| **Impact Analysis** | Maps affected modules and flags downstream merge risk |
| **PDF Export** | Export the full review as a PDF from the browser |

## Tech Stack

**Frontend** — React 19, Vite, Framer Motion, Lucide React, react-syntax-highlighter, jsPDF

**Backend** — Node.js, Express 5, Groq SDK (`qwen/qwen3-32b`), Axios, Helmet, express-rate-limit

## Project Structure

```
GitHub PR Review Assistant/
├── package.json                  # Root workspace (runs both servers concurrently)
├── pr-reviewer-backend/
│   ├── .env.example
│   ├── src/
│   │   ├── server.js             # Express entry point (port 3005)
│   │   ├── routes/
│   │   │   ├── review.js         # POST /api/review
│   │   │   └── repoPrs.js        # GET /api/repo-prs
│   │   ├── services/
│   │   │   ├── githubService.js  # GitHub API integration
│   │   │   └── aiService.js      # Groq AI — review, security, impact, test coverage
│   │   ├── middleware/
│   │   │   └── errorHandler.js
│   │   └── utils/
│   │       ├── diffParser.js
│   │       └── complexityAnalyzer.js
└── pr-reviewer-frontend/
    └── src/
        ├── App.jsx
        ├── components/           # ReviewForm, ReviewResult, BugList, DiffViewer, …
        └── utils/
            └── exportPDF.js
```

## Getting Started

### Prerequisites

- Node.js >= 16
- A [Groq API key](https://console.groq.com/) (free tier available)
- A GitHub Personal Access Token (optional, but raises the API rate limit from 60 → 5 000 req/hr)

### 1. Clone and install

```bash
git clone https://github.com/your-username/github-pr-review-assistant.git
cd github-pr-review-assistant
npm run install:all
```

### 2. Configure environment variables

```bash
cp pr-reviewer-backend/.env.example pr-reviewer-backend/.env
```

Edit `pr-reviewer-backend/.env`:

```env
GROQ_API_KEY=gsk_...          # Required — get one at console.groq.com
GITHUB_TOKEN=ghp_...          # Optional — github.com/settings/tokens (public_repo scope)
PORT=3005                     # Optional — defaults to 3005
CORS_ORIGIN=http://localhost:5173   # Optional — for deployed frontends
```

### 3. Run in development

```bash
npm run dev
```

This starts both the backend (`:3005`) and frontend (`:5173`) concurrently with colour-coded output.

| Command | Description |
|---|---|
| `npm run dev` | Start both servers (hot reload) |
| `npm run dev:backend` | Backend only |
| `npm run dev:frontend` | Frontend only |
| `npm start` | Production mode (both servers) |

### 4. Open the app

Navigate to `http://localhost:5173`, paste any public GitHub PR URL, and click **Review PR**.

## API Reference

### `GET /api/health`
Returns `{ "status": "ok" }`.

### `POST /api/review`

```json
{ "prUrl": "https://github.com/owner/repo/pull/123" }
```

Returns a structured review object:

```json
{
  "pr": { "title": "…", "author": "…", "additions": 45, "deletions": 12, "files": 3 },
  "summary": "…",
  "score": 82,
  "bugs": [{ "file": "…", "line": "42", "severity": "warning", "issue": "…", "suggestion": "…" }],
  "improvements": [{ "category": "Performance", "description": "…", "codeSnippet": "…" }],
  "securityIssues": [{ "file": "…", "type": "hardcoded-secret", "severity": "critical", "description": "…", "remediation": "…" }],
  "impactAreas": [{ "area": "…", "riskLevel": "high", "couldBreak": "…", "remediation": "…" }],
  "mergeBlockers": ["…"],
  "testGaps": [{ "file": "…", "reason": "…", "suggestedTestFile": "…" }],
  "complexityScores": [{ "file": "…", "before": 8.5, "after": 12.0, "delta": 3.5, "verdict": "degraded" }],
  "diff": "diff --git …"
}
```

Rate limited to **10 requests per minute** per IP.

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GROQ_API_KEY` | Yes | — | Groq API key for AI analysis |
| `GITHUB_TOKEN` | No | — | GitHub PAT for higher API rate limits |
| `PORT` | No | `3005` | Backend server port |
| `CORS_ORIGIN` | No | `localhost:5173,5174,3000` | Comma-separated allowed origins |

## License

MIT
