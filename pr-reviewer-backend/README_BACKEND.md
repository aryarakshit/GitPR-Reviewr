# PR Reviewer — Backend

AI-powered GitHub Pull Request review assistant. Accepts a PR URL, fetches the diff from GitHub, sends it to **Gemini AI** for analysis, and returns a structured code review with bugs, security issues, complexity scores, improvements, and a quality score.

## Quick Start

### 1. Install dependencies

```bash
cd pr-reviewer-backend
npm install
```

### 2. Create your `.env` file

```bash
cp .env.example .env
```

Edit `.env` and fill in your keys:

```
GEMINI_API_KEY=AIza...
GITHUB_TOKEN=ghp_...       # optional but recommended
PORT=3001
```

### 3. Get your API keys

#### Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy the key and paste it into your `.env` as `GEMINI_API_KEY`

> **Note:** With a Gemini Pro subscription you get higher rate limits and access to `gemini-2.5-pro`.

#### GitHub Personal Access Token (optional, avoids rate limits)
1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Select the `public_repo` scope (that's all you need for public PRs)
4. Copy the token and paste it into your `.env` as `GITHUB_TOKEN`

> **Without a GitHub token:** You're limited to 60 API requests/hour.  
> **With a token:** 5,000 requests/hour.

### 4. Start the server

```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

The server starts on `http://localhost:3001`.

## API Endpoints

### Health Check

```
GET /api/health
→ { "status": "ok" }
```

### Submit PR for Review

```
POST /api/review
Content-Type: application/json

{ "prUrl": "https://github.com/owner/repo/pull/123" }
```

**Response:**
```json
{
  "pr": {
    "title": "Fix memory leak in connection pool",
    "author": "octocat",
    "base": "main",
    "head": "fix/memory-leak",
    "additions": 45,
    "deletions": 12,
    "files": 3
  },
  "summary": "This PR addresses a memory leak...",
  "bugs": [
    {
      "file": "src/pool.js",
      "line": "42-45",
      "severity": "high",
      "issue": "Connection not closed on error path",
      "suggestion": "Add a finally block to ensure cleanup"
    }
  ],
  "improvements": [
    {
      "category": "Performance",
      "description": "Consider using a WeakMap for caching",
      "codeSnippet": "const cache = new WeakMap();"
    }
  ],
  "score": 72,
  "securityIssues": [
    {
      "file": "src/config.js",
      "line": "12",
      "type": "hardcoded-secret",
      "severity": "critical",
      "description": "API key hardcoded in source",
      "remediation": "Move to environment variable"
    }
  ],
  "complexityScores": [
    {
      "file": "src/pool.js",
      "before": 8.5,
      "after": 12.0,
      "delta": 3.5,
      "verdict": "degraded"
    }
  ],
  "diff": "diff --git a/src/pool.js b/src/pool.js\n..."
}
```

### Error Responses

| Status | Meaning |
|--------|---------|
| 400 | Invalid or missing PR URL |
| 404 | PR not found (bad URL or private repo) |
| 429 | GitHub API rate limit exceeded |
| 500 | Internal server error |

## Test with curl

```bash
curl -X POST http://localhost:3001/api/review \
  -H "Content-Type: application/json" \
  -d '{"prUrl":"https://github.com/facebook/react/pull/31000"}'
```

## Project Structure

```
pr-reviewer-backend/
├── .env.example            # Environment variable template
├── .gitignore
├── package.json
├── README_BACKEND.md
└── src/
    ├── server.js            # Express app entry point
    ├── routes/
    │   └── review.js        # POST /api/review handler
    ├── services/
    │   ├── githubService.js  # GitHub API integration
    │   └── aiService.js      # Gemini AI integration (review + security scan)
    ├── middleware/
    │   └── errorHandler.js   # Global error handler
    └── utils/
        ├── diffParser.js     # Diff truncation & filename extraction
        └── complexityAnalyzer.js  # Per-file complexity scoring
```

## Phase 2 Features (Backend)

| Feature | Status | Description |
|---------|--------|-------------|
| 🔐 Security Scan | ✅ | Second AI call scans for vulnerabilities |
| 📊 Complexity Scores | ✅ | Per-file complexity delta analysis |
| 🌙 Diff Viewer | ✅ | Raw diff included in response |
| 📄 PDF Export | N/A | Frontend-only feature |

## Frontend Integration

The frontend (built separately) connects to this server at `http://localhost:3001`.

- CORS is pre-configured for `http://localhost:5173` (Vite default), `http://localhost:5174`, and `http://localhost:3000`
- The API contract is defined in the shared prompt document
- Start the backend first, then the frontend
