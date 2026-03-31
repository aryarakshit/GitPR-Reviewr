import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCompare, ChevronDown, ChevronUp } from 'lucide-react';
import './DiffViewer.css';

// A minimal diff parser for split-view layout without external bloated libraries
function parseDiff(diffStr) {
  if (!diffStr) return [];
  const files = [];
  let currentFile = null;

  const lines = diffStr.split('\n');
  lines.forEach((line) => {
    if (line.startsWith('diff --git')) {
      if (currentFile) files.push(currentFile);
      currentFile = { name: line.split(' b/')[1] || 'Unknown', chunks: [] };
    } else if (currentFile) {
      if (line.match(/^index |^\+\+\+ |^--- |^@@ /)) {
        // Skip metadata
      } else {
        currentFile.chunks.push(line);
      }
    }
  });
  if (currentFile) files.push(currentFile);
  return files;
}

function DiffFile({ file }) {
  const leftLines = [];
  const rightLines = [];

  // Track the type of each line ('removed', 'added', 'context', 'empty')
  const leftTypes = [];
  const rightTypes = [];

  file.chunks.forEach((line) => {
    if (line.startsWith('-')) {
      leftLines.push(line.substring(1));
      leftTypes.push('removed');
      rightLines.push(null);
      rightTypes.push('empty');
    } else if (line.startsWith('+')) {
      rightLines.push(line.substring(1));
      rightTypes.push('added');
      leftLines.push(null);
      leftTypes.push('empty');
    } else {
      const content = line.startsWith(' ') ? line.substring(1) : line;
      leftLines.push(content);
      leftTypes.push('context');
      rightLines.push(content);
      rightTypes.push('context');
    }
  });

  const typeClass = { removed: 'diff-removed', added: 'diff-added', context: 'diff-context', empty: 'diff-empty' };

  return (
    <div className="diff-file">
      <div className="diff-file-header">{file.name}</div>
      <div className="diff-split-container">
        {/* Left Side */}
        <div className="diff-pane diff-left">
          {leftLines.map((content, idx) => (
            <div key={`l-${idx}`} className={`diff-line ${typeClass[leftTypes[idx]]}`}>
              <span className="diff-line-number">{idx + 1}</span>
              <span className="diff-line-content">{content === null ? ' ' : content}</span>
            </div>
          ))}
        </div>

        {/* Right Side */}
        <div className="diff-pane diff-right">
          {rightLines.map((content, idx) => (
            <div key={`r-${idx}`} className={`diff-line ${typeClass[rightTypes[idx]]}`}>
              <span className="diff-line-number">{idx + 1}</span>
              <span className="diff-line-content">{content === null ? ' ' : content}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DiffViewer({ diff }) {
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef(null);
  const files = useMemo(() => parseDiff(diff), [diff]);

  useEffect(() => {
    const timeouts = [];

    const handleViewDiff = (e) => {
      const { file, line } = e.detail;
      setExpanded(true);

      const t = setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollIntoView({ behavior: 'smooth' });

          const fileEls = containerRef.current.querySelectorAll('.diff-file');
          for (const fileEl of fileEls) {
            const header = fileEl.querySelector('.diff-file-header');
            if (header && header.textContent.includes(file)) {
              header.scrollIntoView({ behavior: 'smooth', block: 'center' });
              const startLine = parseInt(String(line).match(/\d+/)?.[0] || '1', 10);

              const lineElsRight = fileEl.querySelectorAll('.diff-right .diff-line');
              const lineElsLeft = fileEl.querySelectorAll('.diff-left .diff-line');

              let found = false;

              const checkAndHighlight = (el) => {
                if (el.querySelector('.diff-line-number').textContent === String(startLine)) {
                  el.classList.add('highlight-pulse');
                  const t2 = setTimeout(() => el.classList.remove('highlight-pulse'), 3000);
                  timeouts.push(t2);
                  found = true;
                }
              };

              lineElsRight.forEach(checkAndHighlight);
              lineElsLeft.forEach(checkAndHighlight);

              if (!found) {
                 header.classList.add('highlight-pulse');
                 const t3 = setTimeout(() => header.classList.remove('highlight-pulse'), 3000);
                 timeouts.push(t3);
              }
              break;
            }
          }
        }
      }, 300);
      timeouts.push(t);
    };

    window.addEventListener('view-diff', handleViewDiff);
    return () => {
      window.removeEventListener('view-diff', handleViewDiff);
      timeouts.forEach(clearTimeout);
    };
  }, []);

  if (!diff) return null;

  return (
    <div className="diff-viewer card" id="section-diff" ref={containerRef}>
      <button
        className="card-title-wrap diff-viewer-wrap"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-label={expanded ? 'Collapse diff viewer' : 'Expand diff viewer'}
        style={{ cursor: 'pointer', marginBottom: 0, background: 'transparent', border: 'none', width: '100%' }}
        type="button"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitCompare size={16} className="card-title-icon" />
          <span className="card-title-text">Raw Diff Viewer ({files.length} files)</span>
        </div>
        <span className="btn-icon" aria-hidden="true">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ opacity: { duration: 0.2 }, height: { duration: 0.4, type: "spring", bounce: 0 } }}
            style={{ overflow: 'hidden' }}
          >
            <div className="diff-files-wrap">
              {files.map((file, i) => (
                <DiffFile key={`${file.name}-${i}`} file={file} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
