import { FileText } from 'lucide-react';
import './SummaryCard.css';

export default function SummaryCard({ summary }) {
  const paragraphs = (summary || 'No summary available.')
    .split(/\n\n|\n/)
    .filter((p) => p.trim().length > 0);

  return (
    <div className="summary-card card">
      <div className="card-title-wrap">
        <FileText size={16} className="card-title-icon" />
        <span className="card-title-text">What Changed</span>
      </div>
      <div className="summary-content">
        {paragraphs.map((p, i) => (
          <p key={`summary-${i}`}>{p.trim()}</p>
        ))}
      </div>
    </div>
  );
}
