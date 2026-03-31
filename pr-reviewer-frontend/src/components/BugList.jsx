import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ChevronDown, CheckCircle } from 'lucide-react';
import './BugList.css';

function BugItem({ bug }) {
  const [expanded, setExpanded] = useState(false);

  const severityLabel = {
    critical: 'Critical',
    warning: 'Warning',
    info: 'Info',
  };

  const handleViewDiff = (e) => {
    e.stopPropagation();
    const event = new CustomEvent('view-diff', { detail: { file: bug.file, line: bug.line } });
    window.dispatchEvent(event);
  };

  return (
    <motion.div 
      className={`bug-item ${expanded ? 'expanded' : ''}`}
      layout
      transition={{ layout: { type: "spring", stiffness: 400, damping: 30 } }}
    >
      <div className="bug-item-header-row">
        <button
          className="bug-item-header"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          <span className={`badge badge-${bug.severity}`}>
            {severityLabel[bug.severity] || bug.severity}
          </span>
          <span className="bug-item-issue">{bug.issue || 'Unknown issue'}</span>
          <span className="bug-item-location">
            {bug.file || '?'}:{bug.line || '?'}
          </span>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            className="bug-item-chevron-wrap"
          >
            <ChevronDown size={16} className="bug-item-chevron" />
          </motion.div>
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm bug-item-view-diff"
          onClick={handleViewDiff}
        >
          View in Diff →
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ opacity: { duration: 0.2 }, height: { duration: 0.4, type: "spring", bounce: 0 } }}
            className="bug-item-detail-wrap"
          >
            <div className="bug-item-detail">
              <span className="bug-detail-label">AI Suggestion</span>
              <p>{bug.suggestion}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function BugList({ bugs }) {
  return (
    <div className="bug-list card">
      <div className="card-title-wrap">
        <AlertCircle size={16} className="card-title-icon" />
        <span className="card-title-text">Issues Found</span>
      </div>

      {(!bugs || bugs.length === 0) ? (
        <div className="bug-list-empty">
          <CheckCircle size={16} className="empty-icon" />
          <span className="empty-text">No issues detected by AI</span>
        </div>
      ) : (
        <motion.div layout className="bug-items">
          {bugs.map((bug, i) => (
            <BugItem key={`${bug.file}:${bug.line}:${i}`} bug={bug} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
