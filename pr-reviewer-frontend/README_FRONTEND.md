# PR Reviewer ⚡ — Frontend

AI-powered GitHub Pull Request code review assistant.

## Quick Start

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

## Tech Stack

- **React 18** + **Vite** — fast dev experience
- **Axios** — API calls to the backend at `http://localhost:3001`
- **react-hot-toast** — toast notifications
- **react-syntax-highlighter** — code highlighting (available for Phase 2 features)
- **Vanilla CSS** — minimal, monochrome design system

## UI Layout

```
┌─────────────────────────────────────┐
│          PR Reviewer ⚡              │
│  AI-powered code review for your PRs │
│                                     │
│  ┌─────────────────────┬──────────┐ │
│  │ PR URL input        │ Analyze  │ │
│  └─────────────────────┴──────────┘ │
│                                     │
│  ── After review ──                 │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ PR Title         Score: [72]    ││
│  │ @author · main ← feature       ││
│  │ +45 −12  3 files               ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ 📋 What Changed                 ││
│  │ Summary paragraphs…             ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ 🐛 Issues Found                 ││
│  │ [High] Missing null check…  ▾   ││
│  │ [Med]  Unused import…       ▾   ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ ✨ Suggestions                   ││
│  │ PERFORMANCE  Use memoization…   ││
│  │ READABILITY  Extract helper…    ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

## Backend Dependency

The frontend expects the backend running at `http://localhost:3001`. See `../pr-reviewer-backend/README_BACKEND.md` for setup instructions.

## API Contract

```
POST /api/review
  Body: { "prUrl": "https://github.com/owner/repo/pull/123" }
  Returns: { pr, summary, bugs, improvements, score }
```
