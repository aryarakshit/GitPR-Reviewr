import { ShieldAlert, AlertTriangle, CheckCircle } from 'lucide-react';
import './VerdictBanner.css';

export default function VerdictBanner({ result }) {
  if (!result) return null;

  const { score, bugs = [], securityIssues = [], impactAnalysis } = result;

  const mergeBlockers = impactAnalysis?.mergeBlockers || [];
  const hasImpactAreas = impactAnalysis?.impactAreas?.length > 0;
  const criticalBugsCount = bugs.filter(b => b.severity === 'critical').length;
  const criticalSecurityCount = securityIssues.filter(s => ['critical', 'high'].includes(s.severity)).length;
  const mediumSecurityCount = securityIssues.filter(s => s.severity === 'medium').length;

  let status, text, reason, Icon;

  if (mergeBlockers.length > 0 || criticalSecurityCount > 0 || criticalBugsCount > 1 || score < 50) {
    status = 'danger';
    text = 'DO NOT MERGE';
    Icon = ShieldAlert;
    if (mergeBlockers.length > 0) {
      reason = 'Merge blockers detected in downstream impact analysis.';
    } else if (criticalSecurityCount > 0) {
      reason = 'Critical security vulnerabilities detected.';
    } else if (criticalBugsCount > 1) {
      reason = 'Multiple high-severity bugs found.';
    } else {
      reason = 'Code quality score is critically low.';
    }
  } else if (mediumSecurityCount > 0 || criticalBugsCount === 1 || bugs.filter(b => b.severity === 'warning').length > 0 || score < 80) {
    status = 'warning';
    text = 'REVIEW REQUIRED';
    Icon = AlertTriangle;
    reason = 'Some medium-severity issues or borderline score require human attention.';
  } else {
    status = 'success';
    text = 'SAFE TO MERGE';
    Icon = CheckCircle;
    reason = 'High score, no critical bugs, no security issues.';
  }

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={`verdict-banner verdict-${status}`}>
      <div className="verdict-banner-content">
        <div className="verdict-header">
          <Icon size={32} />
          <h2>{text}</h2>
        </div>
        <p className="verdict-reason">{reason}</p>
      </div>
      <div className="verdict-actions">
        {bugs.length > 0 && <button type="button" onClick={() => scrollTo('section-bugs')}>Issues ({bugs.length})</button>}
        {securityIssues.length > 0 && <button type="button" onClick={() => scrollTo('section-security')}>Security ({securityIssues.length})</button>}
        {hasImpactAreas && <button type="button" onClick={() => scrollTo('section-impact')}>Impact</button>}
      </div>
    </div>
  );
}
