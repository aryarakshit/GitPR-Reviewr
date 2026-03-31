/**
 * Complexity Analyzer — Phase 2 Feature 2
 *
 * Analyzes a unified diff to produce per-file complexity delta scores.
 * Measures how much more (or less) complex each changed file became.
 */

// Keywords that indicate control-flow complexity (/g flag for String.match() to return all matches)
const COMPLEXITY_KEYWORDS = /\b(if|else|for|while|switch|catch|case|try|throw|finally)\b/g;

/**
 * Strip single-line comments and string literals from a line before analysis.
 * This prevents counting keywords inside comments like `// if this fails`
 * or strings like `"switch to dark mode"`.
 */
function stripCommentsAndStrings(line) {
  // Remove string literals (single, double, and template)
  let cleaned = line.replace(/(["'`])(?:(?!\1|\\).|\\.)*\1/g, '""');
  // Remove single-line comments (// ...)
  cleaned = cleaned.replace(/\/\/.*$/, '');
  // Remove inline block comments (/* ... */)
  cleaned = cleaned.replace(/\/\*.*?\*\//g, '');
  return cleaned;
}

/**
 * Split a unified diff into per-file chunks.
 */
function splitDiffByFile(diff) {
  if (!diff) return [];

  const chunks = [];
  const fileSections = diff.split(/^diff --git /m);

  for (const section of fileSections) {
    if (!section.trim()) continue;

    const headerMatch = section.match(/^a\/(.+?) b\/(.+)/m);
    if (!headerMatch) continue;

    const file = headerMatch[2];

    if (section.includes('Binary files')) continue;

    const lines = section.split('\n');
    chunks.push({ file, lines });
  }

  return chunks;
}

/**
 * Count complexity-related keywords in a line (after stripping comments/strings).
 */
function countKeywords(line) {
  const cleaned = stripCommentsAndStrings(line);
  const matches = cleaned.match(COMPLEXITY_KEYWORDS);
  return matches ? matches.length : 0;
}

/**
 * Analyze the complexity delta for a single file chunk from a diff.
 */
function analyzeFileChunk(chunk) {
  let removedLines = 0;
  let addedLines = 0;
  let removedKeywords = 0;
  let addedKeywords = 0;

  for (const line of chunk.lines) {
    // Skip diff headers and markers
    if (line.startsWith('@@') || line.startsWith('diff ') ||
        line.startsWith('index ') || line.startsWith('---') ||
        line.startsWith('+++')) {
      continue;
    }

    if (line.startsWith('-')) {
      removedLines++;
      removedKeywords += countKeywords(line.slice(1));
    } else if (line.startsWith('+')) {
      addedLines++;
      addedKeywords += countKeywords(line.slice(1));
    }
  }

  // Score formula: (keyword_count * 2) + (line_count * 0.5)
  const before = (removedKeywords * 2) + (removedLines * 0.5);
  const after = (addedKeywords * 2) + (addedLines * 0.5);
  const delta = Math.round((after - before) * 100) / 100;

  let verdict;
  if (delta < -2) {
    verdict = 'improved';
  } else if (delta > 2) {
    verdict = 'degraded';
  } else {
    verdict = 'neutral';
  }

  return {
    file: chunk.file,
    before: Math.round(before * 100) / 100,
    after: Math.round(after * 100) / 100,
    delta,
    verdict,
  };
}

/**
 * Analyze complexity deltas for all files in a unified diff.
 */
function analyzeComplexity(diff) {
  if (!diff) return { scores: [], splitSuggestion: null };

  const chunks = splitDiffByFile(diff);
  const scores = [];

  for (const chunk of chunks) {
    const score = analyzeFileChunk(chunk);
    if (score.before > 0 || score.after > 0) {
      scores.push(score);
    }
  }

  const degradedCount = scores.filter(f => f.verdict === 'degraded').length;
  const totalFiles = chunks.length;

  let splitSuggestion = null;
  if (degradedCount >= 3) {
    splitSuggestion = `${degradedCount} files show increased complexity — consider splitting this PR by feature boundary to keep changes reviewable.`;
  } else if (totalFiles > 10) {
    splitSuggestion = `This PR touches ${totalFiles} files — consider splitting it into smaller, focused PRs to reduce review cognitive load.`;
  }

  return { scores, splitSuggestion };
}

module.exports = { analyzeComplexity };
