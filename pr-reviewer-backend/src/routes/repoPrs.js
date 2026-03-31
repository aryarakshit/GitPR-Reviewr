const express = require('express');
const { fetchRepoPRs } = require('../services/githubService');

const router = express.Router();

// Matches any GitHub URL containing owner/repo, with optional extra path/query
const GITHUB_REPO_PATTERN = /^https?:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:[/?#].*)?$/;

/**
 * GET /api/repo-prs?repoUrl=https://github.com/owner/repo
 *
 * Returns a list of open pull requests for the given public GitHub repo.
 * Accepts full repo URLs with any extra path segments stripped automatically.
 */
router.get('/', async (req, res, next) => {
  try {
    const { repoUrl } = req.query;

    if (!repoUrl || typeof repoUrl !== 'string') {
      const err = new Error('Missing required query param: repoUrl');
      err.statusCode = 400;
      throw err;
    }

    const repoMatch = repoUrl.trim().match(GITHUB_REPO_PATTERN);
    if (!repoMatch) {
      const err = new Error(
        'Invalid GitHub repo URL. Expected format: https://github.com/owner/repo'
      );
      err.statusCode = 400;
      throw err;
    }

    // Normalize to clean owner/repo URL — strip .git suffix and extra path
    const cleanRepoUrl = `https://github.com/${repoMatch[1]}/${repoMatch[2].replace(/\.git$/, '')}`;

    console.log(`[REPO-PRS] Fetching open PRs for: ${cleanRepoUrl}`);
    const prs = await fetchRepoPRs(cleanRepoUrl);
    console.log(`[REPO-PRS] Found ${prs.length} open PR(s)`);

    res.json({ prs });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
