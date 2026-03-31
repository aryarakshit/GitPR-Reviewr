import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldAlert, ChevronDown } from 'lucide-react';
import './SecurityPanel.css';

function SecurityItem({ issue }) {
  const [expanded, setExpanded] = useState(false);

  const severityClass = {
    critical: 'sec-critical',
    high: 'sec-high',
    medium: 'sec-medium',
  };
  const cls = severityClass[issue.severity] || 'sec-medium';

  return (
    <motion.div
      className={`sec-item ${expanded ? 'expanded' : ''} ${cls}-border`}
      layout
      transition={{ layout: { type: "spring", stiffness: 400, damping: 30 } }}
    >
      <button
        className="sec-item-header"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span className={`badge ${cls}`}>
          {issue.severity || 'unknown'}
        </span>
        <span className="sec-item-type">{issue.type || 'unknown'}</span>
        <span className="sec-item-file">{issue.file || '?'}:{issue.line || '?'}</span>
        
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} className="sec-chevron-wrap">
          <ChevronDown size={16} />
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ opacity: { duration: 0.2 }, height: { duration: 0.4, type: "spring", bounce: 0 } }}
            className="sec-item-detail-wrap"
          >
            <div className="sec-item-detail">
              <span className="sec-detail-label">Vulnerability</span>
              <p>{issue.description}</p>
              
              <span className="sec-detail-label">Remediation</span>
              <p className="sec-remediation">{issue.remediation}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function SecurityPanel({ securityIssues, scanFailed }) {
  const isSafe = !securityIssues || securityIssues.length === 0;
  const criticalCount = securityIssues?.filter(i => i.severity === 'critical').length || 0;

  return (
    <div className={`security-panel card ${!isSafe && criticalCount > 0 ? 'security-danger' : ''}`}>
      <div className="card-title-wrap">
        {isSafe ? (
          <Shield size={16} className="card-title-icon sec-safe-icon" />
        ) : (
          <ShieldAlert size={16} className={`card-title-icon ${criticalCount > 0 ? 'sec-critical-icon' : 'sec-warn-icon'}`} />
        )}
        <span className="card-title-text">Security Scan</span>
      </div>

      {scanFailed ? (
        <div className="sec-danger-banner" style={{ background: 'var(--warning-bg)' }}>
          Security scan could not complete. Results may be incomplete.
        </div>
      ) : isSafe ? (
        <div className="sec-safe-banner">
          <span className="sec-safe-text">No hardcoded secrets or vulnerabilities detected.</span>
        </div>
      ) : (
        <div className="sec-content">
          {criticalCount > 0 && (
            <div className="sec-danger-banner">
              ⚠️ {criticalCount} Critical Security {criticalCount === 1 ? 'Issue' : 'Issues'} Found
            </div>
          )}
          <motion.div layout className="sec-items">
            {securityIssues.map((issue, i) => (
              <SecurityItem key={`${issue.file}:${issue.line}:${i}`} issue={issue} />
            ))}
          </motion.div>
        </div>
      )}
    </div>
  );
}
