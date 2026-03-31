import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, ChevronDown, CheckCircle } from 'lucide-react';
import './TestCoveragePanel.css';

function TestGapItem({ gap }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      className={`tcov-item ${expanded ? 'expanded' : ''}`}
      layout
      transition={{ layout: { type: 'spring', stiffness: 400, damping: 30 } }}
    >
      <button
        className="tcov-item-header"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span className="badge badge-warning">No Tests</span>
        <span className="tcov-item-file">{gap.file}</span>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          className="tcov-item-chevron-wrap"
        >
          <ChevronDown size={16} className="tcov-item-chevron" />
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ opacity: { duration: 0.2 }, height: { duration: 0.4, type: 'spring', bounce: 0 } }}
            className="tcov-item-detail-wrap"
          >
            <div className="tcov-item-detail">
              <span className="tcov-detail-label">Why it matters</span>
              <p>{gap.reason}</p>
              {gap.suggestedTestFile && (
                <>
                  <span className="tcov-detail-label">Suggested test file</span>
                  <code className="tcov-suggested-file">{gap.suggestedTestFile}</code>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function TestCoveragePanel({ testGaps }) {
  if (!testGaps) return null;

  return (
    <div className="tcov-panel card">
      <div className="card-title-wrap">
        <FlaskConical size={16} className="card-title-icon" />
        <span className="card-title-text">Test Coverage Gaps</span>
        {testGaps.length > 0 && (
          <span className="badge badge-warning tcov-count">{testGaps.length} untested</span>
        )}
      </div>

      {testGaps.length === 0 ? (
        <div className="tcov-safe">
          <CheckCircle size={16} className="tcov-safe-icon" />
          <span className="tcov-safe-text">All changed source files have corresponding test coverage.</span>
        </div>
      ) : (
        <motion.div layout className="tcov-items">
          {testGaps.map((gap, i) => (
            <TestGapItem key={`${gap.file}:${i}`} gap={gap} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
