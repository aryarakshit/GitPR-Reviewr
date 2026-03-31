import React from 'react';
import { Activity, ShieldAlert, CheckCircle } from 'lucide-react';
import './ImpactPanel.css';

export default function ImpactPanel({ impactAnalysis }) {
  if (!impactAnalysis) return null;

  const { impactAreas = [], overallRisk = 'unknown', mergeBlockers = [] } = impactAnalysis;

  return (
    <div id="section-impact" className="impact-panel card">
      <div className="card-title-wrap">
        <Activity size={16} className="card-title-icon" />
        <span className="card-title-text">Downstream Impact Analysis</span>
        <span className={`badge badge-${overallRisk === 'critical' ? 'high' : overallRisk === 'low' ? 'low' : 'medium'} impact-risk-badge`}>
          {String(overallRisk || 'unknown').toUpperCase()} RISK
        </span>
      </div>

      {mergeBlockers.length > 0 && (
        <div className="impact-blockers">
          <div className="impact-blockers-title">
            <ShieldAlert size={16} />
            <span>MERGE BLOCKERS</span>
          </div>
          <ul className="impact-blockers-list">
            {mergeBlockers.map((blocker, idx) => (
              <li key={`blocker-${idx}`}>{blocker}</li>
            ))}
          </ul>
        </div>
      )}

      {impactAreas.length === 0 ? (
        <div className="impact-empty">
          <CheckCircle size={16} className="empty-icon" />
          <span className="empty-text">No significant downstream impact detected.</span>
        </div>
      ) : (
        <div className="impact-areas">
          {impactAreas.map((area, idx) => (
            <div key={`${area.area}:${idx}`} className="impact-area-item">
              <div className="impact-area-header">
                <strong>{area.area}</strong>
                <span className={`badge badge-${area.riskLevel === 'critical' ? 'high' : area.riskLevel}`}>{area.riskLevel}</span>
              </div>
              <div className="impact-area-details">
                <p><strong>Could break:</strong> {area.couldBreak}</p>
                <p><strong>Remediation:</strong> {area.remediation}</p>
                {area.affectedFiles?.length > 0 && (
                  <p className="impact-affected-files"><strong>Files:</strong> {area.affectedFiles.join(', ')}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}