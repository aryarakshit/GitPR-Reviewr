const axios = require('axios');
const { truncateDiff, extractFilenames } = require('../utils/diffParser');

const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Parse a GitHub PR URL into its component parts.
 *
 * @param {string} prUrl - Full GitHub PR URL (e.g. https://github.com/owner/repo/pull/123)
 * @returns {{ owner: string, repo: string, prNumber: string }}
 * @throws {Error} If the URL doesn't match the expected pattern
 */
function parsePRUrl(prUrl) {
  const pattern = /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/;
  const match = prUrl.match(pattern);

  if (!match) {
    const err = new Error(
      'Invalid GitHub PR URL. Expected format: https://github.com/owner/repo/pull/123'
    );
    err.statusCode = 400;
    throw err;
  }

  return {
    owner: match[1],
    repo: match[2],
    prNumber: Number(match[3]),
  };
}

/**
 * Build common headers for GitHub API requests.
 * Includes Bearer token if GITHUB_TOKEN is set in environment.
 *
 * @returns {object} Headers object
 */
function getHeaders(accept = 'application/vnd.github.v3+json') {
  const headers = {
    Accept: accept,
    'User-Agent': 'PR-Reviewer-Bot',
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

/**
 * Fetch complete PR data from GitHub: metadata + diff.
 *
 * @param {string} prUrl - Full GitHub PR URL
 * @returns {Promise<object>} PR data including title, author, branches, stats, diff, and file list
 * @throws {Error} With appropriate status codes for 404, 403, etc.
 */
async function fetchPRData(prUrl) {
  const { owner, repo, prNumber } = parsePRUrl(prUrl);
  const apiPath = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${prNumber}`;

  let prMeta;
  let rawDiff;

  try {
    // Fetch PR metadata and diff in parallel for speed
    const [metaResponse, diffResponse] = await Promise.all([
      axios.get(apiPath, { headers: getHeaders() }),
      axios.get(apiPath, {
        headers: getHeaders('application/vnd.github.v3.diff'),
      }),
    ]);

    prMeta = metaResponse.data;
    rawDiff = diffResponse.data;
  } catch (error) {
    if (error.response) {
      const status = error.response.status;

      if (status === 404) {
        const err = new Error(
          `Pull request not found: ${owner}/${repo}#${prNumber}. Make sure the repo is public and the PR number is correct.`
        );
        err.statusCode = 404;
        throw err;
      }

      if (status === 429) {
        const err = new Error(
          'GitHub API rate limit exceeded. Add a GITHUB_TOKEN in .env to increase limits.'
        );
        err.statusCode = 429;
        throw err;
      }

      if (status === 403) {
        const err = new Error(
          'Access denied. The repository may be private or your GITHUB_TOKEN lacks permissions.'
        );
        err.statusCode = 403;
        throw err;
      }

      const err = new Error(`GitHub API error: ${error.response.statusText}`);
      err.statusCode = status;
      throw err;
    }

    throw new Error(`Failed to connect to GitHub API: ${error.message}`);
  }

  // Extract and build the structured response
  const diff = truncateDiff(rawDiff, 8000);
  const filesList = extractFilenames(rawDiff);

  return {
    title: prMeta.title,
    author: prMeta.user?.login || 'unknown',
    base: prMeta.base?.ref || 'unknown',
    head: prMeta.head?.ref || 'unknown',
    additions: prMeta.additions || 0,
    deletions: prMeta.deletions || 0,
    files: prMeta.changed_files || 0,
    diff,
    rawDiff,
    filesList,
  };
}

/**
 * Fetch open pull requests for a public GitHub repository.
 *
 * @param {string} repoUrl - GitHub repo URL (e.g. https://github.com/owner/repo)
 * @returns {Promise<Array>} Array of open PR objects
 */
async function fetchRepoPRs(repoUrl) {
  const match = repoUrl.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/?$/);
  if (!match) {
    const err = new Error('Invalid GitHub repo URL. Expected: https://github.com/owner/repo');
    err.statusCode = 400;
    throw err;
  }

  const owner = match[1];
  const repo = match[2].replace(/\.git$/, '');

  try {
    const response = await axios.get(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls?state=open&per_page=20&sort=updated&direction=desc`,
      { headers: getHeaders() }
    );

    return response.data.map(pr => {
      const titleLower = (pr.title || '').toLowerCase();
      const isDraft = pr.draft
        || /\b(wip|draft|do\s*not\s*merge|dnm|in\s*progress|fixup!?|squash\s*me)\b/.test(titleLower);
      const hasNegativeLabel = Array.isArray(pr.labels) && pr.labels.some(label =>
        /wip|draft|do.not.merge|in.progress|blocked|hold|not.ready/i.test(label.name)
      );
      const hasDescription = pr.body && pr.body.trim().length > 20;
      const quality = (!isDraft && !hasNegativeLabel && hasDescription) ? 'Good PR' : 'Needs Improvement (Bad)';
      
      return {
        number: pr.number,
        title: pr.title,
        author: pr.user?.login || 'unknown',
        url: pr.html_url,
        createdAt: pr.created_at,
        base: pr.base?.ref || 'unknown',
        head: pr.head?.ref || 'unknown',
        quality: quality
      };
    });
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      if (status === 404) {
        const err = new Error(`Repository not found: ${owner}/${repo}. Make sure it is public.`);
        err.statusCode = 404;
        throw err;
      }
      if (status === 429) {
        const err = new Error('GitHub API rate limit exceeded. Add a GITHUB_TOKEN in .env to increase limits.');
        err.statusCode = 429;
        throw err;
      }
      if (status === 403) {
        const err = new Error('Access denied. The repository may be private or your GITHUB_TOKEN lacks permissions.');
        err.statusCode = 403;
        throw err;
      }
      const err = new Error(`GitHub API error: ${error.response.statusText}`);
      err.statusCode = status;
      throw err;
    }
    throw new Error(`Failed to connect to GitHub API: ${error.message}`);
  }
}

module.exports = { parsePRUrl, fetchPRData, fetchRepoPRs };
