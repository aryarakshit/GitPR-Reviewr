# PR Reviewer — Frontend

React + Vite frontend for the GitHub PR Review Assistant.

## Setup

```bash
cd pr-reviewer-frontend
npm install
npm run dev
```

Runs on `http://localhost:5173` by default. The backend must be running on `:3005`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

## Key Dependencies

- **React 19** + **Vite 8**
- **Framer Motion** — page and card animations
- **react-syntax-highlighter** — diff viewer
- **jsPDF** + **html2canvas** — PDF export
- **DOMPurify** — sanitize AI-generated HTML
- **lucide-react** — icons
- **react-hot-toast** — notifications
