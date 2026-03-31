import { Lightbulb } from 'lucide-react';
import './ImprovementList.css';

export default function ImprovementList({ improvements }) {
  if (!improvements || improvements.length === 0) return null;

  return (
    <div className="improvement-list card">
      <div className="card-title-wrap">
        <Lightbulb size={16} className="card-title-icon" />
        <span className="card-title-text">Suggestions</span>
      </div>
      <div className="improvement-items">
        {improvements.map((item, i) => (
          <div key={`${item.category}:${i}`} className="improvement-item">
            <div className="improvement-item-top">
              <span className="improvement-category">{item.category}</span>
              <p className="improvement-desc">{item.description}</p>
            </div>
            {item.codeSnippet && (
              <pre className="improvement-code">
                <code>{item.codeSnippet}</code>
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
