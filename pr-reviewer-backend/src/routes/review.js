const express = require('express');
const { fetchPRData } = require('../services/githubService');
const { analyzeCode, analyzeSecurityIssues, analyzeImpact, analyzeTestCoverage } = require('../services/aiService');
const { analyzeComplexity } = require('../utils/complexityAnalyzer');

const router = express.Router();

const GITHUB_PR_PATTERN =
  /^https?:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/;

/**
 * POST /api/review
 *
 * Accepts a GitHub PR URL, fetches the PR data from GitHub,
 * runs AI analysis (code review + security scan + impact + test gaps),
 * computes complexity scores, and returns a structured response.
 */
router.post('/', async (req, res, next) => {
  try {
    const { prUrl } = req.body;

    // ── Validation ──────────────────────────────────────────
    if (!prUrl || typeof prUrl !== 'string') {
      const err = new Error('Missing required field: prUrl');
      err.statusCode = 400;
      throw err;
    }

    if (!GITHUB_PR_PATTERN.test(prUrl.trim())) {
      const err = new Error(
        'Invalid GitHub PR URL. Expected format: https://github.com/owner/repo/pull/123'
      );
      err.statusCode = 400;
      throw err;
    }

    // ── Fetch PR data from GitHub ───────────────────────────
    console.log(`[REVIEW] Fetching PR data for: ${prUrl.trim()}`);
    const prData = await fetchPRData(prUrl.trim());

    // ── Run AI analysis in parallel ─────────────────────────
    console.log(`[REVIEW] Analyzing PR: "${prData.title}" (${prData.files} files changed)`);

    const prContext = {
      title: prData.title,
      diff: prData.diff,
      filesList: prData.filesList,
    };

    const [aiResult, securityResult, impactAnalysis, testGaps] = await Promise.all([
      analyzeCode(prContext),
      analyzeSecurityIssues(prContext),
      analyzeImpact(prContext),
      analyzeTestCoverage(prContext),
    ]);

    // ── Compute complexity scores using raw diff (not truncated) ──
    const { scores: complexityScores, splitSuggestion } = analyzeComplexity(prData.rawDiff);

    // ── Build response ──────────────────────────────────────
    const response = {
      pr: {
        title: prData.title,
        author: prData.author,
        base: prData.base,
        head: prData.head,
        additions: prData.additions,
        deletions: prData.deletions,
        files: prData.files,
      },
      summary: aiResult.summary,
      bugs: aiResult.bugs,
      improvements: aiResult.improvements,
      score: aiResult.score,

      // Security scan (now includes scanFailed flag)
      securityIssues: securityResult.securityIssues,
      securityScanFailed: securityResult.scanFailed,

      // Complexity scores
      complexityScores,
      splitSuggestion,

      // Test coverage gaps
      testGaps,

      // Raw diff for Diff Viewer
      diff: prData.diff,

      // Impact analysis
      impactAnalysis,
    };

    console.log(
      `[REVIEW] Review complete. Score: ${aiResult.score}/100, Bugs: ${aiResult.bugs.length}, Security: ${securityResult.securityIssues.length}, Suggestions: ${aiResult.improvements.length}`
    );

    res.json(response);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
