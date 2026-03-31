const Groq = require('groq-sdk');

let groqClient = null;

function getAIProvider() {
  if (process.env.GROQ_API_KEY) {
    if (!groqClient) {
      groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return { provider: 'groq', client: groqClient };
  }

  throw new Error("No AI provider keys found. Please set GROQ_API_KEY in the .env file.");
}

const GROQ_MODEL = 'qwen/qwen3-32b';

// AI call timeout (45 seconds — large diffs need more time)
const AI_TIMEOUT_MS = 45_000;

// ─── Prompts ────────────────────────────────────────────────

const SYSTEM_PROMPT = `/no_think You are an expert senior software engineer conducting a thorough code review.
Analyze the provided GitHub Pull Request diff and return a structured JSON review.
Be specific, actionable, and reference actual code from the diff.
Focus on real issues — do not invent problems that aren't there.
Return ONLY valid JSON. No markdown, no explanation outside the JSON.`;

const SECURITY_SYSTEM_PROMPT = `/no_think You are a security-focused code auditor. Scan the diff ONLY for security vulnerabilities.
Look for: hardcoded credentials (API keys, passwords, tokens), SQL injection risks,
XSS vulnerabilities, use of eval/exec, unvalidated user input, insecure HTTP usage,
exposed .env values, weak crypto. Return ONLY JSON. No false positives.`;

const IMPACT_SYSTEM_PROMPT = `/no_think You are a senior software architect analyzing downstream merge risk.
Assess what could break if this PR is merged as-is. Focus on runtime risk, not code style.
Consider: API contract changes, missing migrations, affected dependent services, untested code paths, breaking interface changes.
Return ONLY valid JSON. No markdown, no explanation outside the JSON.`;

const TEST_COVERAGE_SYSTEM_PROMPT = `/no_think You are a test coverage auditor. Analyze which files changed in this PR lack corresponding test coverage changes.
A file lacks coverage if it is modified but no test file (*.test.*, *.spec.*, __tests__/*, test_*.*, *_test.*) for it appears in the diff.
Only flag real source files — skip config, assets, migration files, and lock files.
Return ONLY valid JSON. No markdown, no explanation outside the JSON.`;

function buildUserPrompt({ title, diff, filesList }) {
  return `PR Title: ${title}
Changed Files: ${(filesList || []).join(', ')}

Diff:
${diff || ''}

Return a JSON object with this exact structure:
{
  "summary": "2-3 paragraph plain-English explanation of what changed and why",
  "bugs": [
    {
      "file": "filename",
      "line": "line number or range",
      "severity": "critical|warning|info",
      "issue": "description of the problem",
      "suggestion": "how to fix it"
    }
  ],
  "improvements": [
    {
      "category": "Performance|Security|Readability|Testing|Architecture",
      "description": "what to improve",
      "codeSnippet": "optional improved code example"
    }
  ],
  "score": <integer 0-100 representing overall code quality>
}`;
}

function buildSecurityPrompt({ title, diff, filesList }) {
  return `PR Title: ${title}
Changed Files: ${(filesList || []).join(', ')}

Diff:
${diff || ''}

Scan this diff for security vulnerabilities. Return a JSON object with this exact structure:
{
  "securityIssues": [
    {
      "file": "filename",
      "line": "line number or range",
      "type": "hardcoded-secret|sql-injection|exposed-env|dangerous-function|insecure-pattern",
      "severity": "critical|high|medium",
      "description": "what the vulnerability is",
      "remediation": "how to fix it"
    }
  ]
}

If there are no security issues, return: { "securityIssues": [] }`;
}

function buildImpactPrompt({ title, diff, filesList }) {
  return `PR Title: ${title}
Changed Files: ${(filesList || []).join(', ')}

Diff:
${diff || ''}

Analyze the impact if this PR is merged as-is. Return a JSON object with this exact structure:
{
  "impactAreas": [
    {
      "area": "name of the affected area",
      "riskLevel": "high|medium|low",
      "affectedFiles": ["file1", "file2"],
      "couldBreak": "what could break downstream",
      "remediation": "what to do before merging"
    }
  ],
  "overallRisk": "critical|high|medium|low",
  "mergeBlockers": ["list of absolute blockers that must be fixed before merge. Leave empty if none."]
}

If there is no risk, return empty impactAreas and mergeBlockers, and low overallRisk.`;
}

function buildTestCoveragePrompt({ title, diff, filesList }) {
  return `PR Title: ${title}
Changed Files: ${(filesList || []).join(', ')}

Diff:
${diff || ''}

Identify source files that were modified but have no corresponding test file changes in this diff.
Return a JSON object with this exact structure:
{
  "testGaps": [
    {
      "file": "path/to/source/file.js",
      "reason": "one-line explanation of what logic is untested",
      "suggestedTestFile": "path/to/source/file.test.js"
    }
  ]
}

If every changed source file has test coverage in this diff, return: { "testGaps": [] }`;
}

/**
 * Extract the first top-level JSON object from raw AI output.
 * Handles: markdown fences, <think>...</think> reasoning blocks (qwen/deepseek),
 * and any other text surrounding the JSON.
 *
 * Uses brace-matching to find the correct closing brace instead of lastIndexOf.
 */
function extractJSON(text) {
  let cleaned = text.trim();

  // Strip <think>...</think> blocks emitted by reasoning models
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // Strip markdown code fences
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

  // Find first '{' and match braces to find the correct closing '}'
  const start = cleaned.indexOf('{');
  if (start === -1) return cleaned;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (ch === '\\' && inString) {
      escape = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return cleaned.slice(start, i + 1);
      }
    }
  }

  // Fallback: return from first '{' to last '}'
  const end = cleaned.lastIndexOf('}');
  if (end > start) return cleaned.slice(start, end + 1);

  return cleaned;
}

