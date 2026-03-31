import { motion } from 'framer-motion';

import PRMeta from './PRMeta';
import SummaryCard from './SummaryCard';
import BugList from './BugList';
import ImprovementList from './ImprovementList';
import SecurityPanel from './SecurityPanel';
import ComplexityChart from './ComplexityChart';
import DiffViewer from './DiffViewer';
import VerdictBanner from './VerdictBanner';
import ImpactPanel from './ImpactPanel';
import TestCoveragePanel from './TestCoveragePanel';
import './ReviewResult.css';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 26 } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

export default function ReviewResult({ result }) {
  if (!result) return null;

  const {
    pr, summary, bugs, improvements, score,
    securityIssues, securityScanFailed, impactAnalysis,
    complexityScores, splitSuggestion,
    testGaps, diff,
  } = result;

  return (
    <motion.div
      className="review-result"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      {/* ── Verdict Banner (Full Width) ── */}
      <motion.div variants={fadeUp} className="results-row-full">
        <VerdictBanner result={result} />
      </motion.div>

      {/* ── Row 1 (50/50) ── */}
      <motion.div variants={fadeUp} className="results-row-split-half">
        <div className="results-col">
          <SummaryCard summary={summary} />
        </div>
        <div className="results-col">
          <PRMeta pr={pr} score={score} />
        </div>
      </motion.div>

      {/* ── Impact panel (Full Width) ── */}
      {impactAnalysis && (
        <motion.div variants={fadeUp} className="results-row-full">
          <ImpactPanel impactAnalysis={impactAnalysis} />
        </motion.div>
      )}

      {/* ── Row 2 (33/33/33) ── */}
      <motion.div variants={fadeUp} className="results-row-split-third">
        <div className="results-col">
          <TestCoveragePanel testGaps={testGaps} />
        </div>
        <div className="results-col" id="section-security">
          <SecurityPanel securityIssues={securityIssues} scanFailed={securityScanFailed} />
        </div>
        <div className="results-col" id="section-bugs">
          <BugList bugs={bugs} />
        </div>
      </motion.div>

      {/* ── Complexity Map (Full Width) ── */}
      {complexityScores !== undefined && (
        <motion.div variants={fadeUp} className="results-row-full">
          <ComplexityChart
            complexityScores={complexityScores}
            splitSuggestion={splitSuggestion}
          />
        </motion.div>
      )}

      {/* Optional Improvements */}
      {improvements && improvements.length > 0 && (
         <motion.div variants={fadeUp} className="results-row-full">
            <ImprovementList improvements={improvements} />
         </motion.div>
      )}

      {/* ── Raw Viewers (Full Width) ── */}
      {diff && (
        <motion.div variants={fadeUp} className="results-row-full">
          <DiffViewer diff={diff} />
        </motion.div>
      )}
    </motion.div>
  );
}
