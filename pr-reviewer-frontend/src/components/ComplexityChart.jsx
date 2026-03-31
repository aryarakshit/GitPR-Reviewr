import { BarChart2, Scissors } from 'lucide-react';
import './ComplexityChart.css';

function ComplexityBar({ file }) {
  // Normalize visually so the max bar isn't too huge.
  // Using a simple 100px base representation.
  const before = typeof file.before === 'number' ? file.before : 0;
  const after = typeof file.after === 'number' ? file.after : 0;
  const maxRef = Math.max(Math.abs(before), Math.abs(after), 10);
  const beforeWidth = Math.max((before / maxRef) * 100, 2);
  const afterWidth = Math.max((after / maxRef) * 100, 2);

  const delta = typeof file.delta === 'number' ? file.delta : 0;
  const deltaSign = delta > 0 ? '+' : '';
  
  let verdictClass = 'comp-neutral';
  if (file.verdict === 'improved') verdictClass = 'comp-improved';
  if (file.verdict === 'degraded') verdictClass = 'comp-degraded';

  return (
    <div className="comp-item">
      <div className="comp-item-header">
        <span className="comp-file">{file.file}</span>
        <span className={`badge ${verdictClass}`}>
          {deltaSign}{delta}
        </span>
      </div>
      <div className="comp-bars">
        <div className="comp-bar-row">
          <span className="comp-bar-label">Before</span>
          <div className="comp-bar-track">
            <div className="comp-bar-fill comp-bar-before" style={{ width: `${beforeWidth}%` }} />
          </div>
          <span className="comp-bar-val">{file.before}</span>
        </div>
        <div className="comp-bar-row">
          <span className="comp-bar-label">After</span>
          <div className="comp-bar-track">
            <div className={`comp-bar-fill comp-bar-after comp-bg-${file.verdict}`} style={{ width: `${afterWidth}%` }} />
          </div>
          <span className="comp-bar-val">{file.after}</span>
        </div>
      </div>
    </div>
  );
}

export default function ComplexityChart({ complexityScores, splitSuggestion }) {
  if (!complexityScores || complexityScores.length === 0) return null;

  const allNeutral = complexityScores.every(c => c.verdict === 'neutral');

  return (
    <div className="complexity-chart card">
      <div className="card-title-wrap">
        <BarChart2 size={16} className="card-title-icon" />
        <span className="card-title-text">Complexity Delta</span>
      </div>

      {splitSuggestion && (
        <div className="comp-split-banner">
          <Scissors size={14} className="comp-split-icon" />
          <span className="comp-split-text">{splitSuggestion}</span>
        </div>
      )}

      {allNeutral ? (
        <div className="comp-safe-banner">
          <span className="comp-safe-text">~ No significant complexity changes across files.</span>
        </div>
      ) : (
        <div className="comp-items">
          {complexityScores.map((file, i) => (
            <ComplexityBar key={`${file.file}:${i}`} file={file} />
          ))}
        </div>
      )}
    </div>
  );
}
