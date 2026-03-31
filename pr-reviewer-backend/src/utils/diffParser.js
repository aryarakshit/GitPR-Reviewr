/**
 * Diff parsing utilities.
 * Handles truncation and filename extraction from unified diffs.
 */

/**
 * Truncate a unified diff to a maximum character count.
 * Keeps the first half and last half of the diff with a note in between
 * so that context from both the beginning and end of large diffs is preserved.
 *
 * @param {string} diff - Raw unified diff string
 * @param {number} maxChars - Maximum characters to allow (default 8000)
 * @returns {string} Truncated diff
 */
function truncateDiff(diff, maxChars = 8000) {
  if (!diff || diff.length <= maxChars) {
    return diff || '';
  }

  const truncMsg = '\n\n... [DIFF TRUNCATED — middle section removed to fit context window] ...\n\n';
  const available = Math.max(0, maxChars - truncMsg.length);
  const halfMax = Math.floor(available / 2);
  const firstHalf = diff.slice(0, halfMax);
  const lastHalf = diff.slice(-halfMax);

  return [firstHalf, truncMsg, lastHalf].join('');
}

/**
 * Extract changed filenames from a unified diff.
 * Parses lines matching `+++ b/filename` which indicate the target file in each hunk.
 *
 * @param {string} diff - Raw unified diff string
 * @returns {string[]} Array of changed file paths
 */
function extractFilenames(diff) {
  if (!diff) return [];

  const filenames = [];
  const lines = diff.split('\n');

  for (const line of lines) {
    // Match the +++ b/path/to/file pattern from unified diffs
    const match = line.match(/^\+\+\+ b\/(.+)$/);
    if (match && match[1] !== '/dev/null') {
      filenames.push(match[1]);
    }
  }

  // Deduplicate
  return [...new Set(filenames)];
}

module.exports = { truncateDiff, extractFilenames };