/**
 * Send a prompt to the active AI provider with a timeout.
 */
async function callAIProvider(systemPrompt, userPrompt) {
  const { provider, client } = getAIProvider();

  if (provider === 'groq') {
    const apiCall = client.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 8192,
    });

    let timer;
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('AI request timed out')), AI_TIMEOUT_MS);
    });

    const response = await Promise.race([apiCall, timeoutPromise]).finally(() => clearTimeout(timer));
    return response.choices[0]?.message?.content || '';
  }

  throw new Error("No active AI provider detected.");
}

/**
 * Analyze PR code and return a structured review.
 */
async function analyzeCode(prContext) {
  try {
    const userPrompt = buildUserPrompt(prContext);
    const responseText = await callAIProvider(SYSTEM_PROMPT, userPrompt);

    const cleaned = extractJSON(responseText);
    const parsed = JSON.parse(cleaned);

    return {
      summary: parsed.summary || 'No summary provided.',
      bugs: Array.isArray(parsed.bugs) ? parsed.bugs : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
      score: typeof parsed.score === 'number'
        ? Math.max(0, Math.min(100, Math.round(parsed.score)))
        : 50,
    };
  } catch (error) {
    console.error('AI code analysis error:', error.message);
    return buildFallbackResponse(
      `AI analysis failed: ${error.message}. Please check your API Keys (.env) and try again.`
    );
  }
}

/**
 * Analyze PR diff for security vulnerabilities.
 * Returns { securityIssues: [], scanFailed: boolean }
 */
async function analyzeSecurityIssues(prContext) {
  try {
    const userPrompt = buildSecurityPrompt(prContext);
    const responseText = await callAIProvider(SECURITY_SYSTEM_PROMPT, userPrompt);

    const cleaned = extractJSON(responseText);
    const parsed = JSON.parse(cleaned);

    return {
      securityIssues: Array.isArray(parsed.securityIssues) ? parsed.securityIssues : [],
      scanFailed: false,
    };
  } catch (error) {
    console.error('AI Security Scan error:', error.message);
    return { securityIssues: [], scanFailed: true };
  }
}

/**
 * Analyze PR diff for downstream impact.
 */
async function analyzeImpact(prContext) {
  try {
    const userPrompt = buildImpactPrompt(prContext);
    const responseText = await callAIProvider(IMPACT_SYSTEM_PROMPT, userPrompt);

    const cleaned = extractJSON(responseText);
    const parsed = JSON.parse(cleaned);

    return {
      impactAreas: Array.isArray(parsed.impactAreas) ? parsed.impactAreas : [],
      overallRisk: parsed.overallRisk || 'unknown',
      mergeBlockers: Array.isArray(parsed.mergeBlockers) ? parsed.mergeBlockers : [],
    };
  } catch (error) {
    console.error('AI Impact Analysis error:', error.message);
    return { impactAreas: [], overallRisk: 'unknown', mergeBlockers: [] };
  }
}

/**
 * Analyze PR diff for test coverage gaps.
 */
async function analyzeTestCoverage(prContext) {
  try {
    const userPrompt = buildTestCoveragePrompt(prContext);
    const responseText = await callAIProvider(TEST_COVERAGE_SYSTEM_PROMPT, userPrompt);

    const cleaned = extractJSON(responseText);
    const parsed = JSON.parse(cleaned);

    return Array.isArray(parsed.testGaps) ? parsed.testGaps : [];
  } catch (error) {
    console.error('AI Test Coverage error:', error.message);
    return [];
  }
}

function buildFallbackResponse(errorNote) {
  return {
    summary: errorNote,
    bugs: [],
    improvements: [],
    score: 50,
  };
}

module.exports = { analyzeCode, analyzeSecurityIssues, analyzeImpact, analyzeTestCoverage };
